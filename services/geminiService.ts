import { GoogleGenAI, Type } from "@google/genai";
import type { Puzzle, OrderingPuzzle, VisualPuzzle } from '../types';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

const orderingPuzzleSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['ordering'] },
    title: { type: Type.STRING, description: "عنوان مبتكر لعملية أو مشروع باللغة العربية (مثال: 'خطوات إطلاق حملة تسويقية ناجحة')." },
    steps: {
      type: Type.ARRAY,
      description: "قائمة من 4 خطوات مرتبة بشكل منطقي وصحيح باللغة العربية.",
      items: { type: Type.STRING }
    },
  },
  required: ['type', 'title', 'steps'],
};

const visualPuzzleSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['visual'] },
    question: { type: Type.STRING, description: "سؤال باللغة العربية حول مفهوم ابتكاري يمكن تمثيله بأيقونة (مثال: 'أي رمز يمثل التعاون بين فريق العمل؟')." },
    options: {
      type: Type.ARRAY,
      description: "مصفوفة من 4 أسماء أيقونات باللغة الإنجليزية من القائمة التالية: 'IdeaIcon', 'GrowthIcon', 'CollaborationIcon', 'DataIcon', 'TargetIcon'.",
      items: { type: Type.STRING }
    },
    answer: { type: Type.STRING, description: "اسم الأيقونة الصحيحة من الخيارات المتاحة." }
  },
  required: ['type', 'question', 'options', 'answer'],
};

export const fetchPuzzles = async (count: number, seed?: number): Promise<Puzzle[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate ${count} innovative puzzles in Arabic for a corporate innovation challenge. Provide a mix of 'ordering' and 'visual' puzzle types. 'Ordering' puzzles should be about creative or business processes. 'Visual' puzzles should be about innovation concepts represented by icons.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            puzzles: {
              type: Type.ARRAY,
              description: `An array of exactly ${count} puzzle objects.`,
              items: {
                oneOf: [orderingPuzzleSchema, visualPuzzleSchema]
              }
            }
          },
          required: ['puzzles']
        },
        ...(seed && { seed }),
      },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

    if (parsed.puzzles && Array.isArray(parsed.puzzles) && parsed.puzzles.length > 0) {
      const puzzles: Puzzle[] = parsed.puzzles.map((p: any) => {
        if (p.type === 'ordering') {
          return { ...p, shuffled: [...p.steps].sort(() => Math.random() - 0.5) };
        }
        return p;
      });
      return puzzles.slice(0, count);
    }

    throw new Error('Failed to parse puzzles or puzzles array is empty');
  } catch (error) {
    console.error("Error fetching puzzles from Gemini API:", error);
    // Fallback to mock data if API fails
    const mockPuzzles: Puzzle[] = [
        { type: 'ordering', title: 'خطوات إطلاق منتج جديد', shuffled: ['إجراء أبحاث السوق', 'تطوير المنتج', 'اختبار النسخة التجريبية', 'التسويق والإطلاق'].sort(() => Math.random() - 0.5), steps: ['إجراء أبحاث السوق', 'تطوير المنتج', 'اختبار النسخة التجريبية', 'التسويق والإطلاق'] },
        { type: 'visual', question: 'أي رمز يمثل "النمو" في المشاريع؟', options: ['IdeaIcon', 'GrowthIcon', 'CollaborationIcon', 'DataIcon'], answer: 'GrowthIcon' },
        { type: 'ordering', title: 'مراحل التفكير التصميمي', shuffled: ['التعاطف', 'تحديد المشكلة', 'التفكير', 'النمذجة الأولية', 'الاختبار'].slice(0, 4).sort(() => Math.random() - 0.5), steps: ['التعاطف', 'تحديد المشكلة', 'التفكير', 'النمذجة الأولية', 'الاختبار'].slice(0, 4) },
        { type: 'visual', question: 'أي رمز يمثل "تحليل البيانات"؟', options: ['TargetIcon', 'GrowthIcon', 'CollaborationIcon', 'DataIcon'], answer: 'DataIcon' },
        { type: 'ordering', title: 'خطوات جلسة عصف ذهني فعالة', shuffled: ['تحديد الهدف', 'توليد الأفكار بحرية', 'مناقشة وتجميع الأفكار', 'تحديد أفضل الحلول'].sort(() => Math.random() - 0.5), steps: ['تحديد الهدف', 'توليد الأفكار بحرية', 'مناقشة وتجميع الأفكار', 'تحديد أفضل الحلول'] },
    ];
    return mockPuzzles.slice(0, count);
  }
};

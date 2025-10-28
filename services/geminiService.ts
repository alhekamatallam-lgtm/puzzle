import { GoogleGenAI, Type } from "@google/genai";
import type { Puzzle, OrderingPuzzle, VisualPuzzle } from '../types';

let ai: GoogleGenAI | null = null;
// Generate a large pool of puzzles to select from, reducing repetition.
const PUZZLE_POOL_SIZE = 100;

const getAi = (): GoogleGenAI => {
  if (!ai) {
    ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
  }
  return ai;
}

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

/**
 * Creates a simple seeded pseudo-random number generator (LCG).
 * @param seed The seed for the random number generator.
 * @returns A function that returns the next random number in the sequence.
 */
function createSeededRandom(seed: number) {
    let state = seed;
    // LCG parameters
    const a = 1664525;
    const c = 1013904223;
    const m = 2**32;
    return function() {
        state = (a * state + c) % m;
        return state / m;
    };
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * Can be seeded for deterministic results, which is crucial for party mode.
 * @param array The array to shuffle.
 * @param seed An optional seed for deterministic shuffling.
 * @returns A new shuffled array.
 */
const shuffleArray = <T>(array: T[], seed?: number): T[] => {
    const shuffled = [...array];
    const random = seed !== undefined ? createSeededRandom(seed) : Math.random;
    let currentIndex = shuffled.length;
    let randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [shuffled[currentIndex], shuffled[randomIndex]] = [
            shuffled[randomIndex], shuffled[currentIndex]];
    }

    return shuffled;
}


export const fetchPuzzles = async (count: number, seed?: number): Promise<Puzzle[]> => {
  try {
    const generativeAi = getAi();
    
    // The prompt now requests a larger pool of puzzles to ensure variety.
    let prompt = `Generate ${PUZZLE_POOL_SIZE} innovative puzzles in Arabic for a corporate innovation challenge. Provide a mix of 'ordering' and 'visual' puzzle types. 'Ordering' puzzles should be about creative or business processes. 'Visual' puzzles should be about innovation concepts represented by icons.`;
    
    const departments = [
        'الادارة التنفيذية',
        'المالية',
        'الموارد البشرية',
        'التميز المؤسسي',
        'المساجد',
        'المشاريع',
        'الدراسات والابتكار',
        'الاتصال المؤسسي',
        'تقنية المعلومات',
        'الجودة والتقييم'
    ].join(', ');

    prompt += ` The puzzles must be highly diverse and cover topics from the various departments within our organization. This is crucial to make the game feel inclusive and relevant to everyone. Generate questions related to the following departments: ${departments}. For example, a finance question could be about budget steps, an HR question about the hiring process, and an IT question about cybersecurity best practices. Make the questions unique and avoid repetition between game sessions.`;


    // For solo mode, add an extra layer of randomness to prevent caching and ensure truly unique games.
    if (!seed) {
      prompt += ` Unique identifier: ${Date.now()}`;
    }

    const response = await generativeAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            puzzles: {
              type: Type.ARRAY,
              description: `An array of exactly ${PUZZLE_POOL_SIZE} puzzle objects.`,
              items: {
                oneOf: [orderingPuzzleSchema, visualPuzzleSchema]
              }
            }
          },
          required: ['puzzles']
        },
        // The seed ensures that for a given party code,
        // the generated set of diverse puzzles is consistent for all players.
        ...(seed && { seed }),
      },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

    if (parsed.puzzles && Array.isArray(parsed.puzzles) && parsed.puzzles.length > 0) {
      // Shuffle the entire pool of puzzles. The shuffle is seeded for party mode
      // to ensure all players get the same random subset of questions.
      const allPuzzles = shuffleArray(parsed.puzzles, seed);
      
      // Select the required number of puzzles for the game session.
      const selectedPuzzles = allPuzzles.slice(0, count);

      const puzzles: Puzzle[] = selectedPuzzles.map((p: any) => {
        if (p.type === 'ordering') {
          // This shuffle is for the puzzle steps and should be random for each player.
          return { ...p, shuffled: [...p.steps].sort(() => Math.random() - 0.5) };
        }
        return p;
      });
      return puzzles;
    }

    throw new Error('Failed to parse puzzles or puzzles array is empty');
  } catch (error) {
    console.error("Error fetching puzzles from Gemini API:", error);
    // Fallback to mock data if API fails.
    // To ensure consistency in party mode, we define the base data here
    // and then apply the same seeded shuffling logic as the API path.
    const mockPuzzlesData: (Omit<OrderingPuzzle, 'shuffled'> | VisualPuzzle)[] = [
        { type: 'ordering', title: 'خطوات إطلاق منتج جديد', steps: ['إجراء أبحاث السوق', 'تطوير المنتج', 'اختبار النسخة التجريبية', 'التسويق والإطلاق'] },
        { type: 'visual', question: 'أي رمز يمثل "النمو" في المشاريع؟', options: ['IdeaIcon', 'GrowthIcon', 'CollaborationIcon', 'DataIcon'], answer: 'GrowthIcon' },
        { type: 'ordering', title: 'مراحل التفكير التصميمي', steps: ['التعاطف', 'تحديد المشكلة', 'التفكير', 'النمذجة الأولية', 'الاختبار'].slice(0, 4) },
        { type: 'visual', question: 'أي رمز يمثل "تحليل البيانات"؟', options: ['TargetIcon', 'GrowthIcon', 'CollaborationIcon', 'DataIcon'], answer: 'DataIcon' },
        { type: 'ordering', title: 'خطوات جلسة عصف ذهني فعالة', steps: ['تحديد الهدف', 'توليد الأفكار بحرية', 'مناقشة وتجميع الأفكار', 'تحديد أفضل الحلول'] },
        { type: 'ordering', title: 'خطوات بناء علامة تجارية قوية', steps: ['تحديد هوية العلامة', 'تصميم الشعار', 'بناء استراتيجية المحتوى', 'التفاعل مع الجمهور'] },
        { type: 'visual', question: 'أي رمز يمثل "الفكرة الجديدة"؟', options: ['IdeaIcon', 'GrowthIcon', 'CollaborationIcon', 'DataIcon'], answer: 'IdeaIcon' },
        { type: 'ordering', title: 'عملية حل المشكلات', steps: ['تحديد المشكلة', 'تحليل الأسباب', 'اقتراح الحلول', 'تنفيذ الحل وتقييمه'] },
        { type: 'visual', question: 'أي رمز يمثل "العمل الجماعي"؟', options: ['IdeaIcon', 'GrowthIcon', 'CollaborationIcon', 'DataIcon'], answer: 'CollaborationIcon' },
        { type: 'visual', question: 'أي رمز يمثل "تحقيق الأهداف"؟', options: ['TargetIcon', 'GrowthIcon', 'CollaborationIcon', 'DataIcon'], answer: 'TargetIcon' },
        { type: 'ordering', title: 'خطوات إدارة التغيير في الشركة', steps: ['تشخيص الوضع الحالي', 'وضع خطة التغيير', 'التواصل والتنفيذ', 'التقييم والمتابعة'] },
        { type: 'visual', question: 'أي رمز يمثل "الوصول للهدف الاستراتيجي"؟', options: ['IdeaIcon', 'TargetIcon', 'CollaborationIcon', 'DataIcon'], answer: 'TargetIcon' },
        { type: 'ordering', title: 'مراحل عملية التوظيف', steps: ['تحديد الاحتياج', 'الإعلان عن الوظيفة', 'مقابلة المرشحين', 'الاختيار والتعيين'] },
        { type: 'visual', question: 'أي رمز يمثل "تجميع الأفكار المتنوعة"؟', options: ['IdeaIcon', 'GrowthIcon', 'CollaborationIcon', 'DataIcon'], answer: 'CollaborationIcon' },
        { type: 'ordering', title: 'خطوات إعداد الميزانية السنوية', steps: ['تحديد الأهداف المالية', 'تقدير الإيرادات', 'تقدير النفقات', 'الموافقة والمراقبة'] },
    ];

    // Shuffle the mock data using the seed to ensure all players get the same set.
    const allPuzzles = shuffleArray(mockPuzzlesData, seed);
    const selectedPuzzles = allPuzzles.slice(0, count);

    // Add the randomly shuffled steps for ordering puzzles. This is meant to be
    // different for each player to make the puzzle itself a challenge.
    const puzzles: Puzzle[] = selectedPuzzles.map((p: any) => {
      if (p.type === 'ordering') {
        return { ...p, shuffled: [...p.steps].sort(() => Math.random() - 0.5) };
      }
      return p;
    });
    return puzzles;
  }
};
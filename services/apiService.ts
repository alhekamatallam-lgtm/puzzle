import type { PlayerScore } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbxBffg79j82KZ8KkMbLXsmmD9BYlZbGL1lKaoEmnj8Eb5nX63hNRXEVy6XuEmkjSHBi/exec';
const GAME_START_SIGNAL = '__GAME_START__';

const parseScore = (score: any): number => {
  if (typeof score === 'number') {
    return score;
  }
  if (typeof score === 'string') {
    // Handles "MM:SS" format
    const timePartsMMSS = score.match(/^(\d{1,2}):(\d{2})$/);
    if (timePartsMMSS) {
      const minutes = parseInt(timePartsMMSS[1], 10);
      const seconds = parseInt(timePartsMMSS[2], 10);
      return (minutes * 60 + seconds) * 1000;
    }
    // Handles "HH:MM:SS" format
     const timePartsHHMMSS = score.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (timePartsHHMMSS) {
      const hours = parseInt(timePartsHHMMSS[1], 10);
      const minutes = parseInt(timePartsHHMMSS[2], 10);
      const seconds = parseInt(timePartsHHMMSS[3], 10);
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }
    
    if (!isNaN(Number(score))) {
      return Number(score);
    }
    
    const date = new Date(score);
    if (!isNaN(date.getTime())) {
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const seconds = date.getUTCSeconds();
      const milliseconds = date.getUTCMilliseconds();
      return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds;
    }
  }
  return Infinity;
};

// Helper to format score to MM:SS string
const formatMsToTime = (ms: number) => {
    if (ms === Infinity || isNaN(ms)) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

interface ApiResponseScore {
  gaming: string | number;
  player_name: string;
  score: string | number | null;
  place?: string;
}

const postData = async (payload: Record<string, any>): Promise<any> => {
    let responseText = '';
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload),
            mode: 'cors',
        });

        responseText = await response.text();
        
        if (!responseText) {
            return { success: true };
        }
        
        const data = JSON.parse(responseText);
        if (data.success === false) { 
            throw new Error(data.message || `API Error: ${JSON.stringify(data)}`);
        }
        return data;
    } catch (error) {
        console.error(`API Error during ${payload.action}:`, error);
        if (error instanceof Error && !(error instanceof SyntaxError)) {
            throw error;
        }
        const detailedError = new Error(`API response is not valid JSON. Raw response: ${responseText}`);
        throw detailedError;
    }
};


export const registerPlayer = async (gameCode: string, playerName: string): Promise<any> => {
  const payload = {
    action: 'registerPlayer',
    rsult: 'rsult',
    gaming: gameCode,
    player_name: playerName,
    score: '',
    place: '',
  };
  return await postData(payload);
};

export const signalGameStart = async (gameCode: string): Promise<void> => {
  await registerPlayer(gameCode, GAME_START_SIGNAL);
};

export const updateScore = async (gameCode: string, playerName: string, score: number): Promise<void> => {
    const payload = {
        action: 'updateScore',
        rsult: 'rsult',
        gaming: gameCode,
        player_name: playerName,
        score: formatMsToTime(score)
    };
    await postData(payload);
};

const fetchData = async (params: URLSearchParams): Promise<any> => {
    try {
        const response = await fetch(`${API_URL}?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'API returned success: false');
        }
        return data?.data?.rsult ?? [];
    } catch(error) {
        console.error(`API Error during fetchData with params ${params.toString()}:`, error);
        return [];
    }
}

export const getScores = async (gameCode: string): Promise<PlayerScore[]> => {
    const params = new URLSearchParams();
    params.append('action', 'getScores');
    params.append('gaming', gameCode);
    params.append('rsult', 'rsult');
    params.append('_', new Date().getTime().toString());

    const resultsList: ApiResponseScore[] = await fetchData(params);
    if (Array.isArray(resultsList)) {
      return resultsList
        .filter((item) => String(item.gaming) === gameCode)
        .filter((item) => item.score !== null && item.score !== '' && item.player_name !== GAME_START_SIGNAL)
        .map((item): PlayerScore => ({
          name: item.player_name,
          time: parseScore(item.score),
          place: item.place,
        }));
    }
    return [];
};

export const getAllScores = async (): Promise<PlayerScore[]> => {
    const params = new URLSearchParams();
    params.append('rsult', 'rsult');
    params.append('_', new Date().getTime().toString());

    const resultsList = await fetchData(params);
    if (Array.isArray(resultsList)) {
      return resultsList
        .filter((item: ApiResponseScore) => item.player_name && item.player_name !== GAME_START_SIGNAL)
        .map((item: ApiResponseScore): PlayerScore => ({
          gaming: item.gaming,
          name: item.player_name,
          time: parseScore(item.score),
          place: item.place,
        }));
    }
    return [];
};

export const getLobbyPlayers = async (gameCode: string): Promise<string[]> => {
    const params = new URLSearchParams();
    params.append('action', 'getScores');
    params.append('gaming', gameCode);
    params.append('rsult', 'rsult');
    params.append('_', new Date().getTime().toString());
    
    const resultsList: ApiResponseScore[] = await fetchData(params);
    if (Array.isArray(resultsList)) {
      return resultsList
        .filter(item => String(item.gaming) === gameCode)
        .map(item => item.player_name);
    }
    return [];
};
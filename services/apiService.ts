import type { PlayerScore } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbyEeXmi3ybCfZwXzx6xLoBXdkpua35ErNf1xEY3OKZPmd6PVwxcjTVww5zwBaQn1g9I/exec';

/**
 * A robust parser for the score value received from the API.
 * It can handle numbers, stringified numbers, and the specific date-time
 * format from Google Sheets by converting the time part to milliseconds.
 * @param score The score value from the API.
 * @returns The score in milliseconds.
 */
const parseScore = (score: any): number => {
  if (typeof score === 'number') {
    return score;
  }
  if (typeof score === 'string' && !isNaN(Number(score))) {
    return Number(score);
  }
  if (typeof score === 'string') {
    const date = new Date(score);
    if (!isNaN(date.getTime())) {
      // Google Sheets stores duration as time elapsed since 1899-12-30.
      // We extract the time components to calculate total milliseconds.
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const seconds = date.getUTCSeconds();
      const milliseconds = date.getUTCMilliseconds();
      return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds;
    }
  }
  // Return a very large number if parsing fails, so it appears last.
  return Infinity;
};

interface ApiResponseScore {
  player_name: string;
  score: string | number | null;
}

export const registerPlayer = async (gameCode: string, playerName: string): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append('action', 'registerPlayer');
    formData.append('gameCode', gameCode);
    formData.append('playerName', playerName);

    await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error('Failed to register player:', error);
  }
};

export const updateScore = async (gameCode: string, playerName: string, score: number): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append('action', 'updateScore');
    formData.append('gameCode', gameCode);
    formData.append('playerName', playerName);
    formData.append('score', score.toString());

    await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error('Failed to update score:', error);
  }
};

export const getScores = async (gameCode: string): Promise<PlayerScore[]> => {
  try {
    const response = await fetch(`${API_URL}?action=getScores&gameCode=${gameCode}`);
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.success && data.data.rsult) {
      return data.data.rsult
        .filter((item: ApiResponseScore) => item.score !== null && item.score !== '')
        .map((item: ApiResponseScore): PlayerScore => ({
          name: item.player_name,
          time: parseScore(item.score),
        }));
    }
    return [];
  } catch (error) {
    console.error('Failed to get scores:', error);
    return [];
  }
};

export const getLobbyPlayers = async (gameCode: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_URL}?action=getScores&gameCode=${gameCode}`);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.success && data.data.rsult) {
      return data.data.rsult.map((item: { player_name: string }) => item.player_name);
    }
    return [];
  } catch (error) {
    console.error('Failed to get lobby players:', error);
    return [];
  }
};
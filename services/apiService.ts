import type { PlayerScore } from '../types';

const GAME_START_SIGNAL = '__GAME_START__';

// --- Remote Database Service ---
const API_URL = 'https://script.google.com/macros/s/AKfycbx0ehoZBOxkowsB-vqJHkw-rnRc-86KPkYoRYSoAsDX-wRyrwB_Nj6HMyT4vBN0oHzr/exec';

/**
 * Converts a time string in "mm:ss" format or other strings to milliseconds.
 */
const timeStringToMs = (timeStr: string): number => {
    if (typeof timeStr !== 'string' || !/^\d{2}:\d{2}$/.test(timeStr)) {
        return Infinity;
    }
    const parts = timeStr.split(':');
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    if (isNaN(minutes) || isNaN(seconds)) {
        return Infinity;
    }

    return (minutes * 60 + seconds) * 1000;
};


/**
 * Converts milliseconds to a "mm:ss" time string.
 */
const msToTimeString = (ms: number): string => {
    if (ms === Infinity || isNaN(ms)) {
        return 'N/A'; // Represents an unfinished or initial state
    }
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};


/**
 * Generic function to post data to the Google Sheet.
 */
const postToSheet = async (payload: object) => {
     try {
        await fetch(API_URL, {
            method: 'POST',
            // Using 'text/plain' and 'no-cors' is a common workaround for Google Apps Script web apps
            // that don't handle CORS preflight requests correctly. The request is sent, but the client
            // cannot read the response, which is acceptable for "fire and forget" operations.
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload),
            mode: 'no-cors',
        });
    } catch (error) {
        // Log the error but don't block the UI, as 'no-cors' requests can sometimes throw errors
        // on network issues even if the request might have gone through.
        console.error("Error posting to database (this may be expected with 'no-cors' mode):", error);
    }
};

/**
 * Gets all player scores from the remote Google Sheets database.
 * This is the single source of truth for all game records.
 */
export const getAllScores = async (): Promise<PlayerScore[]> => {
    try {
        // Add a cache-busting parameter to ensure we get the latest data, not a cached response.
        const response = await fetch(`${API_URL}?t=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const apiResponse = await response.json();

        if (apiResponse.success && Array.isArray(apiResponse.data)) {
            const mappedScores: PlayerScore[] = apiResponse.data.map((item: any) => ({
                name: item.player_name,
                points: typeof item.points === 'number' ? item.points : 0,
                time: timeStringToMs(item.score),
                place: item.place,
                gaming: item.gaming,
            }));
            return mappedScores;
        } else {
            console.error("API response format is incorrect.", apiResponse);
            return [];
        }
    } catch (error) {
        console.error("Failed to fetch scores from the remote database:", error);
        return [];
    }
};


/**
 * Registers a joining player in the remote database.
 */
export const registerPlayer = async (code: string, name: string): Promise<void> => {
    const payload = {
      rsult: "Scores",
      player_name: name,
      score: msToTimeString(Infinity), // Initial 'N/A' score
      points: 0,
      gaming: parseInt(code, 10),
      place: "Player",
    };
    await postToSheet(payload);
};


/**
 * Registers the host in the remote database when a party is created.
 */
export const registerHost = async (playerName: string, partyCode: string): Promise<void> => {
    const payload = {
      rsult: "Scores",
      player_name: playerName,
      score: msToTimeString(Infinity), // Initial 'N/A' score
      points: 0,
      gaming: parseInt(partyCode, 10),
      place: "Host",
    };
    await postToSheet(payload);
};


/**
 * Fetches the list of player names for a lobby from the database.
 * Returns a special signal if the game has started.
 */
export const getLobbyPlayers = async (gameCode: string): Promise<string[]> => {
    const allScores = await getAllScores();
    const partyScores = allScores.filter(score => score.gaming?.toString() === gameCode);

    if (partyScores.some(p => p.name === GAME_START_SIGNAL)) {
        return [GAME_START_SIGNAL];
    }

    // Return unique player names, filtering out the start signal
    const playerNames = partyScores
        .filter(p => p.name !== GAME_START_SIGNAL)
        .map(p => p.name);

    return [...new Set(playerNames)]; // Use Set to ensure unique names
};


/**
 * Signals that the game should start by posting a special record to the database.
 */
export const signalGameStart = async (gameCode: string): Promise<void> => {
     const payload = {
      rsult: "Scores",
      player_name: GAME_START_SIGNAL,
      score: msToTimeString(Infinity),
      points: -1,
      gaming: parseInt(gameCode, 10),
    };
    await postToSheet(payload);
};


/**
 * Posts a finished player's final score to the remote Google Sheets database.
 */
export const postScore = async (playerName: string, points: number, time: number, partyCode: string | null): Promise<void> => {
     if (!partyCode) return; // Only post scores for party mode

    const payload = {
      rsult: "Scores",
      player_name: playerName,
      score: msToTimeString(time),
      points: points,
      gaming: parseInt(partyCode, 10),
      // 'place' will be determined later or can be omitted for regular player score updates
    };
    await postToSheet(payload);
};


/**
 * Gets all player scores for a specific party from the database for the results screen.
 */
export const getScores = async (gameCode: string): Promise<PlayerScore[]> => {
    const allScores = await getAllScores();

    // Explicitly filter to get scores only for the current game room.
    const partyScores = allScores.filter(score => {
        // Ensure we have a valid gaming code to compare.
        if (score.gaming === undefined || score.gaming === null) {
            return false;
        }
        // Compare the game code from the database with the current party code.
        return score.gaming.toString() === gameCode;
    });

    // Also, filter out any special system records like the game start signal.
    const finalScores = partyScores.filter(score => score.name !== GAME_START_SIGNAL);

    return finalScores;
};

// Obsolete localStorage functions for multiplayer have been removed.
// Solo leaderboard functionality remains unchanged.
export const updateScore = async (partyCode: string, playerName: string, time: number): Promise<void> => {
    // This function is no longer needed for party mode as it's now fully DB-driven.
    // It is kept to avoid breaking changes if it were used elsewhere, but its body is empty.
};
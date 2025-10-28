import type { PlayerScore } from '../types';

const GAME_START_SIGNAL = '__GAME_START__';

// --- LocalStorage-based Mock API Service for active games ---

// Helper to get a party from localStorage
const getParty = (code: string): { players: PlayerScore[], started: boolean } | null => {
    try {
        const data = localStorage.getItem(`party-${code}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Failed to parse party data from localStorage", e);
        return null;
    }
};

// Helper to save a party to localStorage
const saveParty = (code: string, data: { players: PlayerScore[], started: boolean }) => {
    try {
        localStorage.setItem(`party-${code}`, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save party data to localStorage", e);
    }
};

/**
 * Registers a player for a party. If the party doesn't exist, it creates one.
 */
export const registerPlayer = async (code: string, name: string): Promise<void> => {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 300));

    let party = getParty(code);
    
    if (party && party.started) {
        throw new Error('Game has already started.');
    }

    if (party && party.players.some(p => p.name === name)) {
        throw new Error('Player name is already taken in this room.');
    }
    
    if (!party) {
        party = { players: [], started: false };
    }
    
    party.players.push({ name, time: Infinity });
    saveParty(code, party);
};

/**
 * Fetches the list of player names in a lobby.
 * Returns a special signal if the game has started.
 */
export const getLobbyPlayers = async (gameCode: string): Promise<string[]> => {
    const party = getParty(gameCode);
    if (!party) {
        return [];
    }
    if (party.started) {
        return [GAME_START_SIGNAL];
    }
    return party.players.map(p => p.name);
};

/**
 * Signals that the game should start for all players in the lobby.
 */
export const signalGameStart = async (gameCode: string): Promise<void> => {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 300));
    const party = getParty(gameCode);
    if (!party) {
        throw new Error('Party not found.');
    }
    party.started = true;
    saveParty(gameCode, party);
};

/**
 * Updates a player's score (time) for a given party in localStorage for live results.
 */
export const updateScore = async (partyCode: string, playerName: string, time: number): Promise<void> => {
    const party = getParty(partyCode);
    if (!party) {
        console.error(`Party with code ${partyCode} not found for updating score.`);
        return;
    }
    const player = party.players.find(p => p.name === playerName);
    if (player) {
        player.time = time;
        saveParty(partyCode, party);
    } else {
        console.error(`Player ${playerName} not found in party ${partyCode} for updating score.`);
    }
};

/**
 * Gets all player scores for a specific party from localStorage.
 */
export const getScores = async (gameCode: string): Promise<PlayerScore[]> => {
    const party = getParty(gameCode);
    return party ? party.players : [];
};

/**
 * Converts a time string in "mm:ss" format to milliseconds.
 */
const timeStringToMs = (timeStr: string): number => {
    if (typeof timeStr !== 'string') return Infinity;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return Infinity;

    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    if (isNaN(minutes) || isNaN(seconds)) return Infinity;

    return (minutes * 60 + seconds) * 1000;
};

// --- Remote Database Service ---
const API_URL = 'https://script.google.com/macros/s/AKfycbx0ehoZBOxkowsB-vqJHkw-rnRc-86KPkYoRYSoAsDX-wRyrwB_Nj6HMyT4vBN0oHzr/exec';

/**
 * Gets all player scores from the remote Google Sheets database.
 */
export const getAllScores = async (): Promise<PlayerScore[]> => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const apiResponse = await response.json();

        if (apiResponse.success && Array.isArray(apiResponse.data)) {
            const mappedScores: PlayerScore[] = apiResponse.data.map((item: any) => ({
                name: item.player_name,
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
 * Converts milliseconds to a "mm:ss" time string.
 */
const msToTimeString = (ms: number): string => {
    if (ms === Infinity || isNaN(ms)) {
        return 'N/A';
    }
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

/**
 * Registers the host in the remote database when a party is created.
 */
export const registerHost = async (playerName: string, partyCode: string): Promise<void> => {
    const payload: {
        rsult: string;
        player_name: string;
        score: string;
        gaming?: number;
        place?: string;
    } = {
      rsult: "Scores",
      player_name: playerName,
      score: msToTimeString(Infinity), // "N/A"
      place: "Host",
    };

    const parsedCode = parseInt(partyCode, 10);
    if (!isNaN(parsedCode)) {
        payload.gaming = parsedCode;
    } else {
         console.error("Invalid party code for host registration.");
        return;
    }

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            mode: 'no-cors', // Use no-cors for this type of API endpoint
        });
        console.log('Host registration request sent.');
    } catch (error) {
        console.error("Error registering host to database:", error);
    }
};

/**
 * Posts a finished player score to the remote Google Sheets database.
 */
export const postScore = async (playerName: string, time: number, partyCode: string | null): Promise<void> => {
    const payload: {
        rsult: string;
        player_name: string;
        score: string;
        gaming?: number;
        place?: string; // place is optional
    } = {
      rsult: "Scores",
      player_name: playerName,
      score: msToTimeString(time),
    };

    if (partyCode) {
        const parsedCode = parseInt(partyCode, 10);
        if (!isNaN(parsedCode)) {
            payload.gaming = parsedCode;
        }
    }

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            mode: 'no-cors', // Use no-cors for this type of API endpoint
        });
       console.log('Score posted request sent successfully.');
    } catch (error) {
        console.error("Error posting score to database:", error);
    }
};
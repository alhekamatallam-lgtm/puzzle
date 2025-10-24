import type { PlayerScore } from '../types';

const GAME_START_SIGNAL = '__GAME_START__';

// --- LocalStorage-based Mock API Service ---

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
        // This can happen if polling starts before the player is registered.
        // Returning an empty array is safe.
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
 * Updates a player's score (time) for a given party.
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
 * Gets all player scores for a specific party.
 */
export const getScores = async (gameCode: string): Promise<PlayerScore[]> => {
    const party = getParty(gameCode);
    return party ? party.players : [];
};

/**
 * Gets all player scores from all parties recorded.
 */
export const getAllScores = async (): Promise<PlayerScore[]> => {
    const allScores: PlayerScore[] = [];
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('party-')) {
            const partyCode = key.replace('party-', '');
            const party = getParty(partyCode);
            if (party) {
                // Calculate ranks for finished players within this party
                const finishedPlayers = party.players
                    .filter(p => p.time !== Infinity)
                    .sort((a, b) => a.time - b.time);

                const rankedPlayers = finishedPlayers.map((player, index) => ({
                    ...player,
                    gaming: partyCode,
                    place: (index + 1).toString(),
                }));

                const unfinishedPlayers = party.players
                    .filter(p => p.time === Infinity)
                    .map(player => ({
                        ...player,
                        gaming: partyCode,
                        place: '-',
                    }));
                
                allScores.push(...rankedPlayers, ...unfinishedPlayers);
            }
        }
    });

    // Sort all records by game code, then by rank
    allScores.sort((a, b) => {
        const codeA = a.gaming?.toString() || '';
        const codeB = b.gaming?.toString() || '';
        if (codeA < codeB) return -1;
        if (codeA > codeB) return 1;

        const placeA = a.place === '-' ? Infinity : parseInt(a.place!, 10);
        const placeB = b.place === '-' ? Infinity : parseInt(b.place!, 10);
        return placeA - placeB;
    });

    return allScores;
};

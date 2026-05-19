import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createAsyncStorage } from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";

type UUID = string & { readonly brand: unique symbol };
function generateUUID(): UUID {
  return randomUUID() as UUID;
}

type Role = "undercover" | "citizen" | (string & {});
type Player = { id: UUID; name: string; isAlive: boolean; role?: Role };
type Phase = "lobby" | "revealRole" | "discussion" | "vote" | "results" | "deal";
type WordsPair = { citizen: string; undercover: string };

type PreGameSettingsState = {
  numUndercover: number;
  maxPlayers: number;
};

type PreGameSettingsActions = {
  actions: {
    setPlayer: (count: number) => void;
    setSetup: (playerCount: number, numUndercover: number) => void;
    reset: () => void;
  };
};

const DEFAULT_SETTINGS: PreGameSettingsState = {
  numUndercover: 1,
  maxPlayers: 3,
};

export const usePreGameSettingsStore = create<PreGameSettingsState & PreGameSettingsActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      actions: {
        setPlayer: (count) =>
          set((state) => {
            let newUndercover: number;
            if (count > state.maxPlayers) {
              newUndercover = Math.min(state.numUndercover + 1, 10);
            } else if (count < state.maxPlayers) {
              newUndercover = Math.max(state.numUndercover - 1, 1);
            } else {
              newUndercover = state.numUndercover;
            }
            return { maxPlayers: count, numUndercover: newUndercover };
          }),

        setSetup: (playerCount, numUndercover) => set({ maxPlayers: playerCount, numUndercover }),

        reset: () => set(DEFAULT_SETTINGS),
      },
    }),
    {
      name: "sous_couverture-settings",
      storage: createJSONStorage(() => createAsyncStorage("sous_couverture-settings")),
      partialize: (state) => ({
        numUndercover: state.numUndercover,
        maxPlayers: state.maxPlayers,
      }),
    },
  ),
);

type GameState = {
  gameId: string;
  players: Player[];
  rolesPool: string[];
  phase: Phase;
  meta: { createdAt?: number; updatedAt?: number; version: number };
};

type GameActions = {
  actions: {
    addPlayer: (name: string) => void;
    removePlayer: (id: string) => void;
    reset: () => void;
    newGame: (wordsPair: WordsPair) => void;
    dealRoles: (wordsPair: WordsPair) => void;
    finalizePlayers: (wordsPair: WordsPair) => void;
    killPlayer: (id: string) => void;
    checkVictoryAndAdvance: () => "village" | "undercover" | null;
  };
};

const DEFAULT_GAME_STATE: GameState = {
  gameId: generateUUID(),
  players: [],
  rolesPool: [],
  phase: "lobby",
  meta: { version: 1, updatedAt: Date.now(), createdAt: Date.now() },
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_GAME_STATE,
      actions: {
        addPlayer: (name) =>
          set((state) => {
            const { maxPlayers } = usePreGameSettingsStore.getState();
            if (state.players.length >= maxPlayers) return state;
            const player: Player = { id: generateUUID(), name, isAlive: true };
            return {
              players: [...state.players, player],
              meta: { ...state.meta, updatedAt: Date.now() },
            };
          }),

        removePlayer: (id) =>
          set((state) => ({
            players: state.players.filter((p) => p.id !== id),
            meta: { ...state.meta, updatedAt: Date.now() },
          })),

        newGame: (wordsPair) => {
          set((state) => ({
            players: state.players.map((p) => ({ ...p, isAlive: true, role: undefined })),
            rolesPool: [],
            phase: "lobby",
            meta: { version: 1, updatedAt: Date.now(), createdAt: Date.now() },
          }));
          get().actions.dealRoles(wordsPair);
        },

        finalizePlayers: (wordsPair) => {
          const { players } = get();
          const { maxPlayers, numUndercover } = usePreGameSettingsStore.getState();
          if (players.length !== maxPlayers) return;
          if (numUndercover < 1 || numUndercover >= players.length) return;
          get().actions.dealRoles(wordsPair);
        },

        reset: () =>
          set({
            ...DEFAULT_GAME_STATE,
            gameId: generateUUID(),
            meta: { version: 1, updatedAt: Date.now(), createdAt: Date.now() },
          }),

        dealRoles: (wordsPair) =>
          set((state) => {
            const { numUndercover } = usePreGameSettingsStore.getState();
            const total = state.players.length;
            const numU = Math.min(numUndercover, Math.max(1, Math.floor(total / 4)));
            const shuffled = [...state.players].sort(() => 0.5 - Math.random());
            const newPlayers = shuffled.map((p, idx) => ({
              ...p,
              role: (idx < numU ? "undercover" : "citizen") as Role,
            }));
            return {
              players: newPlayers,
              rolesPool: [wordsPair.citizen, wordsPair.undercover],
              phase: "deal",
              meta: { ...state.meta, updatedAt: Date.now() },
            };
          }),

        killPlayer: (id) => {
          set((state) => ({
            players: state.players.map((p) => (p.id === id ? { ...p, isAlive: false } : p)),
            meta: { ...state.meta, updatedAt: Date.now() },
          }));
          get().actions.checkVictoryAndAdvance();
        },

        checkVictoryAndAdvance: (): "village" | "undercover" | null => {
          const alive = get().players.filter((p) => p.isAlive);
          const undercoverAlive = alive.filter((p) => p.role === "undercover").length;
          const citizensAlive = alive.filter((p) => p.role !== "undercover").length;

          if (alive.length === 0) return null;

          if (undercoverAlive === 0) {
            set((state) => ({ phase: "results", meta: { ...state.meta, updatedAt: Date.now() } }));
            return "village";
          }

          if (undercoverAlive >= citizensAlive) {
            set((state) => ({ phase: "results", meta: { ...state.meta, updatedAt: Date.now() } }));
            return "undercover";
          }

          set((state) => ({ phase: "discussion", meta: { ...state.meta, updatedAt: Date.now() } }));
          return null;
        },
      },
    }),
    {
      name: "sous_couverture-game",
      storage: createJSONStorage(() => createAsyncStorage("sous_couverture-game")),
      partialize: (state) => ({
        gameId: state.gameId,
        players: state.players,
        rolesPool: state.rolesPool,
        phase: state.phase,
        meta: state.meta,
      }),
    },
  ),
);

type PlayerName = { id: UUID; name: string };
type FormerPlayers = {
  players: PlayerName[];
  savePlayer: (name: string) => void;
};

export const usePlayerNameStore = create<FormerPlayers>()(
  persist(
    (set) => ({
      players: [],
      savePlayer: (name) =>
        set((state) => ({
          players: [...state.players, { id: generateUUID(), name }],
        })),
    }),
    {
      name: "sous_couverture_players_name",
      storage: createJSONStorage(() => createAsyncStorage("sous_couverture_players_name")),
    },
  ),
);

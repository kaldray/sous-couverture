import { create, createStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createAsyncStorage } from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";

type UUID = string & { readonly brand: unique symbol };

function generateUUID(): UUID {
  return randomUUID() as UUID;
}

type Role = "undercover" | "citizen" | (string & {});
type Player = { id: UUID; name: string; isAlive: boolean; role?: Role };
type PlayerName = { id: UUID; name: string };
type FormerPlayers = {
  players: PlayerName[];
  savePlayer: (name: string) => void;
};

type Settings = {
  numUndercover: number;
  timerSec: number | null;
  maxPlayers: number;
};

type Phase = "lobby" | "revealRole" | "discussion" | "vote" | "results" | "deal";
type WordsPair = { citizen: string; undercover: string };

export interface GameState {
  gameId: string;
  players: Player[];
  rolesPool: string[];
  settings: Settings;
  phase: Phase;
  meta: { createdAt?: number; updatedAt?: number; version: number };
}

interface GameAction {
  setSetup: (playerCount: number, numUndercover: number) => void;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  reset: () => void;
  newGame: (wordsPair: WordsPair) => void;
  dealRoles: (wordsPair: WordsPair) => void;
  finalizePlayers: (wordsPair: WordsPair) => void;
  killPlayer: (id: string) => void;
  checkVictoryAndAdvance: () => "village" | "undercover" | null;
}

interface Game extends GameAction, GameState {}

export type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = (initProps: GameState) => {
  const defaultProps: Partial<GameState> = {
    gameId: generateUUID(),
    phase: "lobby",
    meta: { version: 1, updatedAt: Date.now(), createdAt: Date.now() },
  };
  return createStore<Game>()(
    persist(
      (set, get) => ({
        ...defaultProps,
        ...initProps,
        setSetup: (playerCount, numUndercover) =>
          set((state) => ({
            settings: {
              ...state.settings,
              maxPlayers: playerCount,
              numUndercover,
            },
            meta: { ...state.meta, updatedAt: Date.now() },
          })),
        addPlayer: (name) =>
          set((state) => {
            if (state.players.length >= state.settings.maxPlayers) return state;
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
            players: state.players.map((p) => ({
              ...p,
              isAlive: true,
              role: undefined,
            })),
            rolesPool: [],
            phase: "lobby",
            meta: { version: 1, updatedAt: Date.now(), createdAt: Date.now() },
          }));
          get().dealRoles(wordsPair);
        },

        finalizePlayers: (wordsPair) => {
          const { players, settings } = get();
          if (players.length !== settings.maxPlayers) return;
          if (settings.numUndercover < 1 || settings.numUndercover >= players.length) return;
          get().dealRoles(wordsPair);
        },

        reset: () =>
          set({
            gameId: generateUUID(),
            players: [],
            rolesPool: [],
            settings: { numUndercover: 1, timerSec: null, maxPlayers: 12 },
            phase: "lobby",
            meta: { version: 1, updatedAt: Date.now(), createdAt: Date.now() },
          }),

        dealRoles: (wordsPair) =>
          set((state) => {
            const total = state.players.length;
            const numU = Math.min(state.settings.numUndercover, Math.max(1, Math.floor(total / 4)));
            const shuffled = [...state.players].sort(() => 0.5 - Math.random());
            const newPlayers = shuffled.map((p, idx) => ({
              ...p,
              role: idx < numU ? "undercover" : "citizen",
            }));

            const rolesPool = [wordsPair.citizen, wordsPair.undercover];
            return {
              players: newPlayers,
              rolesPool,
              phase: "deal",
              meta: { ...state.meta, updatedAt: Date.now() },
            };
          }),

        killPlayer: (id) => {
          set((state) => ({
            players: state.players.map((p) => (p.id === id ? { ...p, isAlive: false } : p)),
            meta: { ...state.meta, updatedAt: Date.now() },
          }));
          get().checkVictoryAndAdvance();
        },
        checkVictoryAndAdvance: (): "village" | "undercover" | null => {
          const players = get().players || [];
          const alive = players.filter((p) => p.isAlive);
          const undercoverAlive = alive.filter((p) => p.role === "undercover").length;
          const citizensAlive = alive.filter((p) => p.role !== "undercover").length;

          if (alive.length === 0) return null;

          if (undercoverAlive === 0) {
            set((state) => ({
              phase: "results",
              meta: { ...state.meta, updatedAt: Date.now() },
            }));
            return "village";
          }

          if (undercoverAlive >= citizensAlive) {
            set((state) => ({
              phase: "results",
              meta: { ...state.meta, updatedAt: Date.now() },
            }));
            return "undercover";
          }

          set((state) => ({
            phase: "discussion",
            meta: { ...state.meta, updatedAt: Date.now() },
          }));
          return null;
        },
      }),
      {
        name: "sous_couverture-storage",
        storage: createJSONStorage(() => createAsyncStorage("sous_couverture-storage")),
        partialize: (state) => ({
          id: state.gameId,
          players: state.players,
          settings: state.settings,
          phase: state.phase,
          meta: state.meta,
          rolesPool: state.rolesPool,
        }),
      },
    ),
  );
};

export const usePlayerNameStore = create<FormerPlayers>()(
  persist(
    (set, _) => ({
      players: [],
      savePlayer: (name) => {
        set((p) => {
          const newPlayer: PlayerName = { id: generateUUID(), name };
          const newPlayers = [...p.players, newPlayer];
          return { players: newPlayers };
        });
      },
    }),
    {
      name: "sous_couverture_players_name",
      storage: createJSONStorage(() => createAsyncStorage("sous_couverture_players_name")),
    },
  ),
);

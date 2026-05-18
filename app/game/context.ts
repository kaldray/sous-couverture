import { createContext, use } from "react";
import { GameState, GameStore } from "./store";
import { useStore } from "zustand";

export const GameContext = createContext<GameStore | null>(null);

export function useGameContext<T>(selector: (state: GameState) => T): T {
  const store = use(GameContext);
  if (!store) throw new Error("Missing GameContext in the tree");
  return useStore(store, selector);
}

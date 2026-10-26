import { create } from "zustand";
import { vehicles as seed, Status, Vehicle } from "./data";

export type Filter = "all" | Status;

interface FleetState {
  vehicles: Vehicle[];
  checked: Record<number, boolean>;
  selectedId: number;
  filter: Filter;
  query: string;
  follow: boolean;
  select: (id: number) => void;
  setChecked: (ids: number[], on: boolean) => void;
  clearChecked: () => void;
  setFilter: (f: Filter) => void;
  setQuery: (q: string) => void;
  toggleFollow: () => void;
}

export const useFleet = create<FleetState>((set) => ({
  vehicles: seed,
  checked: { 0: true, 1: true, 2: true, 6: true, 13: true },
  selectedId: 1,
  filter: "all",
  query: "",
  follow: true,
  select: (id) => set((s) => ({ selectedId: id, checked: { ...s.checked, [id]: true } })),
  setChecked: (ids, on) =>
    set((s) => {
      const next = { ...s.checked };
      ids.forEach((id) => {
        next[id] = on;
      });
      return { checked: next };
    }),
  clearChecked: () => set({ checked: {} }),
  setFilter: (filter) => set({ filter }),
  setQuery: (query) => set({ query }),
  toggleFollow: () => set((s) => ({ follow: !s.follow })),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Appearance = "classic" | "orbital";

interface AppearanceState {
  appearance: Appearance;
  toggleAppearance: () => void;
}

// Keep the server and first client render on the original design.
export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      appearance: "classic",
      toggleAppearance: () =>
        set((state) => ({
          appearance: state.appearance === "classic" ? "orbital" : "classic",
        })),
    }),
    {
      name: "hobby-channel-appearance-storage",
      skipHydration: true,
      partialize: (state) => ({ appearance: state.appearance }),
      merge: (persisted, current) => ({
        ...current,
        appearance:
          (persisted as Partial<AppearanceState> | undefined)?.appearance ===
          "orbital"
            ? "orbital"
            : "classic",
      }),
    },
  ),
);

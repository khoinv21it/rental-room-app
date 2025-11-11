import { create } from "zustand";

export interface FavoriteState {
  favoriteRoomIds: Set<string>;
  isLoading: boolean;
  isInitialized: boolean;
  setFavoriteRoomIds: (ids: string[]) => void;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  setLoading: (v: boolean) => void;
}

const useFavoriteStore = create<FavoriteState>((set) => ({
  favoriteRoomIds: new Set<string>(),
  isLoading: false,
  isInitialized: false,
  setFavoriteRoomIds: (ids: string[]) =>
    set(() => ({ favoriteRoomIds: new Set(ids), isInitialized: true })),
  addFavorite: (id: string) =>
    set((state) => {
      const s = new Set(state.favoriteRoomIds);
      s.add(id);
      return { favoriteRoomIds: s };
    }),
  removeFavorite: (id: string) =>
    set((state) => {
      const s = new Set(state.favoriteRoomIds);
      s.delete(id);
      return { favoriteRoomIds: s };
    }),
  setLoading: (v: boolean) => set(() => ({ isLoading: v })),
}));

export default useFavoriteStore;

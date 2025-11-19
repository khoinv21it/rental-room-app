import { create } from "zustand";

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationState {
  // Current location
  location: LocationData | null;

  // Loading state
  isSearching: boolean;

  // Saved user preferences (for logged-in users)
  savedPreferences: {
    provinceId?: string;
    districtId?: string;
    wardId?: string;
    latitude?: number;
    longitude?: number;
  } | null;

  // Actions
  setLocation: (location: LocationData | null) => void;
  setIsSearching: (searching: boolean) => void;
  setSavedPreferences: (preferences: any) => void;
  clearLocation: () => void;
}

const useLocationStore = create<LocationState>((set) => ({
  location: null,
  isSearching: false,
  savedPreferences: null,

  setLocation: (location) => set({ location }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setSavedPreferences: (preferences) => set({ savedPreferences: preferences }),
  clearLocation: () =>
    set({ location: null, isSearching: false, savedPreferences: null }),
}));

export default useLocationStore;

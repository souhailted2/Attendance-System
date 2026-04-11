import { useState, useCallback, createContext, useContext, useEffect } from "react";

const KEY = "owner_favorite_employees";

function readFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

export const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
});

export function useFavoritesProvider(): FavoritesContextValue {
  const [favorites, setFavorites] = useState<string[]>(readFromStorage);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) {
        setFavorites(readFromStorage());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}

export function useFavorites() {
  return useContext(FavoritesContext);
}

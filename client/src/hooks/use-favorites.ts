import { useState, useCallback } from "react";

const KEY = "owner_favorite_employees";

function readFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeToStorage(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(readFromStorage);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeToStorage(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

export interface Category {
  id: number;
  name: string;
  code: string;
}

interface CategoryState {
  categories: Category[];
  lastFetched: number | null;
  fetchCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: [],
      lastFetched: null,
      fetchCategories: async () => {
        const { lastFetched, categories } = get();
        const oneDay = 24 * 60 * 60 * 1000;
        
        // Use cache if it's less than 1 day old and we have data
        if (categories.length > 0 && lastFetched && Date.now() - lastFetched < oneDay) {
          return;
        }

        try {
          const res = await api.get("/categories");
          set({
            categories: res.data || [],
            lastFetched: Date.now(),
          });
        } catch (err) {
          console.error("Failed to load categories", err);
        }
      },
    }),
    {
      name: "issue_categories_storage", // unique name for localStorage key
    }
  )
);

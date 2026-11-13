import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Falta configurar VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export type List = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  list_id: string;
  name: string;
  created_at: string;
};

export type ItemType = 'component' | 'action';

export type ListItem = {
  id: string;
  list_id: string;
  type: ItemType;
  title: string;
  quantity?: number;
  due_date?: string | null;
  is_completed: boolean;
  applies_to_all: boolean;
  created_at: string;
  categories?: Category[];
};

export type ItemCategory = {
  item_id: string;
  category_id: string;
};

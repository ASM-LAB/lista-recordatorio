import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://izqubzbaiuknewrnbrsl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3-aRTioL3jsIjARu_WRmQQ_FUt_8JAi";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  is_completed: boolean;
  applies_to_all: boolean;
  created_at: string;
  categories?: Category[];
};

export type ItemCategory = {
  item_id: string;
  category_id: string;
};

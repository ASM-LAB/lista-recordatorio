import React, { useState, useEffect, useCallback } from 'react';
import { supabase, List, Category, ListItem, ItemType } from './lib/supabase';
import { AuthView } from './components/AuthView';
import { ListsOverview } from './components/ListsOverview';
import { ListDetail } from './components/ListDetail';
import { LogOut, ListChecks, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [lists, setLists] = useState<List[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ListItem[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchLists = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLists(data);
    }
  }, [session]);

  const fetchListDetailData = useCallback(async (listId: string) => {
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    if (catData) setCategories(catData);

    const { data: itemData } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    if (itemData && itemData.length > 0) {
      const itemIds = itemData.map((i) => i.id);
      const { data: itemCatData } = await supabase
        .from('item_categories')
        .select('item_id, category_id')
        .in('item_id', itemIds);

      const catMap = new Map((catData || []).map((c) => [c.id, c]));

      const itemsWithCats: ListItem[] = itemData.map((item) => {
        const linkedCatIds = (itemCatData || [])
          .filter((ic) => ic.item_id === item.id)
          .map((ic) => ic.category_id);

        const linkedCategories = linkedCatIds
          .map((id) => catMap.get(id))
          .filter(Boolean) as Category[];

        return {
          ...item,
          categories: linkedCategories,
        };
      });

      setItems(itemsWithCats);
    } else {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchLists();
    } else {
      setLists([]);
      setSelectedListId(null);
      setCategories([]);
      setItems([]);
    }
  }, [session, fetchLists]);

  useEffect(() => {
    if (selectedListId) {
      fetchListDetailData(selectedListId);
    } else {
      setCategories([]);
      setItems([]);
    }
  }, [selectedListId, fetchListDetailData]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lists' },
        () => {
          fetchLists();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          if (selectedListId) fetchListDetailData(selectedListId);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'list_items' },
        () => {
          if (selectedListId) fetchListDetailData(selectedListId);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'item_categories' },
        () => {
          if (selectedListId) fetchListDetailData(selectedListId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, selectedListId, fetchLists, fetchListDetailData]);

  const handleCreateList = async (title: string, description: string) => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('lists')
      .insert({
        title,
        description,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (!error && data) {
      await fetchLists();
      setSelectedListId(data.id);
    }
  };

  const handleDeleteList = async (listId: string) => {
    const { error } = await supabase.from('lists').delete().eq('id', listId);
    if (!error) {
      if (selectedListId === listId) {
        setSelectedListId(null);
      }
      await fetchLists();
    }
  };

  const handleAddCategory = async (name: string) => {
    if (!selectedListId) return;
    await supabase.from('categories').insert({
      list_id: selectedListId,
      name,
    });
    await fetchListDetailData(selectedListId);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!selectedListId) return;
    await supabase.from('categories').delete().eq('id', categoryId);
    await fetchListDetailData(selectedListId);
  };

  const handleAddItem = async (
    type: ItemType,
    title: string,
    appliesToAll: boolean,
    categoryIds: string[]
  ) => {
    if (!selectedListId) return;

    const { data: newItem, error } = await supabase
      .from('list_items')
      .insert({
        list_id: selectedListId,
        type,
        title,
        applies_to_all: appliesToAll,
      })
      .select()
      .single();

    if (!error && newItem && !appliesToAll && categoryIds.length > 0) {
      const rows = categoryIds.map((catId) => ({
        item_id: newItem.id,
        category_id: catId,
      }));
      await supabase.from('item_categories').insert(rows);
    }

    await fetchListDetailData(selectedListId);
  };

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    await supabase
      .from('list_items')
      .update({ is_completed: isCompleted })
      .eq('id', itemId);

    if (selectedListId) await fetchListDetailData(selectedListId);
  };

  const handleDeleteItem = async (itemId: string) => {
    await supabase.from('list_items').delete().eq('id', itemId);
    if (selectedListId) await fetchListDetailData(selectedListId);
  };

  const handleResetList = async () => {
    if (!selectedListId) return;
    await supabase
      .from('list_items')
      .update({ is_completed: false })
      .eq('list_id', selectedListId);

    await fetchListDetailData(selectedListId);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          <RefreshCw className="animate-spin text-blue-600" size={24} />
          Cargando aplicación...
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthView />;
  }

  const selectedList = lists.find((l) => l.id === selectedListId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            onClick={() => setSelectedListId(null)}
            className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800 text-lg hover:opacity-80 transition"
          >
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
              <ListChecks size={22} />
            </div>
            <span>Recordatorios</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              {session.user.email}
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-slate-600 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-12">
        {selectedListId && selectedList ? (
          <ListDetail
            list={selectedList}
            categories={categories}
            items={items}
            onBack={() => setSelectedListId(null)}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddItem={handleAddItem}
            onToggleItem={handleToggleItem}
            onDeleteItem={handleDeleteItem}
            onResetList={handleResetList}
          />
        ) : (
          <ListsOverview
            lists={lists}
            selectedListId={selectedListId}
            onSelectList={(id) => setSelectedListId(id)}
            onCreateList={handleCreateList}
            onDeleteList={handleDeleteList}
          />
        )}
      </main>
    </div>
  );
};

-- ESQUEMA DE BASE DE DATOS PARA SUPABASE
-- Copia y ejecuta este script en el SQL Editor de tu panel de Supabase para configurar las tablas, políticas RLS y la transmisión en tiempo real.

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Listas de Recordatorios
CREATE TABLE IF NOT EXISTS public.lr_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Categorías (pertenecientes a una Lista)
CREATE TABLE IF NOT EXISTS public.lr_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES public.lr_lists(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(list_id, name)
);

-- 4. Tabla de Elementos (Componentes y Acciones)
CREATE TABLE IF NOT EXISTS public.lr_list_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES public.lr_lists(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('component', 'action')),
    title VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    applies_to_all BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla Relacional de Elementos y Categorías (Muchos a Muchos)
CREATE TABLE IF NOT EXISTS public.lr_item_categories (
    item_id UUID NOT NULL REFERENCES public.lr_list_items(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.lr_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, category_id)
);

-- ----------------------------------------------------
-- HABILITAR SEGURIDAD A NIVEL DE FILA (RLS - Row Level Security)
-- ----------------------------------------------------

ALTER TABLE public.lr_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lr_item_categories ENABLE ROW LEVEL SECURITY;

-- Politicas para 'lr_lists'
CREATE POLICY "Usuarios pueden gestionar sus propias listas"
ON public.lr_lists FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politicas para 'lr_categories'
CREATE POLICY "Usuarios pueden gestionar categorias de sus listas"
ON public.lr_categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.lr_lists
        WHERE lr_lists.id = lr_categories.list_id AND lr_lists.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.lr_lists
        WHERE lr_lists.id = lr_categories.list_id AND lr_lists.user_id = auth.uid()
    )
);

-- Politicas para 'lr_list_items'
CREATE POLICY "Usuarios pueden gestionar elementos de sus listas"
ON public.lr_list_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.lr_lists
        WHERE lr_lists.id = lr_list_items.list_id AND lr_lists.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.lr_lists
        WHERE lr_lists.id = lr_list_items.list_id AND lr_lists.user_id = auth.uid()
    )
);

-- Politicas para 'lr_item_categories'
CREATE POLICY "Usuarios pueden gestionar relacion elemento-categoria"
ON public.lr_item_categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.lr_list_items
        JOIN public.lr_lists ON lr_lists.id = lr_list_items.list_id
        WHERE lr_list_items.id = lr_item_categories.item_id AND lr_lists.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.lr_list_items
        JOIN public.lr_lists ON lr_lists.id = lr_list_items.list_id
        WHERE lr_list_items.id = lr_item_categories.item_id AND lr_lists.user_id = auth.uid()
    )
);

-- ----------------------------------------------------
-- ACTIVAR SUPABASE REALTIME
-- ----------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.lr_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lr_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lr_list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lr_item_categories;

-- ESQUEMA DE BASE DE DATOS PARA SUPABASE
-- Copia y ejecuta este script en el SQL Editor de tu panel de Supabase para configurar las tablas, políticas RLS y la transmisión en tiempo real.

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Listas de Recordatorios
CREATE TABLE IF NOT EXISTS public.lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Categorías (pertenecientes a una Lista)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(list_id, name)
);

-- 4. Tabla de Elementos (Componentes y Acciones)
CREATE TABLE IF NOT EXISTS public.list_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('component', 'action')),
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    applies_to_all BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla Relacional de Elementos y Categorías (Muchos a Muchos)
CREATE TABLE IF NOT EXISTS public.item_categories (
    item_id UUID NOT NULL REFERENCES public.list_items(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, category_id)
);

-- ----------------------------------------------------
-- HABILITAR SEGURIDAD A NIVEL DE FILA (RLS - Row Level Security)
-- ----------------------------------------------------

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;

-- Politicas para 'lists'
CREATE POLICY "Usuarios pueden gestionar sus propias listas"
ON public.lists FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politicas para 'categories'
CREATE POLICY "Usuarios pueden gestionar categorias de sus listas"
ON public.categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.lists
        WHERE lists.id = categories.list_id AND lists.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.lists
        WHERE lists.id = categories.list_id AND lists.user_id = auth.uid()
    )
);

-- Politicas para 'list_items'
CREATE POLICY "Usuarios pueden gestionar elementos de sus listas"
ON public.list_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.lists
        WHERE lists.id = list_items.list_id AND lists.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.lists
        WHERE lists.id = list_items.list_id AND lists.user_id = auth.uid()
    )
);

-- Politicas para 'item_categories'
CREATE POLICY "Usuarios pueden gestionar relacion elemento-categoria"
ON public.item_categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.list_items
        JOIN public.lists ON lists.id = list_items.list_id
        WHERE list_items.id = item_categories.item_id AND lists.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.list_items
        JOIN public.lists ON lists.id = list_items.list_id
        WHERE list_items.id = item_categories.item_id AND lists.user_id = auth.uid()
    )
);

-- ----------------------------------------------------
-- ACTIVAR SUPABASE REALTIME
-- ----------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_categories;

-- ============================================================
-- DAV'S — ESQUEMA COMPLETO DE BASE DE DATOS PARA SUPABASE
-- Boutique de Lujo Minimalista - Control de Inventario
-- ============================================================

-- 1. Habilitar extensión para UUIDs (si no está activa)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: products (Prendas)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Camisas', 'Pantalones', 'Vestidos', 'Faldas', 'Chaquetas', 'Conjuntos', 'Accesorios', 'Abrigos', 'Calzado')),
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(10, 2) NOT NULL CHECK (sale_price >= 0),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA: product_variants (Variantes por Talla y Color)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#0A0A0A',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_product_size_color UNIQUE (product_id, size, color)
);

-- 4. TABLA: inventory_logs (Historial de Movimientos de Stock)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('Venta', 'Reposición', 'Ajuste manual', 'Creación inicial', 'Devolución')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ÍNDICES PARA ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON public.product_variants(stock);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant_id ON public.inventory_logs(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);

-- 6. TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER set_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. SEGURIDAD A NIVEL DE FILAS (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total a products para autenticados" ON public.products;
DROP POLICY IF EXISTS "Acceso total a product_variants para autenticados" ON public.product_variants;
DROP POLICY IF EXISTS "Acceso total a inventory_logs para autenticados" ON public.inventory_logs;
DROP POLICY IF EXISTS "Usuarios autenticados tienen acceso total a products" ON public.products;
DROP POLICY IF EXISTS "Usuarios autenticados tienen acceso total a product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Usuarios autenticados tienen acceso total a inventory_logs" ON public.inventory_logs;

CREATE POLICY "Usuarios autenticados tienen acceso total a products"
    ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Usuarios autenticados tienen acceso total a product_variants"
    ON public.product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Usuarios autenticados tienen acceso total a inventory_logs"
    ON public.inventory_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. BUCKET DE ALMACENAMIENTO DE IMÁGENES (Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Lectura pública de imágenes de productos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública de imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Subida de imágenes para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Actualización de imágenes para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Eliminación de imágenes para autenticados" ON storage.objects;

CREATE POLICY "Lectura pública de imágenes de productos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

CREATE POLICY "Usuarios autenticados pueden subir imágenes"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Usuarios autenticados pueden actualizar imágenes"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Usuarios autenticados pueden eliminar imágenes"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-images');

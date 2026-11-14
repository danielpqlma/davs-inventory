# Dav's Atelier & Retail — Sistema de Gestión de Inventario

Aplicación web de producción diseñada para la boutique de moda de lujo **"Dav's"**, totalmente responsiva (móvil y escritorio) y conectada en tiempo real a **Supabase (PostgreSQL + Auth + Storage)**.

---

## 🏛️ 1. Arquitectura y Tecnologías
- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons
- **Backend / Base de Datos:** Supabase PostgreSQL con Row Level Security (RLS)
- **Autenticación:** Supabase Auth (Email & Password) con Auth Guard para rutas protegidas
- **Almacenamiento de Fotos:** Supabase Storage (`product-images`)
- **Estilo Visual:** Editorial minimalista de alto contraste (Cormorant Garamond + Inter), blanco puro (`#FFFFFF`), alabastro (`#F9F9F9`), negro tinta (`#0A0A0A`) y acento champagne (`#B89B72`).

---

## ⚡ 2. Inicio Rápido

### A. Clonar / Abrir la Carpeta
```bash
cd /Users/daniel/Documents/davs
```

### B. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación se abrirá en tu navegador en: `http://localhost:3000`

---

## 🗄️ 3. Configuración de Supabase (Paso a Paso)

### Paso 1: Ejecutar el Script SQL
1. Abre tu proyecto en el panel de [Supabase](https://supabase.com/dashboard).
2. Ve al menú lateral **SQL Editor**.
3. Abre el archivo local [`supabase_schema.sql`](./supabase_schema.sql) incluido en este proyecto, copia todo su contenido y pégalo en el editor de Supabase.
4. Presiona **Run** (Ejecutar).

El script configurará automáticamente:
- Tabla `products` (prendas con SKU único, nombre, categoría, costos, precios e imagen).
- Tabla `product_variants` (matriz de inventario por talla y color con `ON DELETE CASCADE`).
- Tabla `inventory_logs` (historial de auditoría para cada movimiento).
- Políticas de seguridad **Row Level Security (RLS)** para usuarios autenticados.
- Bucket de almacenamiento `product-images` con políticas de lectura pública y subida autenticada.
- **10 prendas de lujo iniciales** de prueba con tallas, colores y stock real.

### Paso 2: Configurar las Variables de Entorno
Copia o edita el archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```
*(También puedes ingresar estas credenciales directamente desde la pantalla de login de la aplicación haciendo clic en el botón superior **"Configurar Supabase"** sin necesidad de reiniciar el servidor).*

### Paso 3: Crear tu Usuario de Acceso
Desde la pantalla de Login (`http://localhost:3000`), haz clic en **"Crear Acceso"**, ingresa tu correo y contraseña. Quedarás registrado y autenticado de inmediato.

---

## 💎 4. Funcionalidades Incluidas

1. **Autenticación Obligatoria (Auth Guard):**
   - Pantalla de acceso editorial centrada ("Dav's — Gestión Interna").
   - Protección de todo el catálogo contra accesos no autorizados.
   - Cierre de sesión seguro con limpieza de tokens.

2. **Control Rápido de Stock (+1 / -1):**
   - Botones táctiles optimizados para el pulgar en móviles y tabla densa en escritorio.
   - Actualización optimista instantánea en pantalla mientras se sincroniza con `product_variants`.
   - Registro automático en `inventory_logs` especificando el cambio (`+1` como 'Reposición', `-1` como 'Venta').

3. **Creación y Edición Completa de Prendas:**
   - Constructor dinámico de variantes: agrega múltiples combinaciones de Talla + Color (con selector de paleta de lujo) + Stock inicial.
   - Generador automático de SKU por categoría (`DAV-BL...`, `DAV-PA...`).
   - Cálculo automático de margen de beneficio (`%`).
   - Subida directa de fotos a **Supabase Storage** o entrada de URL.

4. **Eliminación Segura con Cascada:**
   - Modal de confirmación con detalles de prendas y stock total a eliminar.
   - Ejecuta `DELETE` real con `CASCADE` en PostgreSQL.

5. **Métricas en Vivo (Dashboard):**
   - Total de unidades físicas en almacén.
   - Valor monetario a costo vs. valor de venta al público.
   - Alertas activas de stock bajo (< 3 unidades) y agotadas.
   - Distribución gráfica por categoría.

6. **Exportación e Impresión:**
   - Exportación limpia a archivo CSV compatible con Excel.
   - Estilos `@media print` para imprimir hojas de conteo de inventario físico.

7. **Historial de Movimientos:**
   - Vista de auditoría en vivo de todas las entradas y salidas registradas en la tabla `inventory_logs`.


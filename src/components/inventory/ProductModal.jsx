import React, { useState, useEffect } from 'react';
import {
  CATEGORIES,
  STANDARD_SIZES,
  LUXURY_PALETTE_COLORS,
  generateSKU,
  calculateMargin
} from '../../lib/utils';
import { uploadProductImage, supabase } from '../../lib/supabase';
import { ColorIndicator } from '../ui/Badge';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  DollarSign,
  Layers
} from 'lucide-react';

export function ProductModal({ isOpen, onClose, productToEdit, onSaved, showToast }) {
  const isEditing = !!productToEdit;

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [variants, setVariants] = useState([]);

  // New variant helper inputs
  const [varSize, setVarSize] = useState('S');
  const [varColorName, setVarColorName] = useState('Negro Noche');
  const [varColorHex, setVarColorHex] = useState('#1A1A1A');
  const [varStock, setVarStock] = useState('3');

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);

  // Load existing product or reset
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setSku(productToEdit.sku || '');
      setCategory(productToEdit.category || CATEGORIES[0]);
      setCostPrice(String(productToEdit.cost_price || ''));
      setSalePrice(String(productToEdit.sale_price || ''));
      setImageUrl(productToEdit.image_url || '');
      setImagePreview(productToEdit.image_url || '');
      setImageFile(null);
      setVariants(
        (productToEdit.product_variants || []).map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          color_hex: v.color_hex || '#0A0A0A',
          stock: v.stock,
          isExisting: true,
        }))
      );
    } else {
      setName('');
      const defaultCat = CATEGORIES[0];
      setCategory(defaultCat);
      setSku(generateSKU(defaultCat));
      setCostPrice('');
      setSalePrice('');
      setImageUrl('');
      setImagePreview('');
      setImageFile(null);
      // Default initial variant set for quick setup
      setVariants([
        { id: `temp-${Date.now()}-1`, size: 'S', color: 'Negro Noche', color_hex: '#1A1A1A', stock: 2 },
        { id: `temp-${Date.now()}-2`, size: 'M', color: 'Negro Noche', color_hex: '#1A1A1A', stock: 3 },
      ]);
    }
    setError(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (!isEditing && (!sku || sku.startsWith('DAV-'))) {
      setSku(generateSKU(newCat));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleAddVariant = () => {
    if (!varSize || !varColorName.trim()) {
      setError('Debes especificar la talla y el color de la variante.');
      return;
    }

    // Check duplicate size + color
    const exists = variants.some(
      (v) =>
        v.size.toLowerCase() === varSize.toLowerCase() &&
        v.color.toLowerCase() === varColorName.trim().toLowerCase()
    );
    if (exists) {
      setError(`Ya existe una variante con talla ${varSize} y color ${varColorName}.`);
      return;
    }

    const newVar = {
      id: `temp-${Date.now()}`,
      size: varSize,
      color: varColorName.trim(),
      color_hex: varColorHex,
      stock: Math.max(0, parseInt(varStock) || 0),
      isExisting: false,
    };

    setVariants([...variants, newVar]);
    setError(null);
  };

  const handleRemoveVariant = (id) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleVariantStockChange = (id, newStock) => {
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, stock: Math.max(0, parseInt(newStock) || 0) } : v))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre de la prenda es requerido.');
      return;
    }
    if (!sku.trim()) {
      setError('El código SKU es obligatorio.');
      return;
    }
    const saleNum = parseFloat(salePrice);
    if (isNaN(saleNum) || saleNum <= 0) {
      setError('Ingresa un precio de venta válido mayor a 0.');
      return;
    }
    if (variants.length === 0) {
      setError('Debes agregar al menos una variante (Talla/Color) para el inventario.');
      return;
    }

    setSaving(true);

    try {
      let finalImageUrl = imageUrl;

      // 1. Subir imagen a Supabase Storage si se seleccionó archivo local
      if (imageFile) {
        setUploadingImage(true);
        const { url, error: uploadErr } = await uploadProductImage(imageFile);
        setUploadingImage(false);
        if (uploadErr) {
          console.warn('Fallo al subir a Storage, continuando sin imagen o con URL anterior:', uploadErr);
        } else if (url) {
          finalImageUrl = url;
        }
      }

      const costNum = parseFloat(costPrice) || 0;

      // 2. Operación contra Supabase PostgreSQL
      if (isEditing) {
        // Actualizar producto en 'products'
        const { error: prodErr } = await supabase
          .from('products')
          .update({
            name: name.trim(),
            sku: sku.trim().toUpperCase(),
            category,
            cost_price: costNum,
            sale_price: saleNum,
            image_url: finalImageUrl || null,
          })
          .eq('id', productToEdit.id);

        if (prodErr) throw prodErr;

        // Manejar variantes: sincronizar con product_variants
        const existingVariantIds = (productToEdit.product_variants || []).map((v) => v.id);
        const currentVariantIds = variants.filter((v) => v.isExisting).map((v) => v.id);

        // Variantes a eliminar
        const toDeleteIds = existingVariantIds.filter((id) => !currentVariantIds.includes(id));
        if (toDeleteIds.length > 0) {
          await supabase.from('product_variants').delete().in('id', toDeleteIds);
        }

        // Variantes a actualizar o crear
        for (const v of variants) {
          if (v.isExisting) {
            // Check if stock changed to write a log
            const oldVar = productToEdit.product_variants?.find((ov) => ov.id === v.id);
            const delta = v.stock - (oldVar?.stock || 0);

            await supabase
              .from('product_variants')
              .update({
                size: v.size,
                color: v.color,
                color_hex: v.color_hex,
                stock: v.stock,
              })
              .eq('id', v.id);

            if (delta !== 0) {
              await supabase.from('inventory_logs').insert({
                variant_id: v.id,
                change_amount: delta,
                reason: 'Ajuste manual',
              });
            }
          } else {
            // Nueva variante en producto existente
            const { data: insertedVar, error: insErr } = await supabase
              .from('product_variants')
              .insert({
                product_id: productToEdit.id,
                size: v.size,
                color: v.color,
                color_hex: v.color_hex,
                stock: v.stock,
              })
              .select()
              .single();

            if (insErr) throw insErr;

            if (v.stock > 0 && insertedVar) {
              await supabase.from('inventory_logs').insert({
                variant_id: insertedVar.id,
                change_amount: v.stock,
                reason: 'Creación inicial',
              });
            }
          }
        }

        showToast?.('Prenda actualizada correctamente', 'success');
      } else {
        // Crear nuevo producto en 'products'
        const { data: newProd, error: createErr } = await supabase
          .from('products')
          .insert({
            name: name.trim(),
            sku: sku.trim().toUpperCase(),
            category,
            cost_price: costNum,
            sale_price: saleNum,
            image_url: finalImageUrl || null,
          })
          .select()
          .single();

        if (createErr) throw createErr;

        // Insertar variantes en 'product_variants'
        const variantsPayload = variants.map((v) => ({
          product_id: newProd.id,
          size: v.size,
          color: v.color,
          color_hex: v.color_hex,
          stock: v.stock,
        }));

        const { data: insertedVariants, error: varsErr } = await supabase
          .from('product_variants')
          .insert(variantsPayload)
          .select();

        if (varsErr) throw varsErr;

        // Registrar movimientos iniciales en 'inventory_logs'
        if (insertedVariants && insertedVariants.length > 0) {
          const logsPayload = insertedVariants
            .filter((iv) => iv.stock > 0)
            .map((iv) => ({
              variant_id: iv.id,
              change_amount: iv.stock,
              reason: 'Creación inicial',
            }));

          if (logsPayload.length > 0) {
            await supabase.from('inventory_logs').insert(logsPayload);
          }
        }

        showToast?.('Prenda registrada en el inventario', 'success');
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err.message || 'Error al guardar la información.');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const margin = calculateMargin(parseFloat(costPrice) || 0, parseFloat(salePrice) || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white border border-border w-full max-w-2xl shadow-modal rounded-md my-auto flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-light text-ink tracking-tight">
              {isEditing ? 'Editar Prenda' : 'Nueva Prenda'}
            </h2>
            <p className="font-sans text-[11px] text-neutral-400 uppercase tracking-widest mt-0.5">
              {isEditing ? `Modificando SKU: ${sku}` : 'Registro de alta de catálogo Dav\'s'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-ink transition-colors rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-crimson font-sans leading-relaxed">
              {error}
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-border pb-1">
              1. Datos Principales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                  Nombre de la Prenda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Blazer Oversize Crema"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-minimal text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                  Categoría *
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="input-minimal text-xs bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                    Código SKU *
                  </label>
                  <button
                    type="button"
                    onClick={() => setSku(generateSKU(category))}
                    className="text-[10px] text-neutral-500 hover:text-ink flex items-center gap-1 underline"
                  >
                    <Sparkles className="w-3 h-3 text-[#B89B72]" />
                    Generar
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="DAV-BL01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="input-minimal text-xs font-mono tracking-wider"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                  Costo de Compra ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="input-minimal text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                    Precio de Venta ($) *
                  </label>
                  {margin > 0 && (
                    <span className="text-[10px] font-sans text-emerald-700 font-semibold">
                      Margen: {margin}%
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="input-minimal text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Photo / Image */}
          <div className="space-y-3">
            <h3 className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-border pb-1">
              Fotografía
            </h3>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Thumbnail preview */}
              <div className="w-24 h-32 bg-alabaster border border-border rounded flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setImageUrl('');
                      }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                      title="Eliminar foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-8 h-8 text-neutral-300" />
                )}
              </div>

              {/* Upload controls */}
              <div className="flex-1 space-y-2 w-full">
                <div className="relative">
                  <input
                    type="url"
                    placeholder="Pega el enlace de la imagen (SHEIN, catálogo, etc.)..."
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImagePreview(e.target.value);
                      setImageFile(null);
                    }}
                    className="input-minimal text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="btn-secondary !py-2 cursor-pointer flex-1 justify-center">
                    <Upload className="w-3.5 h-3.5 text-neutral-500" />
                    <span>O subir foto desde tu dispositivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Variant Matrix Constructor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-1">
              <h3 className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                Variantes
              </h3>
              <span className="font-sans text-[11px] text-neutral-500">
                Total:{' '}
                <strong className="text-ink">
                  {variants.reduce((acc, v) => acc + (v.stock || 0), 0)} uds
                </strong>
              </span>
            </div>

            {/* List of current variants */}
            <div className="border border-border rounded overflow-hidden divide-y divide-border">
              {variants.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-400 font-sans">
                  No hay variantes añadidas. Añade al menos una talla y color abajo.
                </div>
              ) : (
                variants.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-white flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-alabaster border border-border rounded text-ink min-w-[32px] text-center">
                        {v.size}
                      </span>
                      <ColorIndicator hex={v.color_hex} label={v.color} />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-neutral-400">Stock:</span>
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => handleVariantStockChange(v.id, e.target.value)}
                          className="w-14 border border-border px-2 py-1 text-xs text-center rounded focus:border-ink font-mono"
                        />
                        <span className="text-[11px] text-neutral-400">uds</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="text-neutral-400 hover:text-crimson p-1 transition-colors"
                        title="Eliminar variante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add variant row */}
            <div className="p-3 bg-alabaster border border-border rounded space-y-2">
              <p className="font-sans text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                Añadir Combinación de Talla y Color
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Size */}
                <select
                  value={varSize}
                  onChange={(e) => setVarSize(e.target.value)}
                  className="input-minimal text-xs bg-white"
                >
                  {STANDARD_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      Talla {sz}
                    </option>
                  ))}
                </select>

                {/* Color Name */}
                <input
                  type="text"
                  placeholder="Nombre Color"
                  value={varColorName}
                  onChange={(e) => setVarColorName(e.target.value)}
                  className="input-minimal text-xs"
                />

                {/* Color Hex & Picker */}
                <div className="flex items-center gap-1 bg-white border border-border rounded px-2">
                  <input
                    type="color"
                    value={varColorHex}
                    onChange={(e) => setVarColorHex(e.target.value)}
                    className="w-6 h-6 border-none cursor-pointer bg-transparent"
                    title="Seleccionar color"
                  />
                  <span className="font-mono text-[10px] text-neutral-500 uppercase">
                    {varColorHex}
                  </span>
                </div>

                {/* Initial stock */}
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={varStock}
                    onChange={(e) => setVarStock(e.target.value)}
                    className="input-minimal text-xs text-center flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="btn-primary !px-3"
                    title="Agregar variante a la lista"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border bg-alabaster/40 flex items-center justify-between flex-shrink-0">
          <span />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || uploadingImage}
              className="btn-primary"
            >
              {saving ? (
                <span className="inline-block animate-pulse">
                  {uploadingImage ? 'Subiendo imagen...' : 'Guardando...'}
                </span>
              ) : (
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Prenda'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


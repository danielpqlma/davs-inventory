/**
 * Utilidades generales para Dav's Boutique
 */

export const CATEGORIES = [
  'Camisas',
  'Pantalones',
  'Vestidos',
  'Faldas',
  'Chaquetas',
  'Conjuntos',
  'Accesorios',
  'Abrigos',
  'Calzado'
];

export const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Única', '36', '38', '40', '42'];

export const LUXURY_PALETTE_COLORS = [
  { name: 'Negro Noche', hex: '#1A1A1A' },
  { name: 'Blanco Óptico', hex: '#FFFFFF' },
  { name: 'Crema / Marfil', hex: '#F5F0E8' },
  { name: 'Beige Natural', hex: '#C8B89A' },
  { name: 'Camel Tostado', hex: '#C19A6B' },
  { name: 'Champagne', hex: '#D4AF8C' },
  { name: 'Gris Ceniza', hex: '#9E9E9E' },
  { name: 'Azul Marino', hex: '#1B2A4A' },
  { name: 'Azul Cielo / Niebla', hex: '#AEC6CF' },
  { name: 'Verde Salvia', hex: '#B2C2B0' },
  { name: 'Verde Oliva', hex: '#556B2F' },
  { name: 'Borgoña / Vino', hex: '#722F37' },
  { name: 'Terracota', hex: '#E2725B' }
];

export function formatMoney(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function calculateMargin(cost, price) {
  const c = Number(cost) || 0;
  const p = Number(price) || 0;
  if (p <= 0) return 0;
  return Math.round(((p - c) / p) * 100);
}

export function generateSKU(category = 'PRE') {
  const prefixMap = {
    'Chaquetas': 'DAV-BL',
    'Pantalones': 'DAV-PA',
    'Vestidos': 'DAV-VE',
    'Camisas': 'DAV-CA',
    'Faldas': 'DAV-FA',
    'Conjuntos': 'DAV-CO',
    'Accesorios': 'DAV-AC',
    'Abrigos': 'DAV-AB',
    'Calzado': 'DAV-ZA',
  };
  const prefix = prefixMap[category] || 'DAV';
  const randNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}${randNum}`;
}

export function getTotalStock(variants = []) {
  if (!Array.isArray(variants)) return 0;
  return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}

export function getStockStatus(variants = []) {
  const total = getTotalStock(variants);
  if (total === 0) return 'agotado';
  const hasLow = variants.some(v => Number(v.stock) > 0 && Number(v.stock) < 3);
  if (hasLow || total < 3) return 'bajo';
  return 'disponible';
}

export function exportInventoryToCSV(products = []) {
  const headers = [
    'SKU',
    'Nombre',
    'Categoría',
    'Talla',
    'Color',
    'Stock',
    'Costo',
    'Precio Venta',
    'Ganancia / Unidad',
    'Ganancia Total',
    'Valor Costo Total',
    'Valor Venta Total'
  ];

  const rows = [headers];

  products.forEach(p => {
    const cost = Number(p.cost_price) || 0;
    const price = Number(p.sale_price) || 0;
    const unitProfit = Math.max(0, price - cost);

    if (p.product_variants && p.product_variants.length > 0) {
      p.product_variants.forEach(v => {
        const stock = Number(v.stock) || 0;
        rows.push([
          p.sku,
          p.name,
          p.category,
          v.size,
          v.color,
          stock,
          cost.toFixed(2),
          price.toFixed(2),
          unitProfit.toFixed(2),
          (unitProfit * stock).toFixed(2),
          (cost * stock).toFixed(2),
          (price * stock).toFixed(2),
        ]);
      });
    } else {
      rows.push([
        p.sku,
        p.name,
        p.category,
        '-',
        '-',
        0,
        cost.toFixed(2),
        price.toFixed(2),
        unitProfit.toFixed(2),
        '0.00',
        '0.00',
        '0.00',
      ]);
    }
  });

  const csvContent = rows
    .map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `davs_inventario_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


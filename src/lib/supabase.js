import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback to localStorage override if user enters them via UI prompt
const localUrl = typeof window !== 'undefined' ? localStorage.getItem('davs_supabase_url') || '' : '';
const localKey = typeof window !== 'undefined' ? localStorage.getItem('davs_supabase_key') || '' : '';

export const supabaseUrl = localUrl || envUrl;
export const supabaseAnonKey = localKey || envKey;

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://tu-proyecto.supabase.co' &&
    supabaseAnonKey !== 'tu-anon-key-aqui' &&
    supabaseUrl.startsWith('https://')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false },
    });

/**
 * Sube una imagen al bucket 'product-images' de Supabase Storage
 * @param {File} file
 * @returns {Promise<{ url: string|null, error: any }>}
 */
export async function uploadProductImage(file) {
  if (!isSupabaseConfigured()) {
    return { url: null, error: new Error('Supabase no está configurado aún.') };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (err) {
    console.error('Error subiendo imagen a Supabase Storage:', err);
    return { url: null, error: err };
  }
}


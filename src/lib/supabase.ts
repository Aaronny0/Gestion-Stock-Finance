import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    console.error(
        '❌ [Supabase] NEXT_PUBLIC_SUPABASE_URL est manquant ou invalide.\n' +
        '   Renseignez votre URL dans .env.local (ex: https://xxxx.supabase.co)'
    );
}

if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
    console.error(
        '❌ [Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY est manquant ou invalide.\n' +
        '   Renseignez votre clé anon dans .env.local'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

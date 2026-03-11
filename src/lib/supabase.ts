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

// Wrapper fetch avec timeout pour éviter les chargements infinis
const fetchWithTimeout = async (url: RequestInfo | URL, options: RequestInit = {}) => {
    const timeout = 8000; // 8 secondes max
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('Le serveur de base de données met trop de temps à répondre (timeout).');
        }
        throw error;
    }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: fetchWithTimeout
    }
});

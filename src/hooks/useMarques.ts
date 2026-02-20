import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Marque {
    id: string;
    name: string;
}

interface UseMarquesResult {
    marques: Marque[];
    loading: boolean;
    error: string | null;
}

/** Hook centralisé — source unique de vérité pour les marques. */
export function useMarques(): UseMarquesResult {
    const [marques, setMarques] = useState<Marque[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchMarques() {
            try {
                const { data, error: supaError } = await supabase
                    .from('brands')
                    .select('id, name')
                    .order('name');

                if (supaError) throw supaError;

                if (!cancelled) {
                    setMarques(data ?? []);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('[useMarques]', err);
                    setError('Impossible de charger les marques. Vérifiez vos credentials Supabase dans .env.local');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchMarques();
        return () => { cancelled = true; };
    }, []);

    return { marques, loading, error };
}

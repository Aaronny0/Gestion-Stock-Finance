import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { signSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, username, password, newPassword } = body;

        if (action === 'login') {
            // -- LOGIN --
            if (!username || !password) {
                return NextResponse.json(
                    { error: 'Identifiants incorrects' },
                    { status: 401 }
                );
            }

            const { data: user, error } = await supabase
                .from('app_users')
                .select('username, password_hash')
                .eq('username', username.toLowerCase().trim())
                .single();

            if (error || !user) {
                // Generic error to prevent account enumeration
                return NextResponse.json(
                    { error: 'Identifiants incorrects' },
                    { status: 401 }
                );
            }

            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                return NextResponse.json(
                    { error: 'Identifiants incorrects' },
                    { status: 401 }
                );
            }

            // Sign JWT
            const token = await signSession(user.username);

            const response = NextResponse.json({ success: true });
            response.cookies.set(SESSION_COOKIE_NAME, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });

            return response;

        } else if (action === 'me') {
            // -- GET CURRENT USER --
            const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
            if (!token) {
                return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
            }

            try {
                const { jwtVerify } = await import('jose');
                const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vortex_super_secret_key_2026_es_store');
                const { payload } = await jwtVerify(token, JWT_SECRET);

                return NextResponse.json({ username: payload.username });
            } catch {
                return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
            }

        } else if (action === 'verify_password') {
            // -- VERIFY PASSWORD (LOCK SCREEN) --
            const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
            if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

            let username = '';
            try {
                const { jwtVerify } = await import('jose');
                const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vortex_super_secret_key_2026_es_store');
                const { payload } = await jwtVerify(token, JWT_SECRET);
                username = payload.username as string;
            } catch {
                return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
            }

            const { data: user } = await supabase
                .from('app_users')
                .select('password_hash')
                .eq('username', username)
                .single();

            if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
            }

            return NextResponse.json({ success: true });

        } else if (action === 'change_password') {
            // -- CHANGE PASSWORD --
            if (!username || !newPassword) {
                return NextResponse.json(
                    { error: 'Veuillez remplir tous les champs' },
                    { status: 400 }
                );
            }

            if (newPassword.length < 4) {
                return NextResponse.json(
                    { error: 'Le mot de passe doit contenir au moins 4 caractères' },
                    { status: 400 }
                );
            }

            // Check if user exists
            const { data: user, error } = await supabase
                .from('app_users')
                .select('id')
                .eq('username', username.toLowerCase().trim())
                .single();

            if (error || !user) {
                return NextResponse.json(
                    { error: 'Identifiant non reconnu' },
                    { status: 401 }
                );
            }

            const newHash = await bcrypt.hash(newPassword, 10);

            const { error: updateError } = await supabase
                .from('app_users')
                .update({ password_hash: newHash, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (updateError) {
                return NextResponse.json(
                    { error: 'Erreur lors de la mise à jour' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true, message: 'Mot de passe modifié avec succès' });

        } else if (action === 'logout') {
            const response = NextResponse.json({ success: true });
            response.cookies.delete(SESSION_COOKIE_NAME);
            return response;
        }

        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });

    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

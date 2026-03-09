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
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/',
            });

            return response;

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

    } catch {
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

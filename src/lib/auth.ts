import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'vortex_fallback_secret'
);

const SESSION_COOKIE_NAME = 'vortex_session';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

export { SESSION_COOKIE_NAME };

export async function signSession(username: string): Promise<string> {
    return new SignJWT({ username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DURATION}s`)
        .sign(JWT_SECRET);
}

export async function verifySession(token: string): Promise<boolean> {
    try {
        await jwtVerify(token, JWT_SECRET);
        return true;
    } catch {
        return false;
    }
}

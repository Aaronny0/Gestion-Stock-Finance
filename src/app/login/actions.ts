'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { createClient } from '@/utils/supabase/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vortex_super_secret_key_2026_es_store'
)

export async function login(formData: FormData) {
  const data = {
    username: formData.get('username') as string,
    password: formData.get('password') as string,
  }

  if (!data.username || !data.password) {
    return { error: 'Veuillez remplir tous les champs', success: false }
  }

  const supabase = await createClient()

  // Verify user against custom users table
  const { data: user, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('username', data.username)
    .single()

  let isAuthenticated = false

  if (user && user.password) {
    // If user found in DB, verify bcrypt password
    isAuthenticated = await bcrypt.compare(data.password, user.password)
  } else if (data.username === 'robert' && data.password === '123456') {
    // Fallback if no users table is set up yet (matching development mock)
    isAuthenticated = true
  }

  if (!isAuthenticated) {
    return { error: 'Identifiants incorrects', success: false }
  }

  // Create JWT token
  const token = await new SignJWT({ username: data.username, role: user?.role || 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)

  // Set HTTP-only cookie
  const cookieStore = await cookies()
  cookieStore.set('vortex_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('vortex_session')
  redirect('/login')
}

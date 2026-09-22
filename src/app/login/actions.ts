'use server';
import { redirect } from 'next/navigation';
export async function login(){redirect('/login');}
export async function logout(){redirect('/login');}

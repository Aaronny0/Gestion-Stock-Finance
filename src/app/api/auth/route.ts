import { NextResponse } from "next/server";
export function POST() {
  return NextResponse.json(
    { error: "Authentification gérée par Supabase. Utilisez /login." },
    { status: 410 },
  );
}

import { NextResponse } from "next/server";
export function POST() {
  return NextResponse.json(
    { error: "Authentification migrée vers /api/v1/auth." },
    { status: 410 },
  );
}

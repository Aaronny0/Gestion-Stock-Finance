"use client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

/** Fields added to the Better Auth user by the NestJS backend (accessStatus is read-only there). */
export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
  company?: string | null;
  phone?: string | null;
  activity?: string | null;
  accessRequest?: boolean | null;
  accessStatus?: string | null;
  /** JSON string: { payload, idempotencyKey }, the onboarding draft saved at sign-up. */
  onboarding?: string | null;
};

function create() {
  return createAuthClient({
    // The browser only talks to its own origin; /api/auth/* is relayed to the backend by Next.js.
    baseURL: window.location.origin,
    plugins: [
      inferAdditionalFields({
        user: {
          company: { type: "string", required: false },
          phone: { type: "string", required: false },
          activity: { type: "string", required: false },
          accessRequest: { type: "boolean", required: false },
          onboarding: { type: "string", required: false },
        },
      }),
    ],
  });
}
let client: ReturnType<typeof create> | undefined;
export function getAuthClient() {
  return (client ??= create());
}

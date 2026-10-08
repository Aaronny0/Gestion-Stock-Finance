/** Access decisions only consume server-controlled app_metadata, never user_metadata. */
export const accessStatuses = [
  "PENDING_EMAIL",
  "PENDING_APPROVAL",
  "CONTACTED",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;
export type AccessStatus = (typeof accessStatuses)[number];
export type AccessDecision = {
  status: AccessStatus;
  destination: string;
};
export function declaredAccess(
  metadata: Record<string, unknown> | undefined,
): AccessStatus | undefined {
  const value = metadata?.vortex_access_status;
  return value === undefined
    ? undefined
    : accessStatuses.includes(value as AccessStatus)
      ? (value as AccessStatus)
      : "PENDING_APPROVAL";
}
export function accessDecision(
  verified: boolean,
  status: AccessStatus | undefined,
  hasWorkspace: boolean,
): AccessDecision {
  if (!verified)
    return { status: "PENDING_EMAIL", destination: "/verify-email" };
  if (status === "APPROVED")
    return {
      status,
      destination: hasWorkspace ? "/app/dashboard" : "/onboarding",
    };
  return {
    status:
      status === "PENDING_EMAIL"
        ? "PENDING_APPROVAL"
        : (status ?? "PENDING_APPROVAL"),
    destination: "/access-pending",
  };
}

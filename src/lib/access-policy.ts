/** Access decisions only consume the status computed by the backend (user.accessStatus, never writable by the browser). */
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
export function parseAccessStatus(value: unknown): AccessStatus | undefined {
  return value === undefined || value === null
    ? undefined
    : accessStatuses.includes(value as AccessStatus)
      ? (value as AccessStatus)
      : "PENDING_APPROVAL";
}
export function accessDecision(
  verified: boolean,
  status: AccessStatus | undefined,
): AccessDecision {
  if (!verified)
    return { status: "PENDING_EMAIL", destination: "/verify-email" };
  if (status === "APPROVED")
    // Sans entreprise, le dashboard ouvre lui-même le modal de création d'espace.
    return { status, destination: "/app/dashboard" };
  return {
    status:
      status === "PENDING_EMAIL"
        ? "PENDING_APPROVAL"
        : (status ?? "PENDING_APPROVAL"),
    destination: "/access-pending",
  };
}

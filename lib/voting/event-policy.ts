/** Inputs must come from authenticated server-side membership records, never request claims. */
export type Actor = {
  userId: string;
  associationId: string;
  role: "association-admin" | "association-approver" | "management-staff" | "observer" | "platform-operator";
  mfaVerified: boolean;
  active: boolean;
};
export type Event = {
  associationId: string;
  createdBy: string;
  state: "DRAFT" | "APPROVED" | "OPEN" | "CLOSED" | "CANCELLED" | "CERTIFIED";
  revision: number;
  approvedRevision: number | null;
  approvedBy: string | null;
  procedureReviewed: boolean;
};
export function canAct(actor: Actor, event: Event, action: "edit" | "approve" | "open") {
  if (!actor.active || !actor.mfaVerified || actor.associationId !== event.associationId) return false;
  const hoa = actor.role === "association-admin" || actor.role === "association-approver";
  if (action === "edit") return event.state === "DRAFT" && (hoa || actor.role === "management-staff");
  if (!hoa || actor.userId === event.createdBy) return false;
  if (action === "approve") return event.state === "DRAFT" && event.procedureReviewed;
  return event.state === "APPROVED" && event.procedureReviewed && event.approvedRevision === event.revision && Boolean(event.approvedBy) && event.approvedBy !== event.createdBy;
}

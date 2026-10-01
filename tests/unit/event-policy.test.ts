import { describe, expect, it } from "vitest";
import { canAct, type Actor, type Event } from "../../lib/voting/event-policy";
const actor: Actor = { userId: "reviewer", associationId: "hoa-a", role: "association-approver", mfaVerified: true, active: true };
const event: Event = { associationId: "hoa-a", createdBy: "drafter", state: "DRAFT", revision: 2, approvedRevision: null, approvedBy: null, procedureReviewed: true };
describe("event authority boundaries", () => {
  it("rejects another association, even for an administrator", () => expect(canAct({...actor, associationId:"hoa-b"},event,"edit")).toBe(false));
  it("requires active membership and MFA", () => { expect(canAct({...actor,active:false},event,"approve")).toBe(false); expect(canAct({...actor,mfaVerified:false},event,"approve")).toBe(false); });
  it("lets management prepare but never approve or open", () => { const manager={...actor,role:"management-staff" as const}; expect(canAct(manager,event,"edit")).toBe(true); expect(canAct(manager,event,"approve")).toBe(false); expect(canAct(manager,{...event,state:"APPROVED",approvedBy:"reviewer",approvedRevision:2},"open")).toBe(false); });
  it("denies platform operators voting-event authority", () => expect(canAct({...actor,role:"platform-operator"},event,"approve")).toBe(false));
  it("requires a different HOA approver", () => { expect(canAct(actor,event,"approve")).toBe(true); expect(canAct({...actor,userId:"drafter"},event,"approve")).toBe(false); });
  it("requires reviewed procedures before approval", () => expect(canAct(actor,{...event,procedureReviewed:false},"approve")).toBe(false));
  it("cannot open a changed revision with stale approval", () => { expect(canAct(actor,{...event,state:"APPROVED",approvedRevision:1,approvedBy:"reviewer"},"open")).toBe(false); expect(canAct(actor,{...event,state:"APPROVED",approvedRevision:2,approvedBy:"reviewer"},"open")).toBe(true); });
  it("locks editing once approved or opened", () => { expect(canAct(actor,{...event,state:"APPROVED"},"edit")).toBe(false); expect(canAct(actor,{...event,state:"OPEN"},"edit")).toBe(false); });
});

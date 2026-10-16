export const siteOperatorName = "SAPSLAB SERVICES LLC";

export function resolveProxyholderName(
  value = process.env.PROXYHOLDER_NAME,
): string {
  const name = value?.trim() ?? "";
  if (!name || name.length > 160 || /[\x00-\x1f\x7f]/.test(name)) return "TBD";
  return name;
}
export function proxyholderReady(value = resolveProxyholderName()): boolean {
  return (
    !/^(tbd|to be determined|todo|unknown)$/i.test(value.trim()) &&
    value.trim().length > 0 &&
    value.length <= 160 &&
    !/[\x00-\x1f\x7f]/.test(value)
  );
}

export const proxyConfig = {
  association: "Aventura Isles Master Homeowners’ Association, Inc.",
  meetingDate: "November 17, 2026",
  meetingTime: "6:15 PM",
  meetingLocation:
    "Aventura Isles pool area located at 605 NE 193 Street, Miami, Florida 33179",
  get proxyholder(): string {
    return resolveProxyholderName();
  },
  officialProxyWording:
    "The undersigned Owner/Voting Member of Aventura Isles Master Homeowners’ Association Inc., hereby appoints (select either “a” or “b” below – if neither option is selected, or if “b” is selected and a proxyholder name is not included, then the President of the Association (or, in his/her absence, any Board Member as designated by the Board) shall be deemed the appointed proxyholder):\n\n________ (a) the President of the Association (or, in his/her absence, any Board Member as designated by the Board), OR\n\n________ (b) ______________________, (if you check “b,” write in the name of your proxyholder and make sure that such proxyholder will be attending the meeting)\n\nas my proxyholder and agent, with power of substitution, for and in the name and place of the undersigned, for the limited purposes of appearing for me, acting for me, and establishing a quorum, at the Association’s membership meeting to be held on November 17, 2026, at 6:15 PM, and any adjournment thereof.",
  campaignId: "annual-quorum-2026-11-17",
  templateVersion: "annual-quorum-2026-11-17-v1",
  proxyTemplateSha256:
    "e2bec41789c55285772b0bbf2bc554c2695ba79c901e9cd9cb066e96fe3dd2ba",
  reviewed: true,
  proxyholderSelection: "b",
  get executionProxyWording(): string {
    return proxyConfig.officialProxyWording.replace(
      "________ (b) ______________________",
      `(X) (b) ${resolveProxyholderName()}`,
    );
  },
  importantProxyNote:
    "Important Note: In order to be valid, a Proxy must be signed by the person authorized to cast a vote for the Lot, and it must be filed with the Association at or prior to the time designated in the order of business for delivering proxies. A Proxy may be revoked by the Owner and is valid only for the meeting for which it is given and any lawful adjournment, except that a Proxy automatically expires ninety (90) days after the date of the meeting for which it was originally given.",
  substitutionNotice:
    "This section is only to be filled in by the proxyholder if he/she wishes to appoint a substitute proxyholder.",
  substitutionWording:
    "The undersigned, appointed as proxyholder above, does hereby designate _________________________ to substitute for me in the proxy set forth above.",
  allowedStreets: [
    "NE 6th Avenue",
    "NE 8th Court",
    "NE 9th Place",
    "NE 191st Street",
    "NE 191st Terrace",
    "NE 193rd Street",
    "NE 193rd Terrace",
    "NE 194th Lane",
    "NE 194th Terrace",
  ],
} as const;
export const disclaimer = `This independent website is operated by ${siteOperatorName}. It is not an official Aventura Isles Master Homeowners’ Association website and is not operated by the Association or its management company.`;
export const authorityNotice =
  "These safeguards help prevent spam, detect potential duplicates, and preserve a traceable signing record. The Association confirms the signer’s voting authority and whether the proxy meets its requirements.";
export const certification =
  "I certify that I am the owner or authorized voting member for the property identified above and that I am authorizing this limited proxy. I consent to sign electronically and receive a copy by email.";
export function officialTemplateReady(): boolean {
  return (
    proxyholderReady() &&
    proxyConfig.reviewed &&
    !JSON.stringify(proxyConfig).includes("[OFFICIAL") &&
    !proxyConfig.templateVersion.startsWith("draft-")
  );
}
export function submissionsEnabled(): boolean {
  const required = [
    "APP_URL",
    "DATABASE_URL",
    "OTP_PEPPER",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
    "SPACES_ENDPOINT",
    "SPACES_BUCKET",
    "SPACES_ACCESS_KEY",
    "SPACES_SECRET_KEY",
    "CONTACT_EMAIL",
    "PROXYHOLDER_NAME",
    "PROXY_TEMPLATE_PATH",
  ];
  if (
    process.env.SITE_STATE === "closed" ||
    process.env.ENABLE_SUBMISSIONS !== "true" ||
    !officialTemplateReady() ||
    required.some((key) => !process.env[key])
  )
    return false;
  if ((process.env.OTP_PEPPER?.length ?? 0) < 32) return false;
  try {
    if (
      process.env.NODE_ENV === "production" &&
      new URL(process.env.APP_URL!).protocol !== "https:"
    )
      return false;
    retentionDays();
  } catch {
    return false;
  }
  return true;
}
export function retentionDays(): number {
  const n = Number(process.env.RETENTION_DAYS ?? 90);
  if (!Number.isInteger(n) || n < 1)
    throw new Error("Invalid retention duration");
  return n;
}

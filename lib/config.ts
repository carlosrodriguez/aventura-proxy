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
  meetingDate: "October 6, 2026",
  meetingTime: "6:15pm, or immediately following the Special Board Meeting",
  meetingLocation:
    "Aventura Isles pool area located at 605 NE 193 Street, Miami, Florida 33179",
  get proxyholder(): string {
    return resolveProxyholderName();
  },
  officialProxyWording:
    "The undersigned Owner(s) or designated Voting Member of Aventura Isles Master Homeowners’ Association, Inc. (the “Association”) hereby appoints (select either “a” or “b” below – if neither option is selected, or if “b” is selected and a proxyholder name is not included, then the President of the Association (or, in his/her absence, any Board Member as designated by the Board) shall be deemed the appointed proxyholder):\n\n(a) the President of the Association (or, in his/her absence, any Board Member as designated by the Board); OR\n\n(b) ____________________, (if you check “b,” write in the name of your proxyholder and make sure that such proxyholder will be attending the meeting)\n\nas my proxyholder, with power of substitution, for and in the name and place of the undersigned, to appear at the Association’s membership meeting to be held on October 6th, 2026, at 6:15pm, or immediately following the Special Board Meeting at the Aventura Isles pool area located at 605 NE 193 Street, Miami, Florida 33179, and any adjournment thereof. The proxyholder named above has the authority to establish quorum, vote, and act for me to the same extent that I would if personally present, with power of substitution, except that my proxyholder’s voting authority is limited as indicated below.\n\nLIMITED POWERS. [FOR YOUR VOTE TO BE COUNTED ON THE FOLLOWING ISSUES, YOU MUST INDICATE YOUR PREFERENCE IN THE BLANK(S) PROVIDED BELOW.]\n\nI SPECIFICALLY AUTHORIZE AND INSTRUCT MY PROXYHOLDER TO CAST MY VOTE IN REFERENCE TO THE FOLLOWING MATTERS AS INDICATED BELOW:",
  templateVersion: "official-original-page-2026-09-29-v3",
  proxyTemplateSha256: "86a47814102b218ef10b36500a923c61ac3916b1bb1cdee4c933ea2ebc398a23",
  reviewed: true,
  proxyholderSelection: "b",
  get executionProxyWording(): string {
    return proxyConfig.officialProxyWording.replace(
      "(b) ____________________",
      `(b) ${resolveProxyholderName()}`,
    );
  },
  importantProxyNote:
    "Important note: In order to be valid, a Proxy must be signed by the person authorized to cast a vote on behalf of the Lot, and it must be filed with the Association at or prior to the time roll call is made and quorum is determined. A Proxy may be revoked by the Owner and is valid only for the meeting for which it is given and any lawful adjournment, except that a Proxy automatically expires 90 days after the date of the meeting for which it was originally given.",
  substitutionNotice:
    "This section is only to be filled in by the proxyholder if they wish to appoint a substitute proxyholder.",
  substitutionWording:
    "The undersigned, appointed as proxy above, does hereby designate ____________________ to substitute for me in the proxy set forth above.",
  officialExhibits: {
    A: {
      label: "Exhibit A",
      sourcePage: 3,
      title:
        "Proposed Amendments to the Master Declaration of Covenants and Restrictions of Aventura Isles (the “Declaration”)",
      intro:
        "All other Sections of the Declaration shall remain unchanged. In the event of any conflict or inconsistency between the below amendments and the corresponding provisions of the Declaration, the terms and provisions of the below amendments shall govern and control.",
      note: "Note: Text appearing underlined is new text; Text appearing with strikethrough is deleted text; and Text appearing without underlining or strikethrough is existing text and remains unchanged.",
      sections: [
        {
          heading:
            "Section 11.1 of the Declaration is hereby amended as follows:",
          segments: [
            {
              text: "11.1 This DECLARATION may be amended upon the approval of not less than a majority of the ",
              change: "unchanged",
            },
            {
              text: "OWNERS",
              change: "deleted",
            },
            { text: " ", change: "unchanged" },
            {
              text: "LOTS represented at a meeting at which a quorum has been attained",
              change: "added",
            },
            {
              text: ", except that if any provision of this DECLARATION requires more than ",
              change: "unchanged",
            },
            {
              text: "a majority vote of the OWNERS",
              change: "deleted",
            },
            { text: " ", change: "unchanged" },
            {
              text: "such voting threshold",
              change: "added",
            },
            {
              text: " to approve any action, such provision may not be amended to require a lesser vote, and may not be deleted, without the same number of votes required to approve such action. In addition, so long as DECLARANT has the right to appoint a majority of the directors of the Association as provided in the ARTICLES, this DECLARATION may be amended from time to time, by DECLARANT without the consent of the ASSOCIATION or any OWNER, and no amendment may be made by the OWNERS without the written joinder of DECLARANT. Such right of DECLARANT to amend this DECLARATION shall specifically include, but shall not be limited to, (i) amendments adding any property which will be developed in a similar manner as the SUBJECT PROPERTY, or deleting any property from the SUBJECT PROPERTY which will be developed differently than the SUBJECT PROPERTY (provided that any such amendments shall require the joinder of the owners of such property or any portion thereof if the owners are different than DECLARANT and further provided that DECLARANT shall not have the obligation to add any property or delete any property from the SUBJECT PROPERTY), and (ii) amendments required by INSTITUTIONAL LENDER or governmental authority in order to comply with the requirements of same. In order to be effective, any amendment to this DECLARATION must first be recorded in the public records of the county in which the SUBJECT PROPERTY is located, and, in the case of an amendment made by the OWNERS, such amendment shall contain a certification by the President and Secretary of the ASSOCIATION that the amendment was duly adopted.",
              change: "unchanged",
            },
          ],
        },
      ],
    },
    B: {
      label: "Exhibit B",
      sourcePage: 4,
      title: "Proposed Amendments to the Articles of Incorporation of Aventura Isles Master Homeowners’ Association, Inc. (the “Articles”)",
      intro: "All other Sections of the Articles shall remain unchanged. In the event of any conflict or inconsistency between the below amendments and the corresponding provisions of the Articles, the terms and provisions of the below amendments shall govern and control.",
      note: "Note: Text appearing underlined is new text; Text appearing with strikethrough is deleted text; and Text appearing without underlining or strikethrough is existing text and remains unchanged.",
      language: "11.3 At such meeting, a vote of the members entitled to vote thereon shall be taken on the proposed amendment. The proposed amendment shall be adopted upon receiving the affirmative vote of a majority of the votes of the entire membership of the ASSOCIATION [deleted]; LOTS represented at a meeting at which a quorum has been attained [added].",
      sections: [{
        heading: "Section 11.3 of the Articles is hereby amended as follows:",
        segments: [
          { text: "11.3 At such meeting, a vote of the members entitled to vote thereon shall be taken on the proposed amendment. The proposed amendment shall be adopted upon receiving the affirmative vote of a majority of the votes of the ", change: "unchanged" },
          { text: "entire membership of the ASSOCIATION", change: "deleted" },
          { text: " ", change: "unchanged" },
          { text: "LOTS represented at a meeting at which a quorum has been attained", change: "added" },
          { text: ".", change: "unchanged" },
        ],
      }],
    },
    C: {
      label: "Exhibit C",
      sourcePage: 5,
      title:
        "Proposed Amendments to the By-Laws of Aventura Isles Master Homeowners’ Association, Inc. (the “By-Laws”)",
      intro:
        "All other Sections of the By-Laws shall remain unchanged. In the event of any conflict or inconsistency between the below amendments and the corresponding provisions of the By-Laws, the terms and provisions of the below amendments shall govern and control.",
      note: "Note: Text appearing underlined is new text; Text appearing with strikethrough is deleted text; and Text appearing without underlining or strikethrough is existing text and remains unchanged.",
      sections: [
        {
          heading: "Section 3.2 of the By-Laws is hereby amended as follows:",
          segments: [
            {
              text: "3.2 Majority Vote and Quorum Requirements.\n\nThe acts approved by a majority of the votes present in person or by proxy at a meeting at which a quorum is present shall be binding upon all members and OWNERS for all purposes, except where otherwise provided by law, in the DECLARATION, in the ARTICLES, or in these BY-LAWS. Unless otherwise provided, at any regular or special meeting, the presence in person or by proxy of persons entitled to cast the votes of ",
              change: "unchanged",
            },
            {
              text: "one-third",
              change: "deleted",
            },
            { text: " ", change: "unchanged" },
            {
              text: "twenty percent (20%)",
              change: "added",
            },
            {
              text: " of the LOTS shall constitute a quorum.",
              change: "unchanged",
            },
          ],
        },
        {
          heading: "Section 9.3.1 of the By-Laws is hereby amended as follows:",
          segments: [
            {
              text: "9.3.1 ",
              change: "unchanged",
            },
            {
              text: "A resolution for the adoption of the proposed amendment shall be adopted by not less than a majority of the votes of the entire membership of the ASSOCIATION.",
              change: "deleted",
            },
            { text: " ", change: "unchanged" },
            {
              text: " These ",
              change: "unchanged",
            },
            {
              text: "BY-LAWS may be amended upon the approval of at least a majority of the LOTS represented at a meeting at which a quorum has been attained.",
              change: "added",
            },
          ],
        },
      ],
    },
  },

  proposals: [
    {
      label: "Exhibit A",
      vote: "NO",
      language:
        "Should the Association amend the Master Declaration of Covenants in accordance with the proposed amendments in Exhibit “A” attached to the Notice of Meeting for October 6th, 2026, at 6:15pm, and for of which I acknowledge receipt?",
    },
    {
      label: "Exhibit B",
      vote: "NO",
      language:
        "Should the Association amend the Articles of Incorporation in accordance with the proposed amendments in Exhibit “B” attached to the Notice of Meeting for October 6th, 2026, at 6:15pm, and for of which I acknowledge receipt?",
    },
    {
      label: "Exhibit C",
      vote: "NO",
      language:
        "Should the Association amend the By-laws in accordance with the proposed amendments in Exhibit “C” attached to the Notice of Meeting for October 6th, 2026, at 6:15pm, and for of which I acknowledge receipt?",
    },
  ],
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
  "Email verification confirms access to this email address. It does not establish property ownership or voting authority. The Association must independently validate the proxy.";
export const certification =
  "I certify that I am the owner or authorized voting member for the property identified above and that I am authorizing this limited proxy.";
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

export const english = {
  steps: [
    "Property",
    "Signer",
    "Voting instructions",
    "Signature",
    "Email verification",
    "Complete",
  ],
  fields: {
    houseNumber: "House number",
    street: "Street",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
  },
} as const;
export type Messages = {
  steps: readonly string[];
  fields: { [Key in keyof typeof english.fields]: string };
};
// Future locales implement Messages; the verification protocol stays locale-independent.
export const messages: Messages = english;

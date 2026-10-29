/**
 * Maximum field lengths. Shared by the API routes (which enforce them) and the forms
 * (maxLength attributes), so the UI never offers more than the server accepts.
 */
export const CONTACT_LIMITS = {
  name: 100,
  email: 254,
  subject: 150,
  message: 5000,
  /** An admin's reply to a message. */
  reply: 5000,
} as const;

import { Resend } from 'resend';

/*
 * Email is OPT-IN and currently OFF.
 *
 * With no RESEND_API_KEY configured nothing is constructed and no request is ever
 * attempted — the send functions return a "skipped" result rather than throwing, so
 * contact submissions still save to the database and the admin console still works.
 * Set RESEND_API_KEY to switch it on.
 *
 * Notifications additionally need CONTACT_NOTIFY_EMAIL: the address YOU want new
 * messages delivered to. Without it there is nowhere to send them, so they are skipped.
 */
const resendApiKey = process.env.RESEND_API_KEY;
const notifyAddress = process.env.CONTACT_NOTIFY_EMAIL;

export const emailEnabled = Boolean(resendApiKey);

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/** Sender identity. `onboarding@resend.dev` is Resend's shared test sender and can only
 *  deliver to the address that owns the API key — verify a domain to send anywhere. */
const FROM_NOTIFY = 'Thessaris Contact <onboarding@resend.dev>';
const FROM_REPLY = 'Thessaris Support <onboarding@resend.dev>';

export type EmailResult = { sent: boolean; reason?: string };

const skipped = (reason: string): EmailResult => ({ sent: false, reason });

export async function sendNotificationEmail(contactData: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<EmailResult> {
  if (!resend) return skipped('RESEND_API_KEY not configured — email disabled');
  if (!notifyAddress) return skipped('CONTACT_NOTIFY_EMAIL not configured');

  try {
    await resend.emails.send({
      from: FROM_NOTIFY,
      // The site owner, NOT contactData.email. The previous version mailed the
      // notification to whoever submitted the form, so the sender received their own
      // message back and the site owner was never told anything had arrived.
      to: [notifyAddress],
      replyTo: contactData.email,
      subject: `[Thessaris] ${contactData.subject || 'New contact submission'} from ${contactData.name}`,
      html: `
        <div style="font-family: monospace; background: #09090b; color: #fafafa; padding: 24px; border-radius: 8px;">
          <h2 style="color: #ff4500; margin-top: 0;">New Transmission Received</h2>
          <p><strong>From:</strong> ${contactData.name} (&lt;${contactData.email}&gt;)</p>
          <p><strong>Subject:</strong> ${contactData.subject || 'N/A'}</p>
          <hr style="border: 0; border-top: 1px solid #27272a; margin: 16px 0;" />
          <div style="white-space: pre-wrap; line-height: 1.6; color: #a1a1aa;">${contactData.message}</div>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error('[Resend] notification failed:', error);
    return skipped(error instanceof Error ? error.message : String(error));
  }
}

export async function sendReplyEmail(
  to: string,
  recipientName: string,
  replyMessage: string,
  originalSubject?: string
): Promise<EmailResult> {
  if (!resend) return skipped('RESEND_API_KEY not configured — email disabled');

  try {
    await resend.emails.send({
      from: FROM_REPLY,
      to: [to],
      subject: `Re: ${originalSubject || 'Your message to Thessaris'}`,
      html: `
        <div style="font-family: sans-serif; background: #09090b; color: #fafafa; padding: 24px; border-radius: 8px;">
          <h3 style="color: #ff4500; margin-top: 0;">Transmission from Thessaris Command</h3>
          <p>Hello ${recipientName},</p>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #e4e4e7; margin: 16px 0; padding: 16px; background: #18181b; border-left: 3px solid #ff4500;">${replyMessage}</div>
          <p style="color: #71717a; font-size: 12px; margin-top: 24px;">This is a reply to your inquiry sent via Thessaris Solar System Simulation.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error('[Resend] reply failed:', error);
    return skipped(error instanceof Error ? error.message : String(error));
  }
}

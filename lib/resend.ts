import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendNotificationEmail(contactData: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY is not set. Email notification skipped.');
    return { success: false, reason: 'RESEND_API_KEY missing' };
  }

  try {
    const data = await resend.emails.send({
      from: 'Thessaris Contact <onboarding@resend.dev>',
      to: [contactData.email], // Can be user email or your admin email
      subject: `[Thessaris] ${contactData.subject || 'New Contact Submission'} from ${contactData.name}`,
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
    return { success: true, data };
  } catch (error) {
    console.error('[Resend Error]', error);
    return { success: false, error };
  }
}

export async function sendReplyEmail(to: string, recipientName: string, replyMessage: string, originalSubject?: string) {
  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY is not set. Reply email skipped.');
    return { success: false, reason: 'RESEND_API_KEY missing' };
  }

  try {
    const data = await resend.emails.send({
      from: 'Thessaris Support <onboarding@resend.dev>',
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
    return { success: true, data };
  } catch (error) {
    console.error('[Resend Reply Error]', error);
    return { success: false, error };
  }
}

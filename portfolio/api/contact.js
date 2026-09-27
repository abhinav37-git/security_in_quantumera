/**
 * Vercel serverless handler for consultation form (POST /api/contact).
 * Requires RESEND_API_KEY in Vercel env. Optional: INQUIRY_TO_EMAIL, RESEND_FROM.
 */

const INQUIRY_TO = (process.env.INQUIRY_TO_EMAIL || '').trim() || 'abhinavd372@gmail.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SANDBOX_FROM = 'Velith Systems <onboarding@resend.dev>';

/** Resend rejects unverified domains (e.g. legacy kestrelsec.com env). */
function resolveFromAddress() {
  const configured = (process.env.RESEND_FROM || '').trim();
  if (!configured || /kestrelsec\.com/i.test(configured)) {
    if (configured) {
      console.warn('[contact] RESEND_FROM uses unverified kestrelsec.com; using Resend sandbox sender');
    }
    return SANDBOX_FROM;
  }
  return configured;
}

const RESEND_FROM = resolveFromAddress();

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildInquiryHtml({ name, email, service, message, timestamp }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Inter, Arial, sans-serif; background: #0b1220; color: #e2e8f0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 28px;">
    <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #22d3ee;">Velith Systems</p>
    <h1 style="margin: 0 0 16px; font-size: 22px; color: #f8fafc;">New consultation request received</h1>
    <p style="margin: 0 0 24px; color: #94a3b8; line-height: 1.5;">
      A visitor submitted the contact form on your portfolio site.
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0;">${escapeHtml(timestamp)}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Name</td><td style="padding: 8px 0;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #38bdf8;">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Service</td><td style="padding: 8px 0;">${escapeHtml(service)}</td></tr>
    </table>
    <div style="margin-top: 20px; padding: 16px; background: #0f172a; border-radius: 8px; border-left: 3px solid #22d3ee;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase;">Message</p>
      <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
    </div>
    <p style="margin: 24px 0 0; font-size: 12px; color: #64748b;">Reply directly to this email to reach the inquirer.</p>
  </div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY is not configured');
    return res.status(503).json({ error: 'Contact email is not configured on the server.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const service = String(body.service || 'General Consultation').slice(0, 200);
  const name = String(body.name || 'Inquirer').slice(0, 200);
  const email = String(body.email || '').trim();
  const message = String(body.message || 'No message provided').slice(0, 8000);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid work email is required.' });
  }

  const timestamp = new Date().toISOString();
  const subject = `Velith Systems: New consultation request from ${name}`;
  const text = [
    'Velith Systems: New consultation request received',
    '',
    `Time:    ${timestamp}`,
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Service: ${service}`,
    '',
    'Message:',
    message,
  ].join('\n');

  const html = buildInquiryHtml({ name, email, service, message, timestamp });

  console.log('[contact]', { service, name, email, messageLength: message.length });

  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [INQUIRY_TO],
      reply_to: email,
      subject,
      html,
      text,
    }),
  });

  const sendBody = await sendRes.text();
  if (!sendRes.ok) {
    console.error('[contact] Resend failed:', sendRes.status, sendBody);
    return res.status(502).json({ error: 'Failed to send inquiry email.' });
  }

  let resendId = '';
  try {
    resendId = JSON.parse(sendBody).id || '';
  } catch (err) {
    resendId = '';
  }
  console.log('[contact] sent', { to: INQUIRY_TO, from: RESEND_FROM, resendId });

  return res.status(200).json({
    success: true,
    message: 'Consultation inquiry received successfully.',
  });
};

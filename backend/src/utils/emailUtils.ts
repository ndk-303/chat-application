import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('[Email] SMTP connection failed:', err.message);
  } else {
    console.log('[Email] SMTP connection ready. Sending from:', process.env.EMAIL_USER);
  }
});

const APP_NAME = 'Kapta';
const SENDER = `"${APP_NAME}" <${process.env.EMAIL_USER}>`;

export const sendVerificationEmail = async (
  to: string,
  code: string,
  displayName?: string,
): Promise<void> => {
  const name = displayName || 'there';

  await transporter.sendMail({
    from: SENDER,
    to,
    subject: `[${APP_NAME}] Mã xác thực email của bạn: ${code}`,
    html: buildEmailHtml({
      title: `Hi ${name} 👋`,
      body: `Sử dụng mã dưới đây để xác thực địa chỉ email. Mã sẽ hết hạn sau <strong>15 phút</strong>.`,
      code,
      footer: `Nếu bạn không tạo tài khoản ${APP_NAME}, hãy bỏ qua email này.`,
    }),
  });
};

/* ── Password‑reset email ───────────────────────────────────── */
export const sendPasswordResetEmail = async (
  to: string,
  code: string,
  displayName?: string,
): Promise<void> => {
  const name = displayName || 'bạn';

  await transporter.sendMail({
    from: SENDER,
    to,
    subject: `[${APP_NAME}] Mã đặt lại mật khẩu: ${code}`,
    html: buildEmailHtml({
      title: `Đặt lại mật khẩu`,
      body: `Xin chào ${name},<br/>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Sử dụng mã dưới đây. Mã sẽ hết hạn sau <strong>1 giờ</strong>.`,
      code,
      footer: `Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.`,
    }),
  });
};

/* ── Shared HTML builder ────────────────────────────────────── */
function buildEmailHtml({
  title, body, code, footer,
}: { title: string; body: string; code: string; footer: string }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,104,255,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0068FF;padding:28px 32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;text-align:center;line-height:40px;">
                <span style="color:#fff;font-size:20px;">💬</span>
              </div>
              <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${APP_NAME}</span>
            </div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px 24px;">
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1F2937;">${title}</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">${body}</p>
            <!-- Code box -->
            <div style="background:#F0F5FF;border:2px solid #0068FF;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
              <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0068FF;font-family:monospace;">${code}</span>
            </div>
            <p style="margin:0;font-size:13px;color:#9CA3AF;">${footer}</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #F0F2F5;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2025 ${APP_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

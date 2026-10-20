import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Generate a cryptographically random 6-digit OTP code
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Hash the OTP code before storing in PostgreSQL
export function hashOtpCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

// Compare provided code with stored hash in constant time
export function verifyOtpCode(providedCode: string, storedHash: string): boolean {
  if (!providedCode || !storedHash) return false;
  const computedHash = hashOtpCode(providedCode);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
}

// Configure nodemailer transporter if SMTP environment variables are present
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'CupidGo <no-reply@cupidgo.vn>';

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;
let transporter: MailTransporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export interface SendVerificationEmailResult {
  success: boolean;
  method: 'SMTP' | 'DEVELOPMENT_LOG';
  error?: string;
}

/**
 * Sends an email containing the 6-digit verification code.
 */
export async function sendVerificationEmail(
  toEmail: string,
  otpCode: string,
  displayName?: string
): Promise<SendVerificationEmailResult> {
  const recipient = displayName || toEmail.split('@')[0];

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #0c0a09; color: #f5f5f4; border-radius: 20px; overflow: hidden; border: 1px solid #292524;">
      <div style="background: linear-gradient(135deg, #e11d48, #ec4899); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">CupidGo</h1>
        <p style="margin: 6px 0 0 0; color: #ffe4e6; font-size: 13px; font-weight: 500;">Hẹn Hò & Kết Đôi Chân Thật</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #d6d3d1;">Xin chào <strong>${recipient}</strong>,</p>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a8a29e;">
          Cảm ơn bạn đã đăng ký tài khoản CupidGo. Để bảo vệ cộng đồng người dùng thật và bảo mật tài khoản, vui lòng sử dụng mã xác minh dưới đây:
        </p>
        
        <div style="background-color: #1c1917; border: 2px dashed #e11d48; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #fb7185;">${otpCode}</span>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #78716c;">Mã có hiệu lực trong vòng 15 phút</p>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #78716c;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Tuyệt đối không chia sẻ mã này cho bất kỳ ai để đảm bảo an toàn cho tài khoản của bạn.
        </p>
      </div>
      <div style="border-top: 1px solid #292524; padding: 16px 24px; text-align: center; font-size: 11px; color: #57534e;">
        © ${new Date().getFullYear()} CupidGo Team. Bảo mật người dùng thật 100%.
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject: `[CupidGo] Mã xác minh tài khoản của bạn: ${otpCode}`,
        text: `Mã xác minh tài khoản CupidGo của bạn là: ${otpCode}. Mã có hiệu lực trong 15 phút.`,
        html: htmlContent,
      });
      return { success: true, method: 'SMTP' };
    } catch (err: any) {
      console.error('[EmailService] SMTP delivery failed:', err);
      return { success: false, method: 'SMTP', error: err.message };
    }
  }

  // When SMTP is not configured in environment, log clearly on server
  console.log(`\n============================================================`);
  console.log(`[CUPIDGO EMAIL VERIFICATION DISPATCH]`);
  console.log(`Recipient: ${toEmail}`);
  console.log(`Verification OTP Code: [ ${otpCode} ]`);
  console.log(`Expires in: 15 minutes`);
  console.log(`Note: Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env for custom SMTP.`);
  console.log(`============================================================\n`);

  return { success: true, method: 'DEVELOPMENT_LOG' };
}

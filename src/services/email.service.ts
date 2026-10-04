import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  /**
   * Send password reset OTP email
   */
  async sendPasswordResetOtp(email: string, otp: string, recipientName?: string): Promise<boolean> {
    const greeting = recipientName ? `Xin chào <strong>${recipientName}</strong>,` : "Xin chào bạn,";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fa; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #10B981, #059669); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
          .content { padding: 32px 28px; color: #374151; font-size: 15px; line-height: 1.6; }
          .otp-box { margin: 28px 0; text-align: center; background: #ECFDF5; border: 2px dashed #10B981; border-radius: 12px; padding: 20px; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669; font-family: monospace; }
          .otp-note { font-size: 13px; color: #6B7280; margin-top: 8px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍳 SmartCook</h1>
            <p>Xác thực đặt lại mật khẩu</p>
          </div>
          <div class="content">
            <p>${greeting}</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản SmartCook của bạn. Vui lòng nhập mã xác thực OTP dưới đây để hoàn tất quá trình:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-note">Mã OTP có hiệu lực trong vòng <strong>15 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</div>
            </div>

            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu ngay để đảm bảo an toàn.</p>
            <p>Trân trọng,<br><strong>Đội ngũ SmartCook</strong></p>
          </div>
          <div class="footer">
            © 2026 SmartCook Vietnam. All rights reserved.<br>
            Email này được gửi tự động, vui lòng không phản hồi.
          </div>
        </div>
      </body>
      </html>
    `;

    if (!this.transporter) {
      console.log(`[EmailService Mock] Đã gửi OTP "${otp}" tới email "${email}" (Chế độ phát triển / Test)`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: "🍳 [SmartCook] Mã xác thực OTP đặt lại mật khẩu của bạn",
        html: htmlContent,
      });
      return true;
    } catch (error) {
      console.error("[EmailService] Gửi email thất bại:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;

import { Injectable, Logger } from '@nestjs/common';

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: import('nodemailer').Transporter | null = null;

  private async getTransporter() {
    if (this.transporter) return this.transporter;
    const host = process.env.SMTP_HOST;
    if (!host) {
      return null;
    }
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    let nodemailerModule: typeof import('nodemailer');
    try {
      const override = (globalThis as any).__nodemailer;
      nodemailerModule = override ?? (await import('nodemailer'));
    } catch (err) {
      this.logger.warn('nodemailer not installed; skipping email send.');
      return null;
    }
    const createTransport =
      (nodemailerModule as any).default?.createTransport ??
      nodemailerModule.createTransport;
    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
    return this.transporter;
  }

  async sendMail(payload: EmailPayload) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      this.logger.warn('SMTP not configured; skipping email send.');
      return false;
    }
    const from = process.env.SMTP_FROM ?? 'no-reply@uniconnect.local';
    await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    });
    return true;
  }
}

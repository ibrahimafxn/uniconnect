import { EmailService } from './email.service';

describe('EmailService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    delete (globalThis as any).__nodemailer;
  });

  it('returns false when SMTP is not configured', async () => {
    delete process.env.SMTP_HOST;
    const service = new EmailService();
    const res = await service.sendMail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Hello',
    });
    expect(res).toBe(false);
  });

  it('uses nodemailer when SMTP is configured', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_FROM = 'no-reply@example.com';
    (globalThis as any).__nodemailer = {
      createTransport: () => ({
        sendMail: jest.fn().mockResolvedValue({}),
      }),
    };

    const service = new EmailService();
    const res = await service.sendMail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Hello',
    });
    expect(res).toBe(true);
  });

  it('reuses transporter and passes auth settings', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    const sendMail = jest.fn().mockResolvedValue({});
    const createTransport = jest.fn().mockReturnValue({ sendMail });
    (globalThis as any).__nodemailer = { createTransport };

    const service = new EmailService();
    await service.sendMail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Hello',
    });
    await service.sendMail({
      to: 'test@example.com',
      subject: 'Test 2',
      text: 'Hello',
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: { user: 'user', pass: 'pass' },
    });
    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it('returns false when nodemailer is missing', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';

    const service = new EmailService();
    const res = await service.sendMail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Hello',
    });
    expect(res).toBe(false);
  });
});

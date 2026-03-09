import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SystemConfig,
  SmtpConfig,
  EmailTemplate,
  SystemParams,
} from './system-config.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';

@Injectable()
export class GlobalConfigService {
  constructor(
    @InjectModel(SystemConfig.name)
    private readonly configModel: Model<SystemConfig>,
    private readonly auditLog: AuditLogService,
  ) {}

  private async getOrCreate(): Promise<SystemConfig> {
    let config = await this.configModel.findOne({ key: 'default' }).exec();
    if (!config) {
      config = await this.configModel.create({ key: 'default' });
    }
    return config;
  }

  // ── SMTP ──────────────────────────────────────────────────────────────────

  async getSmtpConfig() {
    const config = await this.getOrCreate();
    return config.smtp;
  }

  async updateSmtpConfig(smtp: SmtpConfig, actor: AuditActor) {
    const config = await this.getOrCreate();
    config.smtp = smtp;
    await config.save();
    await this.auditLog.log({
      action: 'UPDATE_SMTP_CONFIG',
      entity: 'SystemConfig',
      entityId: String(config._id),
      actor,
      metadata: { host: smtp.host, port: smtp.port, from: smtp.from },
    });
    return config.smtp;
  }

  // ── Email templates ───────────────────────────────────────────────────────

  async listEmailTemplates() {
    const config = await this.getOrCreate();
    return config.emailTemplates;
  }

  async upsertEmailTemplate(
    key: string,
    data: { subject: string; body: string },
    actor: AuditActor,
  ) {
    const config = await this.getOrCreate();
    const idx = config.emailTemplates.findIndex((t) => t.key === key);
    if (idx >= 0) {
      config.emailTemplates[idx] = { key, ...data };
    } else {
      config.emailTemplates.push({ key, ...data });
    }
    config.markModified('emailTemplates');
    await config.save();
    await this.auditLog.log({
      action: 'UPSERT_EMAIL_TEMPLATE',
      entity: 'SystemConfig',
      entityId: String(config._id),
      actor,
      metadata: { key },
    });
    return config.emailTemplates.find((t) => t.key === key);
  }

  async deleteEmailTemplate(key: string, actor: AuditActor) {
    const config = await this.getOrCreate();
    const before = config.emailTemplates.length;
    config.emailTemplates = config.emailTemplates.filter((t) => t.key !== key);
    config.markModified('emailTemplates');
    await config.save();
    await this.auditLog.log({
      action: 'DELETE_EMAIL_TEMPLATE',
      entity: 'SystemConfig',
      entityId: String(config._id),
      actor,
      metadata: { key, deleted: before !== config.emailTemplates.length },
    });
    return { success: true };
  }

  // ── System parameters ─────────────────────────────────────────────────────

  async getSystemParams() {
    const config = await this.getOrCreate();
    return config.systemParams;
  }

  async updateSystemParams(
    params: Partial<SystemParams>,
    actor: AuditActor,
  ) {
    const config = await this.getOrCreate();
    config.systemParams = { ...config.systemParams, ...params };
    config.markModified('systemParams');
    await config.save();
    await this.auditLog.log({
      action: 'UPDATE_SYSTEM_PARAMS',
      entity: 'SystemConfig',
      entityId: String(config._id),
      actor,
      metadata: params,
    });
    return config.systemParams;
  }
}

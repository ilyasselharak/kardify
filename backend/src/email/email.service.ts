import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfig } from '../config/app-config.js';
import type { Language } from '../generated/prisma/client.js';
import { renderEmail } from './templates/layout.js';
import { EMAIL_MESSAGES } from './templates/messages.js';

type TemplateKey = keyof typeof EMAIL_MESSAGES;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend?: Resend;

  constructor(private readonly config: AppConfig) {
    if (config.resendApiKey) this.resend = new Resend(config.resendApiKey);
    else this.logger.warn('RESEND_API_KEY not set: emails will be logged to the console instead of sent');
  }

  async send(template: TemplateKey, to: string, lang: Language, vars: { name: string; url: string }) {
    const t = EMAIL_MESSAGES[template][lang] ?? EMAIL_MESSAGES[template].en;
    const fill = (s: string) => s.replace('{name}', vars.name);
    const html = renderEmail({
      lang,
      heading: fill(t.heading),
      body: fill(t.body),
      cta: t.cta,
      url: vars.url,
      footer: t.footer,
    });

    if (!this.resend) {
      this.logger.log(`[dev email] to=${to} subject="${t.subject}" link=${vars.url}`);
      return;
    }
    const { error } = await this.resend.emails.send({ from: this.config.emailFrom, to, subject: t.subject, html });
    if (error) {
      this.logger.error(`Failed to send "${template}" email: ${error.message}`);
      throw new Error('Email delivery failed');
    }
  }

  /** Fire-and-forget variant so slow email delivery never blocks API responses. */
  dispatch(template: TemplateKey, to: string, lang: Language, vars: { name: string; url: string }) {
    void this.send(template, to, lang, vars).catch((err: Error) => this.logger.error(err.message));
  }
}

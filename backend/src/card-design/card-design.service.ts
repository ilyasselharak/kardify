import { Injectable } from '@nestjs/common';
import type { DesignSettingsDto } from './design.dto.js';
import type { DesignSettings, TemplateId } from './design.types.js';
import { defaultDesign, TEMPLATES } from './templates.js';

@Injectable()
export class CardDesignService {
  listTemplates() {
    return Object.values(TEMPLATES);
  }

  /** Merges a (partial, already validated) design onto a base design, defaulting to the template preset. */
  resolve(input: DesignSettingsDto | undefined, base?: DesignSettings, fallbackTemplate: TemplateId = 'classic'): DesignSettings {
    const templateChanged = input?.template && input.template !== base?.template;
    const start = !base || templateChanged ? defaultDesign(input?.template ?? base?.template ?? fallbackTemplate) : base;
    const { back, ...front } = input ?? {};
    return {
      ...start,
      ...stripUndefined(front),
      back: { ...start.back, ...stripUndefined(back ?? {}) },
    } as DesignSettings;
  }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

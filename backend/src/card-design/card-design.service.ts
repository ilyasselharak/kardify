import { Injectable } from '@nestjs/common';
import type { DesignSettingsDto } from './design.dto.js';
import type { DesignSettings, TemplateId } from './design.types.js';
import { defaultDesign, TEMPLATE_CATEGORY, TEMPLATES } from './templates.js';

@Injectable()
export class CardDesignService {
  listTemplates() {
    return Object.values(TEMPLATES).map((t) => ({ ...t, category: TEMPLATE_CATEGORY[t.template] }));
  }

  /** Merges a (partial, already validated) design onto a base design, defaulting to the template preset. */
  resolve(input: DesignSettingsDto | undefined, base?: DesignSettings, fallbackTemplate: TemplateId = 'classic'): DesignSettings {
    const templateChanged = input?.template && input.template !== base?.template;
    // Older stored designs lack newer fields: complete them from their template first.
    const start = !base || templateChanged
      ? defaultDesign(input?.template ?? base?.template ?? fallbackTemplate)
      : completeDesign(base);
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

/** Fills fields missing from older stored designs with their template's defaults. */
export function completeDesign(stored: Partial<DesignSettings>): DesignSettings {
  const tpl = defaultDesign(stored.template && stored.template in TEMPLATES ? stored.template : 'classic');
  return { ...tpl, ...stored, back: { ...tpl.back, ...(stored.back ?? {}) } } as DesignSettings;
}

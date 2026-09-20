/**
 * SOUQ — configurable COD checkout settings.
 *
 * The form is architected around configuration, not around hardcoded fields.
 * Config is read from `stores.settings.checkout` (existing JSONB column — no
 * schema change required) and always falls back to safe defaults, so a store
 * created before SOUQ, or a partially filled config, still renders a complete
 * working form.
 *
 * Conceptual shape (stored under settings.checkout):
 * {
 *   fields: [{ key: "first_name", enabled: true, required: true }, ...],
 *   show_quantity: true,
 *   show_quantity_offers: true,
 *   show_delivery_choice: true,
 *   variant_display: "dynamic"
 * }
 */
import { z } from "zod";

export const SOUQ_CHECKOUT_FIELD_KEYS = [
  "first_name",
  "last_name",
  "phone",
  "email",
  "wilaya",
  "commune",
  "address",
  "office",
] as const;
export type SouqCheckoutFieldKey = (typeof SOUQ_CHECKOUT_FIELD_KEYS)[number];

export const SOUQ_VARIANT_DISPLAYS = ["dynamic", "buttons", "dropdown"] as const;
export type SouqVariantDisplay = (typeof SOUQ_VARIANT_DISPLAYS)[number];

const fieldSchema = z.object({
  key: z.enum(SOUQ_CHECKOUT_FIELD_KEYS),
  enabled: z.boolean().optional(),
  required: z.boolean().optional(),
});

export const souqCheckoutSettingsSchema = z.object({
  fields: z.array(fieldSchema).max(20).optional(),
  show_quantity: z.boolean().optional(),
  show_quantity_offers: z.boolean().optional(),
  show_delivery_choice: z.boolean().optional(),
  variant_display: z.enum(SOUQ_VARIANT_DISPLAYS).optional(),
  show_email_field: z.boolean().optional(),
});

export type SouqCheckoutSettingsInput = z.infer<typeof souqCheckoutSettingsSchema>;

export interface SouqCheckoutFieldSetting {
  key: SouqCheckoutFieldKey;
  enabled: boolean;
  required: boolean;
}

export interface SouqCheckoutSettings {
  fields: SouqCheckoutFieldSetting[];
  showQuantity: boolean;
  showQuantityOffers: boolean;
  showDeliveryChoice: boolean;
  variantDisplay: SouqVariantDisplay;
}

/**
 * Defaults reproduce the documented SOUQ flow:
 * الاسم / اللقب / رقم الهاتف required, the rest optional but visible.
 * The legacy single "full_name" flow stays available when last_name is disabled.
 */
export const SOUQ_CHECKOUT_DEFAULTS: SouqCheckoutSettings = {
  fields: [
    { key: "first_name", enabled: true, required: true },
    { key: "last_name", enabled: true, required: true },
    { key: "phone", enabled: true, required: true },
    { key: "email", enabled: false, required: false },
    { key: "wilaya", enabled: true, required: true },
    { key: "commune", enabled: true, required: true },
    { key: "address", enabled: true, required: true },
    { key: "office", enabled: true, required: true },
  ],
  showQuantity: true,
  showQuantityOffers: true,
  showDeliveryChoice: true,
  variantDisplay: "dynamic",
};

export function resolveSouqCheckoutSettings(raw: unknown): SouqCheckoutSettings {
  const parsed = souqCheckoutSettingsSchema.safeParse(raw);
  const input: SouqCheckoutSettingsInput = parsed.success ? parsed.data : {};

  const fields: SouqCheckoutFieldSetting[] = SOUQ_CHECKOUT_DEFAULTS.fields.map((base) => {
    const override = (input.fields ?? []).find((f) => f.key === base.key);
    if (!override) return base;
    return {
      key: base.key,
      enabled: override.enabled ?? base.enabled,
      required: override.required ?? base.required,
    };
  });

  return {
    fields,
    showQuantity: input.show_quantity ?? SOUQ_CHECKOUT_DEFAULTS.showQuantity,
    showQuantityOffers: input.show_quantity_offers ?? SOUQ_CHECKOUT_DEFAULTS.showQuantityOffers,
    showDeliveryChoice: input.show_delivery_choice ?? SOUQ_CHECKOUT_DEFAULTS.showDeliveryChoice,
    variantDisplay: input.variant_display ?? SOUQ_CHECKOUT_DEFAULTS.variantDisplay,
  };
}

export function fieldSetting(settings: SouqCheckoutSettings, key: SouqCheckoutFieldKey): SouqCheckoutFieldSetting {
  const found = settings.fields.find((f) => f.key === key);
  return found ?? { key, enabled: key === "email" ? false : true, required: key !== "email" && key !== "last_name" };
}

/**
 * Legacy-compatible name mapping: the shared checkout engine expects a single
 * `full_name` (min 3 chars). SOUQ splits it visually into الاسم + اللقب and
 * recombines it here — no API/backend change, no duplicated checkout.
 */
export function composeFullName(firstName: string, lastName: string, lastNameEnabled: boolean): string {
  const first = firstName.trim().replace(/\s+/g, " ");
  const last = lastName.trim().replace(/\s+/g, " ");
  if (!lastNameEnabled) return first;
  return `${first} ${last}`.trim();
}

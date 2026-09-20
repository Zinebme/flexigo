"use client";

/**
 * SOUQ — COD order form ("أكمل طلبك").
 *
 * Reusable: rendered inside the SOUQ product page (buy-box) AND on the SOUQ
 * checkout page (/commande). It is only a *skin + UX* layer over the existing
 * FlexiGo checkout engine:
 *   - it posts to the shared `POST /api/checkout` route,
 *   - it sends identifiers only (product_id / variant_id / quantity),
 *   - the database function `fn_place_cod_order` remains the single authority
 *     for prices, quantity offers, shipping fees, stock and totals.
 * Displayed totals are a convenience preview computed with the same shared
 * pricing helpers, and are explicitly labelled as such.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { WILAYAS } from "@/lib/algeria/wilayas";
import { getCommunes } from "@/lib/algeria/communes";
import { wilayaLabel } from "@/lib/algeria/wilayas-ar";
import { formatSouqPrice } from "@/lib/storefront/souq/format";
import { isValidDZMobile, normalizeDZPhone } from "@/lib/phone";
import {
  composeFullName,
  fieldSetting,
  type SouqCheckoutSettings,
} from "@/lib/storefront/souq/checkout-settings";
import {
  buildOrderPreview,
  buildQuantityOfferCards,
  type SouqOrderPreview,
  type SouqPricingOffer,
  type SouqShippingZone,
} from "@/lib/storefront/souq/order-model";
import {
  applySelection,
  emptySelections,
  resolveVariant,
  selectedValues,
  validateSelections,
  type SouqAddOnProduct,
  type SouqOptionGroup,
  type SouqSelections,
  type SouqVariantInput,
} from "@/lib/storefront/souq/variants";
import { souqFormat, type SouqCopy } from "@/lib/storefront/souq/copy";
import type { StoreLanguage } from "@/lib/types";
import { SouqIcon, SouqStars } from "./souq-ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SouqOrderProduct {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  imageUrl: string | null;
  stock: number;
  ratingAverage?: number | null;
  ratingCount?: number;
}

export interface SouqOrderFormData {
  storeSlug: string;
  base: string;
  copy: SouqCopy;
  lang: StoreLanguage;
  currency: string;
  settings: SouqCheckoutSettings;
  product: SouqOrderProduct;
  variants: SouqVariantInput[];
  optionGroups: SouqOptionGroup[];
  addOnProducts: SouqAddOnProduct[];
  offers: SouqPricingOffer[];
  zones: SouqShippingZone[];
  officeDeliveryEnabled: boolean;
  whatsapp: string | null;
  /**
   * When false, the option pickers / quantity offers are rendered by the host
   * (the SOUQ product page displays them next to the price) using the same
   * shared state — the form never duplicates them.
   */
  showOptionPickers?: boolean;
  showQuantityOffers?: boolean;
  initialQuantity?: number;
  initialVariantId?: string | null;
  /** Anchor id so the sticky CTA can scroll straight to the form. */
  anchorId?: string;
  className?: string;
}

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; orderNumber: string; totalCents: number };

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  wilaya?: string;
  commune?: string;
  address?: string;
  office?: string;
  options?: string;
}

// ---------------------------------------------------------------------------
// State hook (shared by the product page buy-box and the checkout page)
// ---------------------------------------------------------------------------

export interface SouqOrderFormState {
  selections: SouqSelections;
  setSelections: (next: SouqSelections) => void;
  quantity: number;
  setQuantity: (value: number) => void;
  deliveryType: "home" | "office";
  setDeliveryType: (value: "home" | "office") => void;
  wilayaCode: number | null;
  setWilayaCode: (value: number | null) => void;
  preview: SouqOrderPreview;
  variant: SouqVariantInput | null;
  inStock: boolean;
  selectedGroupValues: (group: SouqOptionGroup) => string[];
  toggleValue: (group: SouqOptionGroup, value: string) => void;
  optionIssues: ReturnType<typeof validateSelections>;
  submitState: SubmitState;
  fieldErrors: FieldErrors;
  resetSubmit: () => void;
}

export function useSouqOrderState(
  data: SouqOrderFormData,
  /**
   * Ref of the rendered <section>/<form>. Owned by the view and passed in, so
   * the returned state object never carries a ref (refs must not be read
   * during render).
   */
  formRef: React.RefObject<HTMLFormElement | null>,
): SouqOrderFormState & {
  submit: (event: FormEvent<HTMLFormElement>) => void;
} {
  const [selections, setSelections] = useState<SouqSelections>(() => {
    const base = emptySelections(data.optionGroups);
    if (data.initialVariantId) {
      const variant = data.variants.find((v) => v.id === data.initialVariantId);
      if (variant) {
        for (const group of data.optionGroups) {
          if (group.selectionMode !== "single" || !group.optionKey) continue;
          const raw = (variant.options ?? {})[group.optionKey];
          if (typeof raw === "string") base[group.key] = [raw];
        }
      }
    }
    return base;
  });
  const [quantity, setQuantity] = useState(() => Math.max(1, data.initialQuantity ?? 1));
  const [deliveryType, setDeliveryType] = useState<"home" | "office">("home");
  const [wilayaCode, setWilayaCode] = useState<number | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const variant = useMemo(
    () => resolveVariant(data.variants, data.optionGroups, selections),
    [data.variants, data.optionGroups, selections],
  );

  const preview = useMemo(
    () =>
      buildOrderPreview({
        product: { id: data.product.id, name: data.product.name, price_cents: data.product.priceCents },
        variants: data.variants,
        groups: data.optionGroups,
        selections,
        quantity,
        offers: data.offers,
        addOnProducts: data.addOnProducts.map((a) => ({ id: a.id, slug: a.slug, name: a.name, price_cents: a.price_cents })),
        zones: data.zones,
        wilayaCode,
        deliveryType,
      }),
    [data, selections, quantity, wilayaCode, deliveryType],
  );

  const inStock = useMemo(() => {
    if (variant) return variant.stock >= quantity;
    // Variants exist but no valid combination is chosen yet: that is a missing
    // selection, not a stock problem — the pickers report it by name, so the
    // CTA must never claim the product is unavailable.
    if (data.variants.some((v) => v.is_active !== false)) return true;
    return data.product.stock >= quantity;
  }, [variant, data.variants, data.product.stock, quantity]);

  const optionIssues = useMemo(() => validateSelections(data.optionGroups, selections), [data.optionGroups, selections]);

  const toggleValue = useCallback(
    (group: SouqOptionGroup, value: string) => {
      setSubmitState((current) => (current.status === "success" ? current : { status: "idle" }));
      setSelections((current) => applySelection(group, current, value));
    },
    [],
  );

  const selectedGroupValues = useCallback((group: SouqOptionGroup) => selectedValues(selections, group), [selections]);

  const submitOrder = useCallback(
    async (payload: Record<string, unknown>) => {
      try {
        const url = new URL(window.location.href);
        const body = {
          ...payload,
          utm_source: url.searchParams.get("utm_source"),
          utm_medium: url.searchParams.get("utm_medium"),
          utm_campaign: url.searchParams.get("utm_campaign"),
          referrer: document.referrer || null,
        };
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string; order_number?: string; total_cents?: number }
          | null;

        if (!res.ok || !json?.ok) {
          if (res.status === 429) {
            setSubmitState({ status: "error", message: data.copy.errors.rateLimited });
            return;
          }
          if (res.status === 409) {
            setSubmitState({ status: "error", message: data.copy.errors.duplicate });
            return;
          }
          setSubmitState({ status: "error", message: translateServerError(json?.error, data.copy) });
          return;
        }
        setSubmitState({
          status: "success",
          orderNumber: json.order_number ?? "",
          totalCents: json.total_cents ?? preview.totalCents,
        });
      } catch {
        setSubmitState({ status: "error", message: data.copy.errors.network });
      }
    },
    [data.copy, preview.totalCents],
  );

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitState.status === "loading") return;

      const formData = new FormData(event.currentTarget);
      const field = (key: string) => String(formData.get(key) ?? "").trim();
      const errors: FieldErrors = {};

      const first = fieldSetting(data.settings, "first_name");
      const last = fieldSetting(data.settings, "last_name");
      const phone = fieldSetting(data.settings, "phone");
      const wilaya = fieldSetting(data.settings, "wilaya");
      const commune = fieldSetting(data.settings, "commune");
      const addressField = fieldSetting(data.settings, "address");
      const officeField = fieldSetting(data.settings, "office");

      const firstName = field("souq-first-name");
      const lastName = field("souq-last-name");
      const phoneValue = field("souq-phone");
      const communeValue = field("souq-commune") === "__other__" ? field("souq-commune-other") : field("souq-commune");
      const addressValue = field("souq-address");
      const officeValue = field("souq-office");

      if (first.enabled && first.required && firstName.length < 2) errors.firstName = data.copy.errors.firstName;
      if (last.enabled && last.required && lastName.length < 2) errors.lastName = data.copy.errors.lastName;
      if (phone.enabled && phone.required) {
        if (phoneValue.length === 0) errors.phone = data.copy.errors.phone;
        else if (!normalizeDZPhone(phoneValue)) errors.phone = data.copy.errors.phone;
        else if (!isValidDZMobile(phoneValue)) errors.phone = data.copy.errors.phoneMobile;
      }
      if (wilaya.enabled && wilaya.required && (!wilayaCode || wilayaCode < 1)) errors.wilaya = data.copy.errors.wilaya;
      if (commune.enabled && commune.required && communeValue.length < 2) errors.commune = data.copy.errors.commune;
      if (deliveryType === "home" && addressField.enabled && addressField.required && addressValue.length < 4) {
        errors.address = data.copy.errors.address;
      }
      if (deliveryType === "office" && officeField.enabled && officeField.required && officeValue.length < 2) {
        errors.office = data.copy.errors.office;
      }
      if (optionIssues.length > 0) {
        const issue = optionIssues[0];
        errors.options =
          issue?.code === "required"
            ? souqFormat(data.copy.errors.optionRequired, { label: issue.label })
            : issue?.code === "min"
              ? souqFormat(data.copy.errors.optionMin, { label: issue.label, n: issue.count ?? 1 })
              : souqFormat(data.copy.errors.optionMax, { label: issue?.label ?? "", n: issue?.count ?? 1 });
      }
      if (!inStock) {
        errors.options = data.copy.errors.outOfStock;
      } else if (data.variants.some((v) => v.is_active !== false) && !variant) {
        // Every required group is answered, but that combination is not one of
        // the sellable variants: block it rather than letting the API bill the
        // base product with variant_id = null.
        errors.options = data.copy.errors.variantUnavailable;
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setSubmitState({ status: "idle" });
        const firstKey = Object.keys(errors)[0];
        if (firstKey) {
          const target = formRef.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
          target?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      setFieldErrors({});
      setSubmitState({ status: "loading" });

      const fullName = composeFullName(firstName, lastName, last.enabled);
      const lines = preview.lines.map((line) => ({
        product_id: line.productId,
        variant_id: line.variantId,
        quantity: line.quantity,
      }));

      const payload = {
        store_slug: data.storeSlug,
        lines,
        full_name: fullName,
        phone: phoneValue,
        email: fieldSetting(data.settings, "email").enabled ? field("souq-email") || null : null,
        wilaya_code: wilayaCode ?? 0,
        commune: communeValue,
        address: deliveryType === "home" ? addressValue || null : null,
        delivery_type: deliveryType,
        office: deliveryType === "office" ? officeValue || null : null,
        website: field("souq-website"),
        locale: data.lang,
      };

      void submitOrder(payload);
    },
    [data, deliveryType, formRef, inStock, optionIssues, preview.lines, submitOrder, submitState.status, variant, wilayaCode],
  );

  useEffect(() => {
    if (submitState.status !== "success") return;
    const node = formRef.current?.parentElement;
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formRef, submitState.status]);

  return {
    selections,
    setSelections,
    quantity,
    setQuantity,
    deliveryType,
    setDeliveryType,
    wilayaCode,
    setWilayaCode,
    preview,
    variant,
    inStock,
    selectedGroupValues,
    toggleValue,
    optionIssues,
    submitState,
    fieldErrors,
    resetSubmit: () => {
      setSubmitState({ status: "idle" });
      setFieldErrors({});
    },
    submit,
  };
}

/** Never surface raw server/database errors to a shopper. */
function translateServerError(message: string | undefined, copy: SouqCopy): string {
  if (!message) return copy.errors.sendFailed;
  // Already localized (the checkout API answers in the requested locale).
  if (/[\u0600-\u06FF]/.test(message)) return message;
  const known: Array<[RegExp, string]> = [
    [/stock/i, copy.errors.outOfStock],
    [/témoin|invalid|invalide/i, copy.errors.options],
    [/commune/i, copy.errors.commune],
    [/téléphone|phone/i, copy.errors.phone],
  ];
  for (const [pattern, replacement] of known) {
    if (pattern.test(message)) return replacement;
  }
  return copy.errors.sendFailed;
}

// ---------------------------------------------------------------------------
// Option pickers (dynamic groups)
// ---------------------------------------------------------------------------

export function SouqOptionPickers({
  groups,
  state,
  copy,
  lang,
  disabled = false,
}: {
  groups: SouqOptionGroup[];
  state: SouqOrderFormState;
  copy: SouqCopy;
  lang: StoreLanguage;
  disabled?: boolean;
}) {
  if (groups.length === 0) return null;
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SouqOptionGroupField key={group.key} group={group} state={state} copy={copy} lang={lang} disabled={disabled} />
      ))}
    </div>
  );
}

function SouqOptionGroupField({
  group,
  state,
  copy,
  lang,
  disabled,
}: {
  group: SouqOptionGroup;
  state: SouqOrderFormState;
  copy: SouqCopy;
  lang: StoreLanguage;
  disabled: boolean;
}) {
  const chosen = state.selectedGroupValues(group);
  const id = `souq-opt-${group.key}`;
  const labelId = `${id}-label`;
  const atMax = group.maxSelections !== null && chosen.length >= group.maxSelections;

  if (group.displayType === "dropdown") {
    const value = chosen[0] ?? "";
    return (
      <div data-field={`option-${group.key}`}>
        <span id={labelId} className="souq-label">
          {group.label}
          {group.required ? <span className="text-[var(--souq-danger)]"> *</span> : null}
        </span>
        <select
          id={id}
          className="souq-input"
          value={value}
          disabled={disabled}
          aria-labelledby={labelId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const next = event.target.value;
            const current = chosen[0];
            if (current) state.toggleValue(group, current);
            if (next) state.toggleValue(group, next);
          }}
        >
          <option value="">—</option>
          {group.values.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {group.help ? <p className="souq-help">{group.help}</p> : null}
      </div>
    );
  }

  return (
    <fieldset data-field={`option-${group.key}`} className="min-w-0">
      <legend id={labelId} className="souq-label">
        {group.label}
        {group.required ? <span className="text-[var(--souq-danger)]"> *</span> : <span className="text-slate-400"> ({copy.checkout.optional})</span>}
        {group.selectionMode === "multiple" && group.maxSelections ? (
          <span className="ms-1 text-[11px] font-semibold text-slate-400">
            ({chosen.length}/{group.maxSelections})
          </span>
        ) : null}
      </legend>

      {group.displayType === "checkbox" ? (
        <ul className="mt-2 space-y-2">
          {group.values.map((option) => {
            const isSelected = chosen.includes(option.value);
            return (
              <li key={option.value}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-3.5 py-3 transition ${
                    isSelected
                      ? "border-[var(--souq-primary)] bg-[var(--souq-primary-soft)]"
                      : "border-[var(--souq-border)] bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    name={id}
                    value={option.value}
                    checked={isSelected}
                    disabled={disabled || option.disabled || (!isSelected && atMax)}
                    onChange={() => state.toggleValue(group, option.value)}
                    className="h-4 w-4 accent-[var(--souq-primary)]"
                  />
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {option.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- option thumbnails are tiny and already sized by the merchant
                      <img src={option.image} alt="" className="h-8 w-8 rounded-[8px] object-cover" loading="lazy" />
                    ) : null}
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-slate-800">{option.label}</span>
                      {option.informational ? (
                        <span className="block text-[10px] text-slate-400">{copy.product.informationalNote}</span>
                      ) : null}
                    </span>
                  </span>
                  {option.addonPriceCents !== null ? (
                    <span className="souq-price shrink-0 text-[12px] font-extrabold text-[var(--souq-primary)]">
                      +{formatSouqPrice(option.addonPriceCents, lang)}
                    </span>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>
      ) : group.displayType === "image" ? (
        <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {group.values.map((option) => {
            const isSelected = chosen.includes(option.value);
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => state.toggleValue(group, option.value)}
                  aria-pressed={isSelected}
                  disabled={disabled || option.disabled}
                  className={`w-full overflow-hidden rounded-[14px] border-2 p-1 transition ${
                    isSelected ? "border-[var(--souq-primary)]" : "border-[var(--souq-border)] hover:border-slate-300"
                  } ${option.disabled ? "cursor-not-allowed opacity-45" : ""}`}
                >
                  <span className="relative block aspect-square overflow-hidden rounded-[10px] bg-slate-100">
                    {option.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- option thumbnails
                      <img src={option.image} alt={option.label} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-slate-300">
                        <SouqIcon name="image" className="h-5 w-5" />
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-slate-700">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {group.values.map((option) => {
            const isSelected = chosen.includes(option.value);
            const isColor = group.displayType === "color_swatch" && option.color;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => state.toggleValue(group, option.value)}
                  aria-pressed={isSelected}
                  disabled={disabled || option.disabled}
                  title={option.label}
                  className={`souq-press flex items-center gap-2 rounded-[14px] border-2 px-3 py-2 text-[13px] font-bold transition ${
                    isSelected
                      ? "border-[var(--souq-primary)] bg-[var(--souq-primary-soft)] text-[var(--souq-primary)]"
                      : "border-[var(--souq-border)] bg-white text-slate-700 hover:border-slate-300"
                  } ${option.disabled ? "cursor-not-allowed opacity-45 line-through" : ""}`}
                >
                  {isColor ? (
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-slate-200"
                      style={{ backgroundColor: option.color as string }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="max-w-[130px] truncate">{option.label}</span>
                  {isSelected ? <SouqIcon name="check" className="h-3.5 w-3.5" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {group.help ? <p className="souq-help">{group.help}</p> : null}
      {!group.values.some((v) => !v.disabled) ? (
        <p className="souq-help text-[var(--souq-danger)]">{copy.product.notAvailable}</p>
      ) : null}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Quantity offers + stepper
// ---------------------------------------------------------------------------

export function SouqQuantityOffers({
  baseUnitCents,
  offers,
  productId,
  quantity,
  onChange,
  copy,
  lang,
  currency,
}: {
  baseUnitCents: number;
  offers: SouqPricingOffer[];
  productId: string;
  quantity: number;
  onChange: (quantity: number) => void;
  copy: SouqCopy;
  lang: StoreLanguage;
  currency: string;
}) {
  const cards = useMemo(
    () => buildQuantityOfferCards(baseUnitCents, offers, productId, copy.product.singleUnit),
    [baseUnitCents, offers, productId, copy.product.singleUnit],
  );
  if (cards.length <= 1) return null;

  return (
    <div>
      <span className="souq-label">{copy.product.quantityOffers}</span>
      <ul className="grid gap-2 sm:grid-cols-3">
        {cards.map((card) => {
          const isSelected = quantity === card.quantity;
          return (
            <li key={card.quantity}>
              <button
                type="button"
                onClick={() => onChange(card.quantity)}
                aria-pressed={isSelected}
                className={`relative flex h-full w-full flex-col items-start gap-1 rounded-[16px] border-2 p-3 text-start transition ${
                  isSelected
                    ? "border-[var(--souq-accent)] bg-[var(--souq-accent-soft)] shadow-[0_10px_24px_-18px_rgb(245_158_11_/_0.9)]"
                    : "border-[var(--souq-border)] bg-white hover:border-slate-300"
                }`}
              >
                {card.badge === "popular" ? (
                  <span className="absolute -top-2 end-3 rounded-full bg-[var(--souq-primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                    {copy.product.mostOrdered}
                  </span>
                ) : null}
                {card.badge === "special" ? (
                  <span className="absolute -top-2 end-3 rounded-full bg-[var(--souq-accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--souq-accent-text)]">
                    {copy.product.specialOffer}
                  </span>
                ) : null}
                {/* The merchant's own offer wording stays reachable as a tooltip;
                    the visible label is always the exact Arabic quantity word. */}
                <span className="text-[11px] font-bold text-slate-500" title={card.label ?? undefined}>
                  {card.quantity === 1
                    ? copy.product.singleUnit
                    : card.quantity === 2
                      ? copy.product.twoUnits
                      : souqFormat(copy.product.nUnits, { n: card.quantity })}
                </span>
                <span className="souq-price text-base font-extrabold text-[var(--souq-primary)]">
                  {formatSouqPrice(card.totalCents, lang, currency)}
                </span>
                {card.savingsCents > 0 ? (
                  <span className="text-[11px] font-bold text-emerald-600">
                    {copy.product.save} {formatSouqPrice(card.savingsCents, lang, currency)}
                  </span>
                ) : null}
                {isSelected ? (
                  <span className="absolute bottom-2 end-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--souq-accent)] text-[var(--souq-accent-text)]">
                    <SouqIcon name="check" className="h-3 w-3" />
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SouqQuantityStepper({
  value,
  onChange,
  copy,
  disabled = false,
  max = 50,
}: {
  value: number;
  onChange: (value: number) => void;
  copy: SouqCopy;
  disabled?: boolean;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="souq-label mb-0">{copy.checkout.quantityLabel}</span>
      <div className="flex items-center rounded-[14px] border border-[var(--souq-border)] bg-white">
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          aria-label={`${copy.checkout.quantityLabel} +`}
          className="souq-press flex h-10 w-10 items-center justify-center text-[var(--souq-primary)] disabled:opacity-40"
        >
          <SouqIcon name="plus" className="h-4 w-4" />
        </button>
        <span className="souq-price w-10 text-center text-sm font-extrabold" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={disabled || value <= 1}
          aria-label={`${copy.checkout.quantityLabel} -`}
          className="souq-press flex h-10 w-10 items-center justify-center text-[var(--souq-primary)] disabled:opacity-40"
        >
          <SouqIcon name="minus" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form view
// ---------------------------------------------------------------------------

export function SouqOrderFormView({
  data,
  form,
  formRef,
}: {
  data: SouqOrderFormData;
  form: ReturnType<typeof useSouqOrderState>;
  formRef: React.RefObject<HTMLFormElement | null>;
}) {
  const { copy, lang, settings, product, zones } = data;
  const { preview, fieldErrors, submitState } = form;
  const [communeValue, setCommuneValue] = useState("");
  const otherCommune = communeValue === "__other__";
  const communes = useMemo(() => (form.wilayaCode ? getCommunes(form.wilayaCode) : []), [form.wilayaCode]);

  const first = fieldSetting(settings, "first_name");
  const last = fieldSetting(settings, "last_name");
  const phone = fieldSetting(settings, "phone");
  const email = fieldSetting(settings, "email");
  const wilaya = fieldSetting(settings, "wilaya");
  const commune = fieldSetting(settings, "commune");
  const address = fieldSetting(settings, "address");
  const office = fieldSetting(settings, "office");

  const homeAvailable = settings.showDeliveryChoice;
  const officeAvailable = settings.showDeliveryChoice && data.officeDeliveryEnabled;
  const wilayaOptions = useMemo(() => WILAYAS.map((w) => ({ code: w.code, label: `${w.code} - ${wilayaLabel(w.code, w.name, lang)}` })), [lang]);

  if (submitState.status === "success") {
    return (
      <SouqOrderSuccess
        orderNumber={submitState.orderNumber}
        totalCents={submitState.totalCents}
        base={data.base}
        copy={copy}
        lang={lang}
        currency={data.currency}
        whatsapp={data.whatsapp}
      />
    );
  }

  const submitting = submitState.status === "loading";

  return (
    <section
      id={data.anchorId ?? "souq-order-form"}
      className={`souq-card overflow-hidden ${data.className ?? ""}`}
      aria-labelledby="souq-form-title"
      ref={formRef}
    >
      {/* Navy header band */}
      <header className="flex items-center justify-between gap-3 bg-[var(--souq-primary)] px-4 py-4 text-white sm:px-5">
        <div className="min-w-0">
          <h2 id="souq-form-title" className="text-lg font-extrabold sm:text-xl">
            {copy.checkout.formTitle}
          </h2>
          <p className="mt-1 text-[12px] text-white/75">{copy.checkout.formSubtitle}</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[var(--souq-accent)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--souq-accent-text)] sm:flex">
          <SouqIcon name="cash" className="h-4 w-4" />
          {copy.checkout.codNote}
        </span>
      </header>

      <form onSubmit={form.submit} noValidate className="space-y-5 p-4 sm:p-5">
        {submitState.status === "error" ? (
          <p role="alert" className="flex items-start gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-bold text-red-700">
            <SouqIcon name="close" className="mt-0.5 h-4 w-4 shrink-0" />
            {submitState.message}
          </p>
        ) : null}

        {/* Quantity offers */}
        {data.showQuantityOffers !== false && settings.showQuantityOffers ? (
          <SouqQuantityOffers
            baseUnitCents={form.variant?.price_cents ?? product.priceCents}
            offers={data.offers}
            productId={product.id}
            quantity={form.quantity}
            onChange={form.setQuantity}
            copy={copy}
            lang={lang}
            currency={data.currency}
          />
        ) : null}

        {/* Contact */}
        <div className="grid gap-4 sm:grid-cols-2">
          {first.enabled ? (
            <div data-field="firstName">
              <label className="souq-label" htmlFor="souq-first-name">
                {copy.checkout.firstName} {first.required ? <span className="text-[var(--souq-danger)]">*</span> : null}
              </label>
              <input
                id="souq-first-name"
                name="souq-first-name"
                className="souq-input"
                placeholder={copy.checkout.firstNamePlaceholder}
                autoComplete="given-name"
                maxLength={40}
                required={first.required}
                aria-invalid={Boolean(fieldErrors.firstName)}
                aria-describedby={fieldErrors.firstName ? "souq-first-name-error" : undefined}
              />
              {fieldErrors.firstName ? (
                <p id="souq-first-name-error" role="alert" className="souq-error">
                  {fieldErrors.firstName}
                </p>
              ) : null}
            </div>
          ) : null}

          {last.enabled ? (
            <div data-field="lastName">
              <label className="souq-label" htmlFor="souq-last-name">
                {copy.checkout.lastName} {last.required ? <span className="text-[var(--souq-danger)]">*</span> : null}
              </label>
              <input
                id="souq-last-name"
                name="souq-last-name"
                className="souq-input"
                placeholder={copy.checkout.lastNamePlaceholder}
                autoComplete="family-name"
                maxLength={40}
                required={last.required}
                aria-invalid={Boolean(fieldErrors.lastName)}
              />
              {fieldErrors.lastName ? (
                <p role="alert" className="souq-error">
                  {fieldErrors.lastName}
                </p>
              ) : null}
            </div>
          ) : null}

          {phone.enabled ? (
            <div data-field="phone">
              <label className="souq-label" htmlFor="souq-phone">
                {copy.checkout.phone} {phone.required ? <span className="text-[var(--souq-danger)]">*</span> : null}
              </label>
              <input
                id="souq-phone"
                name="souq-phone"
                className="souq-input souq-price"
                type="tel"
                inputMode="tel"
                dir="ltr"
                placeholder={copy.checkout.phonePlaceholder}
                autoComplete="tel"
                maxLength={20}
                required={phone.required}
                aria-invalid={Boolean(fieldErrors.phone)}
              />
              {fieldErrors.phone ? (
                <p role="alert" className="souq-error">
                  {fieldErrors.phone}
                </p>
              ) : (
                <p className="souq-help">{copy.checkout.phoneHint}</p>
              )}
            </div>
          ) : null}

          {email.enabled ? (
            <div data-field="email">
              <label className="souq-label" htmlFor="souq-email">
                {copy.checkout.emailOptional}
              </label>
              <input id="souq-email" name="souq-email" className="souq-input" type="email" dir="ltr" autoComplete="email" maxLength={120} />
            </div>
          ) : null}
        </div>

        {/* Delivery */}
        <div className="space-y-4">
          {settings.showDeliveryChoice && officeAvailable ? (
            <div data-field="delivery">
              <span className="souq-label">{copy.checkout.deliveryMethod}</span>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: "home" as const, icon: "truck" as const, title: copy.checkout.home, hint: copy.checkout.homeHint, enabled: homeAvailable },
                  { key: "office" as const, icon: "office" as const, title: copy.checkout.office, hint: copy.checkout.officeHint, enabled: officeAvailable },
                ].map((option) => {
                  const selected = form.deliveryType === option.key;
                  return (
                    // A single choice inside a form uses real radio inputs:
                    // native arrow-key navigation and screen-reader grouping.
                    <label
                      key={option.key}
                      className={`souq-press flex cursor-pointer flex-col items-start gap-1 rounded-[16px] border-2 p-3 text-start transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--souq-accent)] has-[:focus-visible]:ring-offset-2 ${
                        selected ? "border-[var(--souq-primary)] bg-[var(--souq-primary-soft)]" : "border-[var(--souq-border)] bg-white hover:border-slate-300"
                      } ${option.enabled ? "" : "cursor-not-allowed opacity-50"}`}
                    >
                      <input
                        type="radio"
                        name="souq-delivery"
                        value={option.key}
                        checked={selected}
                        disabled={!option.enabled}
                        onChange={() => form.setDeliveryType(option.key)}
                        className="sr-only"
                      />
                      <span className="flex items-center gap-2 text-[13px] font-extrabold text-slate-800">
                        <SouqIcon name={option.icon} className="h-4 w-4 text-[var(--souq-primary)]" />
                        {option.title}
                      </span>
                      <span className="text-[11px] leading-snug text-slate-500">{option.hint}</span>
                      {outOfRangeDelivery(option.key, zones, form.wilayaCode) ? (
                        <span className="text-[10px] font-bold text-amber-600">{copy.checkout.shippingPending}</span>
                      ) : form.wilayaCode ? (
                        <span className="souq-price text-[11px] font-bold text-[var(--souq-primary)]">
                          {deliveryFeeLabel(option.key, zones, form.wilayaCode, copy, lang)}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {wilaya.enabled ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div data-field="wilaya">
                <label className="souq-label" htmlFor="souq-wilaya">
                  {copy.checkout.wilaya} {wilaya.required ? <span className="text-[var(--souq-danger)]">*</span> : null}
                </label>
                <select
                  id="souq-wilaya"
                  name="souq-wilaya"
                  className="souq-input"
                  value={form.wilayaCode ?? ""}
                  required={wilaya.required}
                  aria-invalid={Boolean(fieldErrors.wilaya)}
                  onChange={(event) => {
                    const value = event.target.value;
                    form.setWilayaCode(value ? Number(value) : null);
                    setCommuneValue("");
                  }}
                >
                  <option value="">{copy.checkout.wilayaPlaceholder}</option>
                  {wilayaOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.wilaya ? (
                  <p role="alert" className="souq-error">
                    {fieldErrors.wilaya}
                  </p>
                ) : null}
              </div>

              {commune.enabled ? (
                <div data-field="commune">
                  <label className="souq-label" htmlFor="souq-commune">
                    {copy.checkout.commune} {commune.required ? <span className="text-[var(--souq-danger)]">*</span> : null}
                  </label>
                  <select
                    id="souq-commune"
                    name="souq-commune"
                    className="souq-input"
                    value={communeValue}
                    disabled={!form.wilayaCode || communes.length === 0}
                    required={commune.required && communes.length > 0}
                    aria-invalid={Boolean(fieldErrors.commune)}
                    onChange={(event) => setCommuneValue(event.target.value)}
                  >
                    <option value="">{copy.checkout.communePlaceholder}</option>
                    {communes.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    <option value="__other__">{copy.checkout.otherCommune}</option>
                  </select>
                  {otherCommune ? (
                    <input
                      name="souq-commune-other"
                      className="souq-input mt-2"
                      placeholder={copy.checkout.otherCommunePlaceholder}
                      maxLength={80}
                    />
                  ) : null}
                  {fieldErrors.commune ? (
                    <p role="alert" className="souq-error">
                      {fieldErrors.commune}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {form.deliveryType === "home" && address.enabled ? (
            <div data-field="address">
              <label className="souq-label" htmlFor="souq-address">
                {copy.checkout.address} {address.required ? <span className="text-[var(--souq-danger)]">*</span> : null}
              </label>
              <input
                id="souq-address"
                name="souq-address"
                className="souq-input"
                placeholder={copy.checkout.addressPlaceholder}
                autoComplete="street-address"
                maxLength={200}
                required={address.required}
                aria-invalid={Boolean(fieldErrors.address)}
              />
              {fieldErrors.address ? (
                <p role="alert" className="souq-error">
                  {fieldErrors.address}
                </p>
              ) : null}
            </div>
          ) : null}

          {form.deliveryType === "office" && office.enabled ? (
            <div data-field="office">
              <label className="souq-label" htmlFor="souq-office">
                {copy.checkout.officeName} {office.required ? <span className="text-[var(--souq-danger)]">*</span> : null}
              </label>
              <input
                id="souq-office"
                name="souq-office"
                className="souq-input"
                placeholder={copy.checkout.officePlaceholder}
                maxLength={120}
                required={office.required}
                aria-invalid={Boolean(fieldErrors.office)}
              />
              {fieldErrors.office ? (
                <p role="alert" className="souq-error">
                  {fieldErrors.office}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Quantity (when no bundle offer is selected) */}
        {settings.showQuantity ? <SouqQuantityStepper value={form.quantity} onChange={form.setQuantity} copy={copy} disabled={submitting} /> : null}

        {/* Dynamic option groups live in the form: they drive variant + price */}
        {data.showOptionPickers !== false && data.optionGroups.length > 0 ? (
          <div className="rounded-[16px] border border-[var(--souq-border)] bg-slate-50/60 p-3.5">
            <p className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-slate-700">
              <SouqIcon name="spark" className="h-4 w-4 text-[var(--souq-accent)]" />
              {copy.product.chooseOptions}
            </p>
            <SouqOptionPickers groups={data.optionGroups} state={form} copy={copy} lang={lang} disabled={submitting} />
            {fieldErrors.options ? (
              <p role="alert" className="souq-error mt-3">
                {fieldErrors.options}
              </p>
            ) : null}
            {!form.inStock ? (
              <p role="alert" className="mt-3 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-700">
                {copy.product.notAvailable}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Honeypot — humans never see it */}
        <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
          <label htmlFor="souq-website">Ne pas remplir</label>
          <input id="souq-website" name="souq-website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <SouqOrderSummary preview={preview} copy={copy} lang={lang} currency={data.currency} showInformational={data.optionGroups.length > 0} />

        {/* Out of stock: explained in Arabic, never a silent disabled button. */}
        {!form.inStock ? (
          <p role="alert" className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] font-bold text-amber-700">
            {copy.product.notAvailable}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !form.inStock}
          className="souq-press flex w-full items-center justify-center gap-2 rounded-[16px] bg-[var(--souq-accent)] px-5 py-4 text-base font-extrabold text-[var(--souq-accent-text)] shadow-[0_16px_30px_-18px_rgb(245_158_11_/_0.95)] transition hover:bg-[var(--souq-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              {copy.checkout.submitting}
            </>
          ) : !form.inStock ? (
            <>{copy.product.notAvailable}</>
          ) : (
            <>
              <SouqIcon name="check" className="h-5 w-5" />
              {copy.checkout.submit}
            </>
          )}
        </button>

        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500">
          <li className="flex items-center gap-1.5">
            <SouqIcon name="cash" className="h-4 w-4 text-[var(--souq-primary)]" />
            {copy.checkout.codNote}
          </li>
          <li className="flex items-center gap-1.5">
            <SouqIcon name="shield" className="h-4 w-4 text-[var(--souq-primary)]" />
            {copy.checkout.secureNote}
          </li>
          <li className="flex items-center gap-1.5">
            <SouqIcon name="truck" className="h-4 w-4 text-[var(--souq-primary)]" />
            {copy.promo.delivery}
          </li>
        </ul>
      </form>
    </section>
  );
}

/** Self-contained form (used on /commande and in standalone sections). */
export function SouqOrderForm(data: SouqOrderFormData) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const form = useSouqOrderState(data, formRef);
  return <SouqOrderFormView data={data} form={form} formRef={formRef} />;
}

// ---------------------------------------------------------------------------
// Summary + success
// ---------------------------------------------------------------------------

export function SouqOrderSummary({
  preview,
  copy,
  lang,
  currency,
  showInformational = false,
}: {
  preview: SouqOrderPreview;
  copy: SouqCopy;
  lang: StoreLanguage;
  currency: string;
  showInformational?: boolean;
}) {
  return (
    <div className="rounded-[16px] border border-[var(--souq-border)] bg-slate-50/70 p-3.5">
      <p className="mb-3 text-[13px] font-extrabold text-slate-700">{copy.checkout.summary}</p>
      <ul className="space-y-2.5">
        {preview.lines.map((line, index) => (
          <li key={`${line.productId}-${line.variantId ?? index}`} className="flex items-start justify-between gap-3 text-[13px]">
            <span className="min-w-0">
              <span className="block truncate font-bold text-slate-800">{line.label}</span>
              <span className="block text-[11px] text-slate-500">
                {line.variantLabel ? `${line.variantLabel} • ` : ""}
                {line.quantity} × {formatSouqPrice(line.unitPriceCents, lang, currency)}
              </span>
              {line.offerLabel ? <span className="block text-[11px] font-bold text-emerald-600">{line.offerLabel}</span> : null}
            </span>
            <span className="souq-price shrink-0 font-extrabold text-[var(--souq-primary)]">
              {formatSouqPrice(line.lineTotalCents, lang, currency)}
            </span>
          </li>
        ))}
      </ul>

      {showInformational && preview.informational.length > 0 ? (
        <p className="mt-3 rounded-[12px] bg-white px-3 py-2 text-[11px] text-slate-500">
          {copy.product.informationalNote}: {preview.informational.map((item) => item.value).join(" • ")}
        </p>
      ) : null}

      <dl className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-[13px]">
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">{copy.checkout.products}</dt>
          <dd className="souq-price font-bold text-slate-800">{formatSouqPrice(preview.subtotalCents, lang, currency)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">{copy.checkout.shipping}</dt>
          <dd className="souq-price font-bold text-slate-800">
            {!preview.shippingKnown
              ? copy.checkout.shippingPending
              : preview.shippingFeeCents === 0
                ? copy.checkout.shippingFree
                : formatSouqPrice(preview.shippingFeeCents ?? 0, lang, currency)}
          </dd>
        </div>
        {preview.discountCents > 0 ? (
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">{copy.checkout.discount}</dt>
            <dd className="souq-price font-bold text-emerald-600">-{formatSouqPrice(preview.discountCents, lang, currency)}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
          <dt className="font-extrabold text-slate-800">{copy.checkout.total}</dt>
          <dd className="souq-price text-lg font-extrabold text-[var(--souq-primary)]">
            {formatSouqPrice(preview.totalCents, lang, currency)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[10px] text-slate-400">{copy.checkout.trustNote}</p>
    </div>
  );
}

export function SouqOrderSuccess({
  orderNumber,
  totalCents,
  base,
  copy,
  lang,
  currency,
  whatsapp,
}: {
  orderNumber: string;
  totalCents: number;
  base: string;
  copy: SouqCopy;
  lang: StoreLanguage;
  currency: string;
  whatsapp: string | null;
}) {
  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null;
  return (
    <section className="souq-card souq-anim-up overflow-hidden text-center" aria-live="polite">
      <div className="bg-emerald-50 px-4 py-8">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
          <SouqIcon name="check" className="h-8 w-8" />
        </span>
        <h2 className="mt-4 text-xl font-extrabold text-emerald-900 sm:text-2xl">{copy.success.title}</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] text-emerald-800/80">{copy.success.subtitle}</p>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{copy.success.orderNumber}</p>
          <p className="souq-price mt-1 text-xl font-extrabold text-slate-900" dir="ltr">
            {orderNumber}
          </p>
        </div>
        <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{copy.success.total}</p>
          <p className="souq-price mt-1 text-xl font-extrabold text-[var(--souq-primary)]">{formatSouqPrice(totalCents, lang, currency)}</p>
        </div>
      </div>
      <div className="px-4 pb-5 sm:px-5">
        <p className="text-[12px] text-slate-500">{copy.success.callNote}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href={`${base}/boutique`}
            className="souq-press inline-flex items-center justify-center gap-2 rounded-[14px] bg-[var(--souq-primary)] px-5 py-3 text-sm font-extrabold text-white"
          >
            <SouqIcon name="grid" className="h-4 w-4" />
            {copy.success.backToShop}
          </a>
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="souq-press inline-flex items-center justify-center gap-2 rounded-[14px] border border-emerald-200 px-5 py-3 text-sm font-extrabold text-emerald-700"
            >
              <SouqIcon name="whatsapp" className="h-4 w-4" />
              {copy.success.whatsapp}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Small display helpers
// ---------------------------------------------------------------------------

function outOfRangeDelivery(type: "home" | "office", zones: SouqShippingZone[], wilayaCode: number | null): boolean {
  if (!wilayaCode) return false;
  const zone = zones.find((z) => z.wilaya_code === wilayaCode && z.is_active) ?? zones.find((z) => z.wilaya_code === 0 && z.is_active);
  if (!zone) return true;
  return (type === "home" ? zone.home_fee_cents : zone.office_fee_cents) === null;
}

function deliveryFeeLabel(
  type: "home" | "office",
  zones: SouqShippingZone[],
  wilayaCode: number,
  copy: SouqCopy,
  lang: StoreLanguage,
): string {
  const zone = zones.find((z) => z.wilaya_code === wilayaCode && z.is_active) ?? zones.find((z) => z.wilaya_code === 0 && z.is_active);
  if (!zone) return copy.checkout.shippingPending;
  const fee = type === "home" ? zone.home_fee_cents : zone.office_fee_cents;
  if (fee === null) return copy.checkout.shippingPending;
  return fee === 0 ? copy.checkout.shippingFree : formatSouqPrice(fee, lang);
}

/** Small helper used by product cards in the SOUQ product view. */
export function SouqRating({ value, count, copy }: { value: number | null; count: number; copy: SouqCopy }) {
  if (value === null) return null;
  return (
    <div className="flex items-center gap-2">
      <SouqStars value={value} count={count} />
      <span className="text-[11px] font-semibold text-slate-400">{copy.product.reviews}</span>
    </div>
  );
}

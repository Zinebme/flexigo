/**
 * Arabic names of the 58 Algerian wilayas (additive, read-only helper).
 *
 * The shared `lib/algeria/wilayas.ts` list stays untouched (French names, used
 * by the dashboard, the legacy checkout and shipping providers). SOUQ, which is
 * Arabic-first, resolves the Arabic label here and falls back to the French
 * name when a code is unknown — never to an empty string.
 */
export const WILAYA_NAMES_AR: Record<number, string> = {
  1: "أدرار",
  2: "الشلف",
  3: "الأغواط",
  4: "أم البواقي",
  5: "باتنة",
  6: "بجاية",
  7: "بسكرة",
  8: "بشار",
  9: "البليدة",
  10: "البويرة",
  11: "تمنراست",
  12: "تبسة",
  13: "تلمسان",
  14: "تيارت",
  15: "تيزي وزو",
  16: "الجزائر",
  17: "الجلفة",
  18: "جيجل",
  19: "سطيف",
  20: "سعيدة",
  21: "سكيكدة",
  22: "سيدي بلعباس",
  23: "عنابة",
  24: "قالمة",
  25: "قسنطينة",
  26: "المدية",
  27: "مستغانم",
  28: "المسيلة",
  29: "معسكر",
  30: "ورقلة",
  31: "وهران",
  32: "البيض",
  33: "إليزي",
  34: "برج بوعريريج",
  35: "بومرداس",
  36: "الطارف",
  37: "تندوف",
  38: "تيسمسيلت",
  39: "الوادي",
  40: "خنشلة",
  41: "سوق أهراس",
  42: "تيبازة",
  43: "ميلة",
  44: "عين الدفلى",
  45: "النعامة",
  46: "عين تموشنت",
  47: "غرداية",
  48: "غليزان",
  49: "تيميمون",
  50: "برج باجي مختار",
  51: "أولاد جلال",
  52: "بني عباس",
  53: "عين صالح",
  54: "عين قزام",
  55: "تقرت",
  56: "جانت",
  57: "المغير",
  58: "المنيعة",
};

/** Localized wilaya label with a guaranteed non-empty fallback. */
export function wilayaLabel(code: number, name: string, lang?: string | null): string {
  if (lang === "ar" || lang === undefined || lang === null) {
    const ar = WILAYA_NAMES_AR[code];
    if (ar) return ar;
  }
  return name;
}

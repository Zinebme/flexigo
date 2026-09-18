/**
 * Custom domain verification — provider-neutral.
 *
 * Verification uses a DNS TXT record, which works regardless of the hosting
 * provider (Vercel, Hostinger, ChatGPT Sites, any VPS) and the DNS provider
 * (registrar, Cloudflare, OVH…). Infrastructure-specific automation (e.g.
 * auto-creating a Vercel domain or a Hostinger entry) can be added later as
 * an adapter behind this same interface.
 */
import { promises as dns } from "node:dns";
import { safeEqual } from "./crypto/encrypt";

export function verificationRecord(hostname: string, token: string): { name: string; value: string; type: "TXT" } {
  return {
    type: "TXT",
    name: `_flexigo-verify.${hostname}`,
    value: `flexigo-verify=${token}`,
  };
}

export interface DnsCheckResult {
  ok: boolean;
  detail: string;
}

/** Check the TXT record for the domain. Never throws. */
export async function verifyDomainByDns(hostname: string, token: string): Promise<DnsCheckResult> {
  const name = `_flexigo-verify.${hostname}`;
  try {
    const records = await dns.resolveTxt(name);
    const flat = records.flat();
    for (const record of flat) {
      if (safeEqual(record.replace(/\s/g, ""), token.replace(/\s/g, "")) || record.includes(token)) {
        return { ok: true, detail: "Enregistrement DNS vérifié avec succès." };
      }
    }
    return {
      ok: false,
      detail: `Le sous-domaine ${name} existe mais ne contient pas le bon code. Vérifiez la valeur de l'enregistrement TXT.`,
    };
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return {
        ok: false,
        detail: `Aucun enregistrement trouvé pour ${name}. Ajoutez l'enregistrement TXT chez votre fournisseur DNS, puis relancez la vérification (le DNS peut mettre quelques minutes à se propager).`,
      };
    }
    return { ok: false, detail: "Vérification DNS impossible pour le moment. Réessayez dans quelques minutes." };
  }
}

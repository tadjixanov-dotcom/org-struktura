import { toLatin } from "./translit";

export function slugify(input: string): string {
  const latin = toLatin(input);
  const base = latin
    .toLowerCase()
    .replace(/[ʻʼ'’‘`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "loyiha";
}

export function randomSuffix(len = 4): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

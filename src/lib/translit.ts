/**
 * O'zbek lotin <-> kirill transliteratsiyasi.
 * Matn qaysi yozuvda kiritilganidan qat'i nazar, ikkala yozuvda ham ko'rsatish uchun.
 */

export type Script = "latn" | "cyrl";

/* ---------- Lotin -> Kirill ---------- */

// Uzunroq birikmalar birinchi tekshiriladi.
const L2C_DIGRAPHS: [string, string][] = [
  ["o'", "ў"], ["oʻ", "ў"], ["o‘", "ў"], ["ō", "ў"],
  ["g'", "ғ"], ["gʻ", "ғ"], ["g‘", "ғ"], ["ḡ", "ғ"],
  ["sh", "ш"], ["ch", "ч"], ["ts", "ц"],
  ["yo", "ё"], ["yu", "ю"], ["ya", "я"], ["ye", "е"],
];

const L2C_SINGLE: Record<string, string> = {
  a: "а", b: "б", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и",
  j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ",
  r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з",
  c: "к", w: "в",
};

const APOSTROPHES = "'ʻ‘’`ʼ";
const LATIN_VOWELS = "aeiou";

function matchCase(source: string, converted: string): string {
  if (source.length === 0) return converted;
  const isUpper = source[0] === source[0].toUpperCase() && source[0] !== source[0].toLowerCase();
  if (!isUpper) return converted;
  const allUpper =
    source.length > 1 && source === source.toUpperCase() && /[A-Za-zʻ']/.test(source);
  return allUpper ? converted.toUpperCase() : converted[0].toUpperCase() + converted.slice(1);
}

/** Lotin yozuvida qoladigan qisqartmalar va xalqaro atamalar. */
const KEEP_LATIN = new Set([
  "PDF", "PNG", "JPG", "JPEG", "SVG", "CSV", "XLS", "XLSX", "DOC", "DOCX",
  "KPI", "CRM", "ERP", "SMM", "SEO", "HR", "IT", "API", "URL", "SMS", "QR",
  "CEO", "CTO", "CFO", "COO", "OKR", "ROI", "B2B", "B2C", "VIP", "ID",
  "HTTP", "HTTPS", "WWW", "EMAIL", "E-MAIL", "OK", "SQL", "AI",
  "ECTS", "HEMIS", "GPA", "NIU", "QUANTUM", "1C", "ADESK",
]);

const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'ʻʼ‘’`-]*/gu;

export function toCyrillic(input: string): string {
  if (!input) return input;
  return input.replace(WORD_RE, (word) =>
    KEEP_LATIN.has(word.toUpperCase()) ? word : cyrillicWord(word)
  );
}

function cyrillicWord(s: string): string {
  let out = "";
  let i = 0;

  while (i < s.length) {
    const rest = s.slice(i);
    const lower = rest.toLowerCase();
    let matched = false;

    // 1) Ikki harfli birikmalar
    for (const [lat, cyr] of L2C_DIGRAPHS) {
      if (lower.startsWith(lat)) {
        const src = s.slice(i, i + lat.length);
        out += matchCase(src, cyr);
        i += lat.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = s[i];
    const low = ch.toLowerCase();

    // 2) Tutuq belgisi -> ъ
    if (APOSTROPHES.includes(ch)) {
      out += "ъ";
      i += 1;
      continue;
    }

    // 3) So'z boshidagi "e" -> "э"
    if (low === "e") {
      const prev = i === 0 ? "" : s[i - 1];
      const atWordStart = i === 0 || !/[\p{L}\p{N}]/u.test(prev);
      out += matchCase(ch, atWordStart ? "э" : "е");
      i += 1;
      continue;
    }

    // 4) Unlidan keyingi "y" ko'pincha "й" bo'lib qoladi — standart jadval yetarli
    const mapped = L2C_SINGLE[low];
    if (mapped) {
      out += matchCase(ch, mapped);
      i += 1;
      continue;
    }

    out += ch;
    i += 1;
  }
  return out;
}

/* ---------- Kirill -> Lotin ---------- */

const C2L: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ғ: "gʻ", д: "d", е: "e", ё: "yo",
  ж: "j", з: "z", и: "i", й: "y", к: "k", қ: "q", л: "l", м: "m",
  н: "n", о: "o", ў: "oʻ", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "x", ҳ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh",
  ъ: "ʼ", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
};

export function toLatin(input: string): string {
  if (!input) return input;
  return input.replace(WORD_RE, (word) => latinWord(word));
}

function latinWord(s: string): string {
  // "БОШҚАРУВ" kabi bosh harfli so'zlar lotinda ham bosh harfda qolsin
  const allUpper = s.length > 1 && s === s.toUpperCase() && s !== s.toLowerCase();
  let out = "";

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const low = ch.toLowerCase();
    const mapped = C2L[low];
    if (mapped === undefined) {
      out += ch;
      continue;
    }
    if (mapped === "") continue;

    // So'z boshidagi va unlidan keyingi "е" -> "ye"
    let value = mapped;
    if (low === "е") {
      const prev = i === 0 ? "" : s[i - 1];
      const atWordStart = i === 0;
      const afterVowel = /[аеёиоуўэюяы]/i.test(prev || "");
      value = atWordStart || afterVowel ? "ye" : "e";
    }

    out += allUpper ? value.toUpperCase() : matchCase(ch, value);
  }
  return out;
}

/* ---------- Aniqlash va universal konvertor ---------- */

const CYRILLIC_RE = /[Ѐ-ӿ]/;

export function detectScript(text: string): Script {
  return CYRILLIC_RE.test(text) ? "cyrl" : "latn";
}

/** Matnni tanlangan yozuvga o'giradi (kirish yozuvini o'zi aniqlaydi). */
export function convert(text: string | null | undefined, script: Script): string {
  if (!text) return "";
  const source = detectScript(text);
  if (source === script) return text;
  return script === "cyrl" ? toCyrillic(text) : toLatin(text);
}

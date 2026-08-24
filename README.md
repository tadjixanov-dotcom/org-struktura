# Org Struktura

Korxonalar uchun tashkiliy tuzilma (org chart) konstruktori. Lavozimlarni sichqoncha bilan sudrab tuzasiz, har bir lavozim uchun **nima ish qilishi**, **nimaga javob berishi**, **qanday vakolatga ega ekani** va **qaysi koʻrsatkich bilan baholanishini** yozasiz, natijani havola orqali ulashasiz yoki PDF qilib eksport qilasiz.

## Imkoniyatlar

- **Drag & drop konstruktor** — kartochkani boshqa kartochka ustiga tashlasangiz, oʻsha rahbarga boʻysunadi. Halqa (cycle) hosil boʻlishi serverda bloklanadi.
- **Avto joylashuv** — dagre algoritmi bilan butun tuzilmani bir tugmada tartibga soladi.
- **Alohida loyihalar** — har bir korxona/filial uchun mustaqil loyiha, oʻz havolasi bilan.
- **Batafsil lavozim tavsifi** — vazifalar, javobgarlik, vakolatlar, KPI, talablar, aloqa maʼlumotlari.
- **Lotin ⇄ kirill** — matn bir marta kiritiladi, sahifa ikkala yozuvda koʻrsatiladi (avtomatik transliteratsiya).
- **PDF / PNG eksport** — sxema A4/A3 PDF yoki PNG; alohida "toʻliq hisobot" sahifasi har bir lavozim tavsifi bilan chop etiladi.
- **Yopiq admin panel** — login/parol, JWT sessiya (httpOnly cookie), bcrypt hash.
- **Ochiq havola** — koʻrish uchun login shart emas (har bir loyiha uchun yoqib/oʻchirib qoʻyiladi).
- Apple uslubidagi dizayn: system shrift, shisha (glass) qatlamlar, spring animatsiyalar, yorugʻ/qorongʻi mavzu, `prefers-reduced-motion` qoʻllab-quvvatlanadi.

## Texnologiyalar

| Qatlam | Yechim |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Uslub | Tailwind CSS v4 + CSS oʻzgaruvchilari |
| Sxema | @xyflow/react (React Flow 12) + @dagrejs/dagre |
| Baza | PostgreSQL (`pg`), sxema ilova ishga tushganda avtomatik yaratiladi |
| Avtorizatsiya | `jose` (JWT) + `bcryptjs` |
| Eksport | `html-to-image` + `jspdf`, hamda chop etishga moslangan sahifa |

## Lokalda ishga tushirish

```bash
npm install
cp .env.example .env.local   # DATABASE_URL va AUTH_SECRET ni toʻldiring
npm run dev
```

`http://localhost:3000` ochiladi. Admin panel: `/admin`.

## Muhit oʻzgaruvchilari

| Nomi | Majburiy | Izoh |
| --- | --- | --- |
| `DATABASE_URL` | ha | PostgreSQL ulanish satri. Railway'da Postgres qoʻshilsa avtomatik ulanadi. |
| `AUTH_SECRET` | ha | JWT imzolash kaliti, kamida 32 belgi. |
| `ADMIN_USERNAME` | yoʻq | Birinchi ishga tushganda yaratiladigan admin logini (default: `admin`). |
| `ADMIN_PASSWORD` | yoʻq | Oʻsha adminning boshlangʻich paroli. Keyin admin panelda oʻzgartiriladi. |

Administrator faqat **baza boʻsh boʻlganda** bir marta yaratiladi. Keyingi oʻzgarishlar admin panelning "Sozlamalar" boʻlimida.

## Ma'lumotlar sxemasi

- `admins` — administratorlar (username, bcrypt hash).
- `projects` — loyihalar (slug, nom, korxona, rang, ochiq/yopiq).
- `nodes` — lavozimlar: `parent_id` orqali ierarxiya, `duties` / `responsibilities` / `authorities` / `kpis` / `requirements` — `jsonb` massivlar, `x`/`y` — sxemadagi joylashuv.

Sxema `src/lib/db.ts` ichida `CREATE TABLE IF NOT EXISTS` orqali idempotent tarzda yaratiladi — alohida migratsiya buyrugʻi shart emas.

## Marshrutlar

| Yoʻl | Tavsif |
| --- | --- |
| `/` | Bosh sahifa, ochiq loyihalar roʻyxati |
| `/s/<slug>` | Tuzilmani koʻrish (ochiq havola) |
| `/s/<slug>/print` | Toʻliq hisobot, chop etish / PDF |
| `/admin/login` | Kirish |
| `/admin` | Loyihalar boshqaruvi |
| `/admin/p/<id>` | Drag & drop konstruktor |

## Deploy (Railway)

```bash
railway up
```

Postgres servisini qoʻshib, `AUTH_SECRET` va boshlangʻich admin maʼlumotlarini oʻzgaruvchilarga yozish kifoya — sxema birinchi soʻrovda avtomatik yaratiladi.

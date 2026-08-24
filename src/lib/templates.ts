/**
 * Tayyor namunaviy tuzilmalar. Loyiha yaratilayotganda tanlanadi.
 * Har bir lavozim uchun: vazifalari, javobgarligi, vakolatlari va baholash mezonlari.
 */

export type TemplateNode = {
  key: string;
  parent: string | null;
  title: string;
  personName?: string;
  department?: string;
  summary?: string;
  duties?: string[];
  responsibilities?: string[];
  authorities?: string[];
  kpis?: string[];
  requirements?: string[];
};

export type Template = {
  id: string;
  name: string;
  description: string;
  nodes: TemplateNode[];
};

const DIREKTOR: TemplateNode = {
  key: "dir",
  parent: null,
  title: "Direktor",
  department: "Rahbariyat",
  summary:
    "Korxonaning yagona ijroiya organi. Strategiyani belgilaydi, resurslarni taqsimlaydi va yakuniy natija uchun muassislar oldida javob beradi.",
  duties: [
    "Korxonaning yillik va uzoq muddatli strategiyasini ishlab chiqish hamda tasdiqlash",
    "Yillik byudjetni tasdiqlash va uning ijrosini nazorat qilish",
    "Tashkiliy tuzilmani belgilash, oʻrinbosarlar va boʻlim rahbarlarini tayinlash",
    "Yirik shartnomalar va investitsiya qarorlarini imzolash",
    "Har oylik boshqaruv kengashini oʻtkazish va asosiy koʻrsatkichlarni koʻrib chiqish",
    "Davlat organlari, hamkorlar va investorlar bilan korxona nomidan muzokara olib borish",
  ],
  responsibilities: [
    "Korxonaning moliyaviy natijasi — foyda, aylanma, likvidlik",
    "Qonunchilikka va litsenziya talablariga toʻliq rioya qilinishi",
    "Korxona mulki va aktivlarining butligi",
    "Jamoaning barqarorligi va korporativ madaniyat",
  ],
  authorities: [
    "Ishonchnomasiz korxona nomidan ish yuritish",
    "Xodimlarni ishga qabul qilish va ishdan boʻshatish",
    "Byudjetdan tashqari xarajatlarni tasdiqlash",
    "Har qanday buyruq va nizomni imzolash",
  ],
  kpis: [
    "Sof foyda rejasining bajarilishi (%)",
    "Aylanma oʻsishi (yillik %)",
    "Xodimlar oqimi (turnover) darajasi",
    "Strategik loyihalarning muddatida yakunlanishi",
  ],
  requirements: [
    "Oliy maʼlumot (iqtisodiyot, menejment yoki soha boʻyicha)",
    "Rahbarlik lavozimida kamida 5 yil tajriba",
    "Moliyaviy hisobot va byudjetlashtirishni bilish",
  ],
};

const UNIVERSAL: TemplateNode[] = [
  DIREKTOR,
  {
    key: "dir-ass",
    parent: "dir",
    title: "Direktor yordamchisi",
    department: "Rahbariyat",
    summary: "Direktorning ish kunini tashkil qiladi va topshiriqlar ijrosini kuzatadi.",
    duties: [
      "Direktor kun tartibini va uchrashuvlar jadvalini yuritish",
      "Kiruvchi va chiquvchi hujjatlar aylanishini taʼminlash",
      "Yigʻilish bayonlarini yuritish va topshiriqlar ijrosini nazorat qilish",
      "Mehmonlar va hamkorlarni kutib olishni tashkil qilish",
    ],
    responsibilities: [
      "Hujjatlarning oʻz vaqtida imzolanishi va roʻyxatga olinishi",
      "Topshiriqlar ijro muddatlarining nazorati",
      "Xizmat maʼlumotlarining maxfiyligi",
    ],
    authorities: ["Boʻlimlardan hisobot va maʼlumot soʻrash", "Yigʻilishlar jadvalini belgilash"],
    kpis: ["Muddatida bajarilgan topshiriqlar ulushi (%)", "Hujjat aylanishidagi kechikishlar soni"],
  },
  {
    key: "moliya",
    parent: "dir",
    title: "Moliya direktori",
    department: "Moliya",
    summary: "Korxonaning pul oqimi, byudjeti va moliyaviy barqarorligini boshqaradi.",
    duties: [
      "Yillik va oylik byudjetni tuzish, tasdiqlashga taqdim etish",
      "Pul oqimini (cash flow) rejalashtirish va boshqarish",
      "Moliyaviy hisobotlarni tayyorlash va tahlil qilish",
      "Xarajatlarni optimallashtirish choralarini ishlab chiqish",
      "Banklar va soliq organlari bilan ishlash",
    ],
    responsibilities: [
      "Byudjet intizomi va xarajatlarning maqsadliligi",
      "Moliyaviy hisobotning ishonchliligi va oʻz vaqtida topshirilishi",
      "Toʻlov qobiliyatining saqlanishi",
    ],
    authorities: [
      "Byudjet doirasidagi toʻlovlarni tasdiqlash",
      "Boʻlimlardan moliyaviy asoslash talab qilish",
      "Xarajat limitlarini belgilash",
    ],
    kpis: ["Byudjetdan ogʻish (%)", "Debitorlik qarzi aylanishi (kun)", "Hisobotlarning muddatida topshirilishi"],
  },
  {
    key: "buxgalter",
    parent: "moliya",
    title: "Bosh buxgalter",
    department: "Moliya",
    summary: "Buxgalteriya hisobini yuritadi va soliq hisobotlarini topshiradi.",
    duties: [
      "Buxgalteriya hisobini qonunchilikka muvofiq yuritish",
      "Soliq va statistika hisobotlarini tayyorlab topshirish",
      "Ish haqi hisob-kitobini amalga oshirish",
      "Inventarizatsiyani tashkil qilish",
    ],
    responsibilities: [
      "Hisobotlarning aniqligi va muddatliligi",
      "Soliq jarimalarining oldini olish",
      "Birlamchi hujjatlarning toʻgʻri rasmiylashtirilishi",
    ],
    authorities: ["Notoʻgʻri rasmiylashtirilgan hujjatni qabul qilmaslik", "Moddiy javobgarlardan hisobot talab qilish"],
    kpis: ["Soliq jarimalari summasi", "Hisobot muddatlarining buzilishi soni"],
  },
  {
    key: "operatsiya",
    parent: "dir",
    title: "Ishlab chiqarish boʻyicha direktor oʻrinbosari",
    department: "Ishlab chiqarish",
    summary: "Asosiy jarayonlarni tashkil qiladi va mahsulot/xizmat sifatini taʼminlaydi.",
    duties: [
      "Ishlab chiqarish rejasini tuzish va bajarilishini taʼminlash",
      "Texnologik jarayonlarni takomillashtirish",
      "Xomashyo va materiallarga boʻlgan ehtiyojni rejalashtirish",
      "Uskunalar texnik holatini nazorat qilish",
      "Mehnat muhofazasi qoidalariga rioya qilinishini taʼminlash",
    ],
    responsibilities: [
      "Ishlab chiqarish rejasining bajarilishi",
      "Mahsulot sifati va brak darajasi",
      "Ish joyidagi xavfsizlik",
    ],
    authorities: [
      "Ishlab chiqarish jadvalini oʻzgartirish",
      "Sifatsiz partiyani toʻxtatish",
      "Smena tarkibini belgilash",
    ],
    kpis: ["Reja bajarilishi (%)", "Brak ulushi (%)", "Uskunalar toʻxtab qolish vaqti (soat)"],
  },
  {
    key: "sifat",
    parent: "operatsiya",
    title: "Sifat nazorati boʻlimi boshligʻi",
    department: "Ishlab chiqarish",
    summary: "Kiruvchi xomashyo va tayyor mahsulot sifatini tekshiradi.",
    duties: [
      "Kiruvchi nazoratni tashkil qilish",
      "Tayyor mahsulotni standartlarga muvofiqligini tekshirish",
      "Nomuvofiqliklar boʻyicha dalolatnoma rasmiylashtirish",
      "Sifat boʻyicha ichki auditlarni oʻtkazish",
    ],
    responsibilities: ["Sifatsiz mahsulotning bozorga chiqmasligi", "Sinov natijalarining ishonchliligi"],
    authorities: ["Partiyani joʻnatishni toʻxtatish", "Qayta ishlashga yuborish toʻgʻrisida qaror qabul qilish"],
    kpis: ["Mijoz shikoyatlari soni", "Qaytarilgan mahsulot ulushi (%)"],
  },
  {
    key: "savdo",
    parent: "dir",
    title: "Savdo boʻyicha direktor oʻrinbosari",
    department: "Savdo va marketing",
    summary: "Sotuv rejasini bajaradi, mijozlar bazasini kengaytiradi.",
    duties: [
      "Yillik va oylik sotuv rejasini tuzish",
      "Savdo menejerlari ishini tashkil qilish va oʻqitish",
      "Narx siyosati va chegirmalar tizimini ishlab chiqish",
      "Yirik mijozlar bilan shartnomalar tuzish",
      "Bozor va raqobatchilarni tahlil qilish",
    ],
    responsibilities: [
      "Sotuv rejasining bajarilishi",
      "Debitorlik qarzining nazorati",
      "Mijozlar bazasining saqlanishi va oʻsishi",
    ],
    authorities: [
      "Belgilangan doirada chegirma berish",
      "Savdo menejerlariga hududlarni taqsimlash",
      "Mijoz bilan shartnoma shartlarini kelishish",
    ],
    kpis: ["Sotuv rejasi bajarilishi (%)", "Yangi mijozlar soni", "Oʻrtacha chek", "Muddati oʻtgan debitorlik (%)"],
  },
  {
    key: "marketing",
    parent: "savdo",
    title: "Marketing boʻlimi boshligʻi",
    department: "Savdo va marketing",
    summary: "Brendni rivojlantiradi va murojaatlar oqimini taʼminlaydi.",
    duties: [
      "Marketing strategiyasi va yillik reja tuzish",
      "Reklama kampaniyalarini tashkil qilish va samaradorligini oʻlchash",
      "Ijtimoiy tarmoqlar va veb-saytni yuritish",
      "Bozor tadqiqotlarini oʻtkazish",
    ],
    responsibilities: ["Marketing byudjetining samarali sarflanishi", "Brend obroʻsi", "Murojaatlar rejasining bajarilishi"],
    authorities: ["Reklama kanallarini tanlash", "Kontent va dizaynni tasdiqlash"],
    kpis: ["Murojaat (lead) soni", "Bir murojaat narxi (CPL)", "Konversiya (%)"],
  },
  {
    key: "menejer",
    parent: "savdo",
    title: "Savdo menejeri",
    department: "Savdo va marketing",
    summary: "Mijozlar bilan bevosita ishlaydi va bitimlarni yakunlaydi.",
    duties: [
      "Kiruvchi va chiquvchi murojaatlar bilan ishlash",
      "Tijorat taklifini tayyorlash va taqdim etish",
      "Shartnoma rasmiylashtirish va yuk joʻnatishni muvofiqlashtirish",
      "CRM tizimini toʻliq va oʻz vaqtida yuritish",
    ],
    responsibilities: ["Shaxsiy sotuv rejasi", "Oʻz mijozlari boʻyicha qarzdorlik", "CRM maʼlumotlarining toʻliqligi"],
    authorities: ["Standart chegirma doirasida kelishuv", "Mijozga toʻlov jadvalini taklif qilish"],
    kpis: ["Shaxsiy reja bajarilishi (%)", "Faol mijozlar soni", "Murojaatdan bitimga konversiya (%)"],
  },
  {
    key: "hr",
    parent: "dir",
    title: "Kadrlar boʻlimi boshligʻi",
    department: "HR",
    summary: "Xodimlarni tanlash, moslashtirish va rivojlantirish jarayonini boshqaradi.",
    duties: [
      "Kadrlarga boʻlgan ehtiyojni rejalashtirish va tanlovni tashkil qilish",
      "Kadrlar hujjatlarini yuritish (buyruq, mehnat shartnomasi, tabel)",
      "Yangi xodimlarni moslashtirish dasturini oʻtkazish",
      "Oʻqitish va malaka oshirishni tashkil qilish",
      "Lavozim yoʻriqnomalarini ishlab chiqish va yangilash",
    ],
    responsibilities: [
      "Kadrlar hujjatlarining qonunchilikka muvofiqligi",
      "Vakansiyalarning oʻz vaqtida yopilishi",
      "Xodimlar oqimini kamaytirish",
    ],
    authorities: ["Nomzodlarni saralash va suhbatga taklif qilish", "Intizomiy tekshiruv tashabbusi bilan chiqish"],
    kpis: ["Vakansiyani yopish muddati (kun)", "Sinov muddatidan oʻtganlar ulushi (%)", "Xodimlar oqimi (%)"],
  },
  {
    key: "it",
    parent: "dir",
    title: "IT boʻlimi boshligʻi",
    department: "IT",
    summary: "Axborot tizimlari, tarmoq va maʼlumotlar xavfsizligini taʼminlaydi.",
    duties: [
      "Axborot tizimlari va serverlarning uzluksiz ishlashini taʼminlash",
      "Zaxira nusxalash (backup) tartibini yuritish",
      "Foydalanuvchilarga texnik yordam koʻrsatish",
      "Yangi dasturiy yechimlarni joriy etish",
    ],
    responsibilities: ["Tizimlarning ishlash barqarorligi", "Maʼlumotlar xavfsizligi va maxfiyligi", "Litsenziyalarning amal qilishi"],
    authorities: ["Kirish huquqlarini belgilash", "Xavfli qurilma yoki dasturni bloklash"],
    kpis: ["Tizim ishlash vaqti — uptime (%)", "Soʻrovga javob berish vaqti", "Muvaffaqiyatli backup ulushi (%)"],
  },
  {
    key: "yurist",
    parent: "dir",
    title: "Yuriskonsult",
    department: "Yuridik",
    summary: "Korxona faoliyatining huquqiy jihatlarini taʼminlaydi.",
    duties: [
      "Shartnomalarni ishlab chiqish va huquqiy ekspertizadan oʻtkazish",
      "Korxona manfaatlarini sudlarda himoya qilish",
      "Ichki hujjatlarni qonunchilikka moslashtirish",
      "Litsenziya va ruxsatnomalarni rasmiylashtirish",
    ],
    responsibilities: ["Shartnomalardagi huquqiy risklar", "Sud ishlarining natijasi", "Meʼyoriy hujjatlarga muvofiqlik"],
    authorities: ["Shartnomani imzolashga qarshi xulosa berish", "Boʻlimlardan tushuntirish talab qilish"],
    kpis: ["Yutilgan sud ishlari ulushi (%)", "Huquqiy ekspertiza muddati (kun)"],
  },
];

const KICHIK: TemplateNode[] = [
  { ...DIREKTOR, title: "Direktor / Asoschi" },
  {
    key: "operator",
    parent: "dir",
    title: "Operatsion menejer",
    department: "Boshqaruv",
    summary: "Kundalik jarayonlarni boshqaradi va jamoaning ishini muvofiqlashtiradi.",
    duties: [
      "Kundalik vazifalarni taqsimlash va ijrosini nazorat qilish",
      "Yetkazib beruvchilar bilan ishlash",
      "Ichki jarayonlarni hujjatlashtirish",
    ],
    responsibilities: ["Jarayonlarning uzluksizligi", "Muddatlarning bajarilishi"],
    authorities: ["Vazifalarni qayta taqsimlash", "Kichik xarajatlarni tasdiqlash"],
    kpis: ["Muddatida bajarilgan vazifalar (%)"],
  },
  {
    key: "sales",
    parent: "operator",
    title: "Savdo menejeri",
    department: "Savdo",
    summary: "Mijozlarni jalb qiladi va bitimlarni yakunlaydi.",
    duties: ["Mijozlar bilan muzokara", "Tijorat taklifi tayyorlash", "CRM yuritish"],
    responsibilities: ["Shaxsiy sotuv rejasi"],
    authorities: ["Standart chegirma doirasida kelishuv"],
    kpis: ["Sotuv rejasi bajarilishi (%)"],
  },
  {
    key: "smm",
    parent: "operator",
    title: "Marketolog (SMM)",
    department: "Marketing",
    summary: "Ijtimoiy tarmoqlarda brendni yuritadi va murojaat oqimini taʼminlaydi.",
    duties: ["Kontent reja tuzish", "Reklama kampaniyalarini yuritish", "Natijalarni tahlil qilish"],
    responsibilities: ["Murojaatlar rejasi", "Brend obroʻsi"],
    authorities: ["Reklama byudjetini kanallar boʻyicha taqsimlash"],
    kpis: ["Murojaat soni", "Bir murojaat narxi"],
  },
  {
    key: "buh",
    parent: "dir",
    title: "Buxgalter",
    department: "Moliya",
    summary: "Hisob-kitob va hisobotlarni yuritadi.",
    duties: ["Birlamchi hujjatlarni yuritish", "Soliq hisobotlarini topshirish", "Ish haqi hisobi"],
    responsibilities: ["Hisobotlarning aniqligi va muddatliligi"],
    authorities: ["Notoʻgʻri hujjatni qabul qilmaslik"],
    kpis: ["Jarimalar summasi"],
  },
];

const FAQAT_DIREKTOR: TemplateNode[] = [DIREKTOR];

export const TEMPLATES: Template[] = [
  {
    id: "universal",
    name: "Universal korxona",
    description:
      "Direktor, moliya, ishlab chiqarish, savdo, HR, IT va yuridik yoʻnalishlar — 12 ta lavozim toʻliq tavsif bilan.",
    nodes: UNIVERSAL,
  },
  {
    id: "kichik",
    name: "Kichik jamoa",
    description: "Asoschi, operatsion menejer, savdo, marketing va buxgalteriya — 5 ta lavozim.",
    nodes: KICHIK,
  },
  {
    id: "bosh",
    name: "Faqat direktor",
    description: "Bitta lavozimdan boshlab tuzilmani oʻzingiz quring.",
    nodes: FAQAT_DIREKTOR,
  },
  { id: "empty", name: "Boʻsh loyiha", description: "Hech qanday lavozimsiz boshlash.", nodes: [] },
];

export function getTemplate(id: string | null | undefined): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

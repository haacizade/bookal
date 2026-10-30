import { cookies } from "next/headers";

export type Locale = "az" | "en";

const az = {
  brand: "Bookal",
  panelTitle: "Oxuyub bitirdiyin kitabın yeni oxucusunu tap.",
  panelText: "Dərsliklər və kitablar semestrdən semestrə əldən-ələ keçir.",
  login: {
    title: "Hesabına daxil ol", sub: "Elanlarını, istək siyahını və tarixçəni idarə et.",
    email: "E-poçt", password: "Şifrə", submit: "Daxil ol",
    noAccount: "Hesabın yoxdur?", register: "Qeydiyyatdan keç",
    verifiedBanner: "E-poçtun təsdiqləndi. İndi daxil ola bilərsən.",
  },
  register: {
    title: "Hesab yarat", sub: "Bir neçə saniyəyə hazırdır. Sonra e-poçtunu təsdiqləyəcəksən.",
    name: "Ad Soyad", university: "Universitet / Şəhər", universityPh: "Məs: AZTU, Bakı",
    phone: "Telefon (könüllü)", passwordHint: "Ən azı 8 simvol, hərf və rəqəm ilə.",
    submit: "Qeydiyyatdan keç", haveAccount: "Artıq hesabın var?", login: "Daxil ol",
  },
  checkEmail: {
    title: "E-poçtunu yoxla",
    body: "Təsdiq linkini {email} ünvanına göndərdik. Link 24 saat etibarlıdır.",
    spam: "Məktub gəlməyibsə, spam qovluğuna bax.",
    resend: "Linki yenidən göndər", resendWait: "{s} san. sonra yenidən göndər",
    resendOk: "Bu ünvanla təsdiq gözləyən hesab varsa, yeni link göndərildi.",
    wrongEmail: "Ünvan səhvdir? Yenidən qeydiyyatdan keç",
  },
  verify: {
    pending: "E-poçt təsdiqlənir…",
    okTitle: "E-poçt təsdiqləndi", okBody: "Hesabın aktivdir.", okCta: "Daxil ol",
    failTitle: "Link etibarsızdır",
    failBody: "Linkin vaxtı bitib və ya artıq istifadə olunub. Daxil olmağa çalış, yeni link göndərərik.",
    failCta: "Daxil ol səhifəsinə keç",
  },
  errors: {
    INVALID_CREDENTIALS: "E-poçt və ya şifrə yanlışdır.",
    EMAIL_NOT_VERIFIED: "E-poçtun hələ təsdiqlənməyib. Gələn qutunu yoxla və ya yeni link göndər.",
    VALIDATION: "Xanaları yoxlayıb yenidən cəhd et.",
    UNAUTHENTICATED: "Bu əməliyyat üçün hesabına daxil olmalısan.",
    NOT_FOUND: "Axtardığın məlumat tapılmadı.",
    FORBIDDEN: "Bu əməliyyatı etməyə icazən yoxdur.",
    OWN_LISTING: "Öz elanına sorğu göndərə bilməzsən.",
    LISTING_UNAVAILABLE: "Bu elan artıq əlçatan deyil.",
    ALREADY_REQUESTED: "Bu kitab üçün artıq sorğun var.",
    NOT_PENDING: "Bu sövdələşmə artıq bağlanıb və ya ləğv edilib.",
    NOT_COMPLETED: "Rəy yalnız tamamlanmış sövdələşmədən sonra yazıla bilər.",
    ALREADY_REVIEWED: "Bu sövdələşmə üçün artıq rəy yazmısan.",
    GENERIC: "Xəta baş verdi. Bir az sonra yenidən cəhd et.",
  },
  fields: {
    name: "Ad ən azı 2 simvol olmalıdır.",
    email: "Düzgün e-poçt ünvanı daxil et.",
    password: "Şifrə ən azı 8 simvol olmalı, hərf və rəqəm içərməlidir.",
    phone: "Telefon nömrəsinin formatı yanlışdır.",
    university: "Ən çox 120 simvol.",
    title: "Kitabın adını yaz (2–150 simvol).",
    author: "Müəllifin adını yaz (2–120 simvol).",
    description: "Ən çox 2000 simvol.",
    language: "Dil seç.",
    condition: "Vəziyyət seç.",
    type: "Elanın növünü seç.",
    genreId: "Janr seç.",
    subjectId: "Fənn düzgün deyil.",
    price: "Qiyməti yaz (0–9999.99). Pulsuz üçün 0 yaz.",
    coverUrl: "Şəkil linki https ilə başlamalıdır.",
    rating: "1-dən 5-ə qədər qiymət seç.",
    comment: "Rəy ən çox 1000 simvol ola bilər.",
  },
};

export type Copy = typeof az;

const en: Copy = {
  brand: "Bookal",
  panelTitle: "Find the next reader for the books you've finished.",
  panelText: "Textbooks and novels passing from hand to hand, semester after semester.",
  login: {
    title: "Log in", sub: "Manage your listings, wishlist and history.",
    email: "Email", password: "Password", submit: "Log in",
    noAccount: "No account yet?", register: "Sign up",
    verifiedBanner: "Your email is verified. You can log in now.",
  },
  register: {
    title: "Create an account", sub: "Takes a few seconds. You'll confirm your email next.",
    name: "Full name", university: "University / City", universityPh: "e.g. AZTU, Baku",
    phone: "Phone (optional)", passwordHint: "At least 8 characters, with letters and digits.",
    submit: "Sign up", haveAccount: "Already have an account?", login: "Log in",
  },
  checkEmail: {
    title: "Check your email",
    body: "We sent a confirmation link to {email}. It's valid for 24 hours.",
    spam: "Can't find it? Look in your spam folder.",
    resend: "Resend the link", resendWait: "Resend in {s}s",
    resendOk: "If an account is waiting for confirmation at this address, a new link was sent.",
    wrongEmail: "Wrong address? Sign up again",
  },
  verify: {
    pending: "Confirming your email…",
    okTitle: "Email confirmed", okBody: "Your account is active.", okCta: "Log in",
    failTitle: "This link isn't valid",
    failBody: "It has expired or was already used. Try logging in and we'll send a new one.",
    failCta: "Go to log in",
  },
  errors: {
    INVALID_CREDENTIALS: "Email or password is incorrect.",
    EMAIL_NOT_VERIFIED: "Your email isn't confirmed yet. Check your inbox or request a new link.",
    VALIDATION: "Check the highlighted fields and try again.",
    UNAUTHENTICATED: "You need to log in to do this.",
    NOT_FOUND: "We couldn't find that.",
    FORBIDDEN: "You're not allowed to do this.",
    OWN_LISTING: "You can't request your own listing.",
    LISTING_UNAVAILABLE: "This listing is no longer available.",
    ALREADY_REQUESTED: "You've already requested this book.",
    NOT_PENDING: "This deal is already closed or cancelled.",
    NOT_COMPLETED: "You can only review a completed deal.",
    ALREADY_REVIEWED: "You've already reviewed this deal.",
    GENERIC: "Something went wrong. Try again in a moment.",
  },
  fields: {
    name: "Name must be at least 2 characters.",
    email: "Enter a valid email address.",
    password: "Password needs 8+ characters with letters and digits.",
    phone: "That phone number doesn't look right.",
    university: "At most 120 characters.",
    title: "Enter the book's title (2–150 characters).",
    author: "Enter the author's name (2–120 characters).",
    description: "At most 2000 characters.",
    language: "Choose a language.",
    condition: "Choose a condition.",
    type: "Choose a listing type.",
    genreId: "Choose a genre.",
    subjectId: "That subject isn't valid.",
    price: "Enter a price (0–9999.99). Use 0 for free.",
    coverUrl: "The image link must start with https.",
    rating: "Choose a rating from 1 to 5.",
    comment: "A review can be at most 1000 characters.",
  },
};

const dict: Record<Locale, Copy> = { az, en };

/** Reads the `lang` cookie (same key idea as the current site); defaults to Azerbaijani. */
export async function getCopy() {
  const lang = (await cookies()).get("lang")?.value;
  return dict[lang === "en" ? "en" : "az"];
}

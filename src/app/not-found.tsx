import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-6 text-center">
      <div className="rise">
        <p className="t-display" style={{ color: "var(--text)" }}>
          404
        </p>
        <p className="t-heading mt-2" style={{ color: "var(--text)" }}>
          Sahifa topilmadi
        </p>
        <p className="t-caption mx-auto mt-3 max-w-sm">
          Havola notoʻgʻri boʻlishi yoki struktura yopiq boʻlishi mumkin.
        </p>
        <Link href="/" className="btn btn-primary mt-7">
          Bosh sahifaga
        </Link>
      </div>
    </div>
  );
}

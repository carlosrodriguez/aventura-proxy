"use client";

export function LanguageSelect({ locale }: { locale: "en" | "es" }) {
  return (
    <select
      className="header-language"
      aria-label={locale === "es" ? "Idioma" : "Language"}
      value={locale}
      onChange={(event) => {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", event.target.value);
        window.location.assign(url.toString());
      }}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  );
}

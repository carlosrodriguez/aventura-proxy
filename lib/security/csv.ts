export function csvCell(value: unknown) {
  const s = String(value ?? "");
  return (
    '"' + (/^[=+@\-\t\r\n]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"'
  );
}

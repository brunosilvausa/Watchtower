export function csvContent(rows: Record<string, unknown>[], columns = Object.keys(rows[0] ?? {})): string {
  const cell = (value: unknown) => { const text = String(value ?? ""); return `"${(/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`; };
  return [columns.map(cell).join(","), ...rows.map(row => columns.map(key => cell(row[key])).join(","))].join("\r\n");
}
export function downloadCsv(filename: string, rows: Record<string, unknown>[], columns?: string[]) {
  const url = URL.createObjectURL(new Blob([csvContent(rows, columns)], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

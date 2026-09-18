/** Minimal CSV export (proper escaping) for data export tools. */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCsv(rows: Array<Record<string, unknown>>, columns: Array<{ key: string; label: string }>): string {
  const header = columns.map((c) => escapeCell(c.label)).join(";");
  const lines = rows.map((row) => columns.map((c) => escapeCell(row[c.key])).join(";"));
  return [header, ...lines].join("\n");
}

export function csvResponse(csv: string, filename: string): Response {
  // BOM for Excel compatibility with French accents
  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

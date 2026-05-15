export function peso(value: number) {
  return `PHP ${Number(value || 0).toFixed(0)}`;
}

export function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function extractDeadline(text: string) {
  const iso = text.match(/\b20\d{2}-\d{2}-\d{2}\b/);
  if (iso) return iso[0];

  const monthDate = text.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,\s*20\d{2})?\b/i);
  return monthDate?.[0] ?? "";
}

export function titleFromText(text: string) {
  return text.trim().split(/[.\n]/)[0].slice(0, 80) || "Untitled task";
}

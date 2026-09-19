/** Routes the header book search without flashing a 404 while an id is still being typed. */

const COMPLETE_RECORD_ID = /^(inv|dsp)_[a-z0-9]{4,}$/i;
const SAFE_RECORD_ID = /^(inv|dsp)_[a-z0-9]+$/i;

export function invoiceListHref(options?: { q?: string; status?: string | null }): string {
  const params = new URLSearchParams();
  const status = options?.status?.trim();
  const q = options?.q?.trim();
  if (status && status !== "ALL") params.set("status", status);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/invoices?${query}` : "/invoices";
}

export function bookSearchHref(
  query: string,
  options: {
    submitted?: boolean;
    invoiceStatus?: string | null;
    allowEmpty?: boolean;
  } = {},
): string | null {
  const trimmed = query.trim();
  const { submitted = false, invoiceStatus = null, allowEmpty = false } = options;

  if (!trimmed) {
    return allowEmpty ? invoiceListHref({ status: invoiceStatus }) : null;
  }

  const jumpToRecord = COMPLETE_RECORD_ID.test(trimmed) || (submitted && SAFE_RECORD_ID.test(trimmed));
  if (jumpToRecord) {
    return /^dsp_/i.test(trimmed) ? `/disputes/${trimmed}` : `/invoices/${trimmed}`;
  }

  return invoiceListHref({ q: trimmed, status: invoiceStatus });
}

import { describe, expect, it } from "vitest";
import { bookSearchHref, invoiceListHref } from "@/lib/book-search";

describe("bookSearchHref", () => {
  it("keeps customer text on the invoice list", () => {
    expect(bookSearchHref("Acme")).toBe("/invoices?q=Acme");
    expect(bookSearchHref("Riverstone")).toBe("/invoices?q=Riverstone");
  });

  it("does not deep-link an incomplete record id while typing", () => {
    expect(bookSearchHref("inv_")).toBe("/invoices?q=inv_");
    expect(bookSearchHref("inv_1")).toBe("/invoices?q=inv_1");
    expect(bookSearchHref("dsp_10")).toBe("/invoices?q=dsp_10");
  });

  it("opens a complete record id without waiting for Enter", () => {
    expect(bookSearchHref("inv_1043")).toBe("/invoices/inv_1043");
    expect(bookSearchHref("dsp_1043")).toBe("/disputes/dsp_1043");
    expect(bookSearchHref("INV_1043")).toBe("/invoices/INV_1043");
  });

  it("lets Enter jump a short but well-formed id", () => {
    expect(bookSearchHref("inv_1", { submitted: true })).toBe("/invoices/inv_1");
    expect(bookSearchHref("dsp_9", { submitted: true })).toBe("/disputes/dsp_9");
  });

  it("treats unsafe or invoice-number queries as list search", () => {
    expect(bookSearchHref("INV-1043")).toBe("/invoices?q=INV-1043");
    expect(bookSearchHref("inv_1043/<script>", { submitted: true })).toBe(
      "/invoices?q=inv_1043%2F%3Cscript%3E",
    );
    expect(bookSearchHref("javascript:alert(1)")).toBe("/invoices?q=javascript%3Aalert%281%29");
  });

  it("preserves an invoice status filter", () => {
    expect(bookSearchHref("Acme", { invoiceStatus: "OVERDUE" })).toBe(
      "/invoices?status=OVERDUE&q=Acme",
    );
    expect(bookSearchHref("", { allowEmpty: true, invoiceStatus: "OPEN" })).toBe(
      "/invoices?status=OPEN",
    );
  });

  it("does not navigate on an empty live query unless asked", () => {
    expect(bookSearchHref("")).toBeNull();
    expect(bookSearchHref("   ")).toBeNull();
    expect(bookSearchHref("", { allowEmpty: true })).toBe("/invoices");
    expect(bookSearchHref("", { submitted: true, allowEmpty: true })).toBe("/invoices");
  });
});

describe("invoiceListHref", () => {
  it("omits empty filters", () => {
    expect(invoiceListHref()).toBe("/invoices");
    expect(invoiceListHref({ status: "ALL", q: "  " })).toBe("/invoices");
  });
});

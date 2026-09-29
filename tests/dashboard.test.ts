import { describe, expect, it } from "vitest";
import { catalogMrrCents, percentChange, revenueDisputePoints } from "@/lib/dashboard";

describe("catalogMrrCents", () => {
  it("sums only catalog plan prices", () => {
    expect(
      catalogMrrCents([{ plan: "STARTER" }, { plan: "GROWTH" }, { plan: "SCALE" }]),
    ).toBe(4900 + 9900 + 24900);
  });
});

describe("percentChange", () => {
  it("returns null when the prior period is empty and current is not", () => {
    expect(percentChange(9900, 0)).toBeNull();
  });

  it("computes a real lift without inventing a baseline", () => {
    expect(percentChange(19800, 9900)).toBe(100);
  });
});

describe("revenueDisputePoints", () => {
  it("sums billed revenue and dispute amounts per customer, skipping drafts and voids", () => {
    expect(
      revenueDisputePoints([
        {
          customerId: "a",
          customerName: "Cobalt Goods",
          status: "OVERDUE",
          totalCents: 24900,
          disputes: [{ disputedAmountCents: 40000 }],
        },
        {
          customerId: "a",
          customerName: "Cobalt Goods",
          status: "VOID",
          totalCents: 24900,
          disputes: [],
        },
        {
          customerId: "b",
          customerName: "Oakiron Supply",
          status: "DRAFT",
          totalCents: 4900,
          disputes: [],
        },
        {
          customerId: "c",
          customerName: "Brightwell Labs",
          status: "PAID",
          totalCents: 9900,
          disputes: [],
        },
        {
          customerId: "c",
          customerName: "Brightwell Labs",
          status: "PAID",
          totalCents: 9900,
          disputes: [{ disputedAmountCents: 9900 }],
        },
      ]),
    ).toEqual([
      { id: "c", name: "Brightwell Labs", revenueCents: 19800, disputeCents: 9900 },
      { id: "a", name: "Cobalt Goods", revenueCents: 24900, disputeCents: 40000 },
    ]);
  });
});

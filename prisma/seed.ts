import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { demoDay } from "../lib/clock";
import { suggestDisputeCredit } from "../lib/dispute-credit";
import { planPriceCents } from "../lib/plans";

const prisma = new PrismaClient({
  adapter: new PrismaLibSQL({
    url: `file:${join(__dirname, "dev.db")}`,
  }),
});

/**
 * Collections 4.2 corpus accounts (workshop/data/canon.json). Seeding them as
 * live customers is what lets /analysis link corpus CUST-* references to real
 * Ledgerly rows. Deterministic: same ids and rows on every reseed.
 */
type CanonAccount = {
  customerId: string;
  invoiceId: string;
  invoiceNumber: string;
  name: string;
  segment: string;
  plan: "STARTER" | "GROWTH" | "SCALE";
  contactName: string;
  email: string;
};

const canon = JSON.parse(
  readFileSync(join(__dirname, "../workshop/data/canon.json"), "utf8"),
) as { accounts: Record<string, CanonAccount> };

const CANON_ACCOUNTS = Object.entries(canon.accounts);

/** Invoice shape for the corpus accounts: issued Aug 1, due Aug 31 — OPEN on
 * the frozen clock — except three planted states that give the collections
 * views something to chew on without touching the original demo beats. */
function canonInvoiceState(index: number) {
  if (index === 2 || index === 8) {
    // Alder BioSystems, Blue Harbor Bank — overdue from the July cycle.
    return { status: "OVERDUE", issuedOn: "2026-07-05", dueOn: "2026-08-04" };
  }
  if (index % 3 === 0) {
    return { status: "PAID", issuedOn: "2026-07-20", dueOn: "2026-08-19", paidOn: "2026-08-17" };
  }
  return { status: "OPEN", issuedOn: "2026-08-01", dueOn: "2026-08-31" };
}

type SeedCustomer = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  plan: "STARTER" | "GROWTH" | "SCALE";
};

const CUSTOMERS: SeedCustomer[] = [
  {
    id: "cus_harborline",
    name: "Acme North",
    contactName: "Jordan Hale",
    email: "billing@acmenorth.example",
    plan: "GROWTH",
  },
  {
    id: "cus_cedarwell",
    name: "Riverstone Labs",
    contactName: "Remy Sato",
    email: "hello@riverstone.example",
    plan: "STARTER",
  },
  {
    id: "cus_quarrypine",
    name: "Cobalt Goods",
    contactName: "Ellis Marlow",
    email: "accounts@cobaltgoods.example",
    plan: "SCALE",
  },
  {
    id: "cus_brightwell",
    name: "Brightwell Labs",
    contactName: "Priya Nader",
    email: "ops@brightwell.example",
    plan: "GROWTH",
  },
  {
    id: "cus_oakiron",
    name: "Oakiron Supply",
    contactName: "Chris Bellamy",
    email: "billing@oakiron.example",
    plan: "STARTER",
  },
  {
    id: "cus_fieldnote",
    name: "Fieldnote Press",
    contactName: "Sam Ortez",
    email: "ledger@fieldnote.example",
    plan: "SCALE",
  },
  {
    id: "cus_silverpine",
    name: "Silverpine Outfitters",
    contactName: "Noor Voss",
    email: "pay@silverpine.example",
    plan: "GROWTH",
  },
  {
    id: "cus_mapleember",
    name: "Maple & Ember Co",
    contactName: "Dana Ruiz",
    email: "hello@mapleember.example",
    plan: "STARTER",
  },
  {
    id: "cus_tidewatch",
    name: "Tidewatch Logistics",
    contactName: "Keir Anand",
    email: "billing@tidewatch.example",
    plan: "SCALE",
  },
  {
    id: "cus_copperleaf",
    name: "Copperleaf Atelier",
    contactName: "Lila Shore",
    email: "studio@copperleaf.example",
    plan: "GROWTH",
  },
];

const INVOICES = [
  {
    id: "inv_1041",
    number: "INV-1041",
    customerId: "cus_harborline",
    plan: "GROWTH" as const,
    status: "OPEN",
    issuedOn: "2026-08-07",
    dueOn: "2026-09-06",
    memo: "Monthly Growth seat for Acme North.",
  },
  {
    id: "inv_1042",
    number: "INV-1042",
    customerId: "cus_cedarwell",
    plan: "STARTER" as const,
    status: "PAID",
    issuedOn: "2026-07-08",
    dueOn: "2026-08-07",
    paidOn: "2026-08-04",
    memo: "Starter plan — July cycle.",
  },
  {
    id: "inv_1043",
    number: "INV-1043",
    customerId: "cus_quarrypine",
    plan: "SCALE" as const,
    status: "OVERDUE",
    issuedOn: "2026-07-10",
    dueOn: "2026-08-09",
    memo: "Scale plan. Customer opened a plan-mismatch dispute.",
    collectionNote: "",
  },
  {
    id: "inv_1044",
    number: "INV-1044",
    customerId: "cus_brightwell",
    plan: "GROWTH" as const,
    status: "PAID",
    issuedOn: "2026-07-12",
    dueOn: "2026-08-11",
    paidOn: "2026-08-09",
    memo: "Growth plan — July cycle.",
  },
  {
    id: "inv_1045",
    number: "INV-1045",
    customerId: "cus_oakiron",
    plan: "STARTER" as const,
    status: "OPEN",
    issuedOn: "2026-08-02",
    dueOn: "2026-09-01",
    memo: "Starter plan for Oakiron Supply.",
  },
  {
    id: "inv_1046",
    number: "INV-1046",
    customerId: "cus_fieldnote",
    plan: "SCALE" as const,
    status: "PAID",
    issuedOn: "2026-07-14",
    dueOn: "2026-08-13",
    paidOn: "2026-08-12",
    memo: "Scale plan — July cycle.",
  },
  {
    id: "inv_1047",
    number: "INV-1047",
    customerId: "cus_silverpine",
    plan: "GROWTH" as const,
    status: "OVERDUE",
    issuedOn: "2026-07-13",
    dueOn: "2026-08-12",
    memo: "Growth plan. Duplicate-charge dispute is open.",
  },
  {
    id: "inv_1048",
    number: "INV-1048",
    customerId: "cus_mapleember",
    plan: "STARTER" as const,
    status: "DRAFT",
    issuedOn: "2026-08-22",
    dueOn: "2026-09-21",
    memo: "Draft — waiting on a purchase order number.",
  },
  {
    id: "inv_1049",
    number: "INV-1049",
    customerId: "cus_tidewatch",
    plan: "SCALE" as const,
    status: "OPEN",
    issuedOn: "2026-08-13",
    dueOn: "2026-09-12",
    memo: "Scale plan. Service-window dispute needs review.",
  },
  {
    id: "inv_1050",
    number: "INV-1050",
    customerId: "cus_copperleaf",
    plan: "GROWTH" as const,
    status: "PAID",
    issuedOn: "2026-06-16",
    dueOn: "2026-07-16",
    paidOn: "2026-07-18",
    memo: "Growth plan. Historical dispute was accepted.",
  },
  {
    id: "inv_1051",
    number: "INV-1051",
    customerId: "cus_harborline",
    plan: "STARTER" as const,
    status: "VOID",
    issuedOn: "2026-06-07",
    dueOn: "2026-07-07",
    memo: "Voided — upgraded to Growth the same week.",
  },
  {
    id: "inv_1053",
    number: "INV-1053",
    customerId: "cus_harborline",
    plan: "GROWTH" as const,
    status: "PAID",
    issuedOn: "2026-07-07",
    dueOn: "2026-08-06",
    paidOn: "2026-07-28",
    memo: "Growth plan — prior cycle for Acme North.",
  },
  {
    id: "inv_1054",
    number: "INV-1054",
    customerId: "cus_cedarwell",
    plan: "STARTER" as const,
    status: "PAID",
    issuedOn: "2026-07-01",
    dueOn: "2026-07-31",
    paidOn: "2026-07-25",
    memo: "Starter plan — July cycle for Riverstone Labs.",
  },
  {
    id: "inv_1055",
    number: "INV-1055",
    customerId: "cus_tidewatch",
    plan: "SCALE" as const,
    status: "PAID",
    issuedOn: "2026-07-18",
    dueOn: "2026-08-17",
    paidOn: "2026-08-15",
    memo: "Scale plan — paid mid-August.",
  },
  {
    id: "inv_1056",
    number: "INV-1056",
    customerId: "cus_harborline",
    plan: "GROWTH" as const,
    status: "PAID",
    issuedOn: "2026-06-07",
    dueOn: "2026-07-07",
    paidOn: "2026-07-02",
    memo: "Growth plan — June cycle for Acme North.",
  },
  {
    id: "inv_1057",
    number: "INV-1057",
    customerId: "cus_brightwell",
    plan: "GROWTH" as const,
    status: "PAID",
    issuedOn: "2026-08-10",
    dueOn: "2026-09-09",
    paidOn: "2026-08-18",
    memo: "Growth plan — August cycle, paid early.",
  },
  {
    id: "inv_1052",
    number: "INV-1052",
    customerId: "cus_cedarwell",
    plan: "GROWTH" as const,
    status: "OPEN",
    issuedOn: "2026-08-01",
    dueOn: "2026-08-30",
    memo: "Mid-cycle upgrade from Starter to Growth.",
  },
];

const DISPUTES = [
  {
    // Claims more than the invoice charges, so the uncapped suggestion in
    // lib/dispute-credit.ts is visible on the dispute page, not only in tests.
    id: "dsp_1043",
    invoiceId: "inv_1043",
    status: "NEEDS_REVIEW",
    reason:
      "Billed on Scale. The signed order is Growth. Customer is claiming back more than this invoice charges.",
    openedOn: "2026-08-11",
    disputedAmountCents: 40000,
  },
  {
    id: "dsp_1047",
    invoiceId: "inv_1047",
    status: "OPEN",
    reason: "Duplicate charge for the same service period.",
    openedOn: "2026-08-14",
    disputedAmountCents: 9900,
  },
  {
    id: "dsp_1049",
    invoiceId: "inv_1049",
    status: "NEEDS_REVIEW",
    reason: "Service window has not started. Asking to hold the invoice.",
    openedOn: "2026-08-18",
    disputedAmountCents: 24900,
  },
  {
    id: "dsp_1041",
    invoiceId: "inv_1041",
    status: "OPEN",
    reason: "Tax-exempt certificate is on file. Please confirm the line.",
    openedOn: "2026-08-19",
    disputedAmountCents: 9900,
  },
  {
    id: "dsp_1050",
    invoiceId: "inv_1050",
    status: "ACCEPTED",
    reason: "Wrong plan last cycle. Credit issued at the Growth price.",
    openedOn: "2026-07-02",
    disputedAmountCents: 9900,
    reviewerNote: "Accepted. Credit equals the Growth catalog price of $99.",
  },
];

async function main() {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
  });

  await prisma.dispute.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.workspace.deleteMany();

  await prisma.workspace.create({
    data: {
      id: "ws_fieldnote",
      name: "Fieldnote Workspace",
      slug: "fieldnote",
      createdAt: demoDay("2025-11-04"),
    },
  });

  for (const customer of CUSTOMERS) {
    await prisma.customer.create({
      data: {
        ...customer,
        workspaceId: "ws_fieldnote",
        createdAt: demoDay("2026-01-15"),
      },
    });
  }

  for (const invoice of INVOICES) {
    const totalCents = planPriceCents(invoice.plan);
    await prisma.invoice.create({
      data: {
        id: invoice.id,
        number: invoice.number,
        workspaceId: "ws_fieldnote",
        customerId: invoice.customerId,
        plan: invoice.plan,
        status: invoice.status,
        issuedOn: demoDay(invoice.issuedOn),
        dueOn: demoDay(invoice.dueOn),
        paidOn: invoice.paidOn ? demoDay(invoice.paidOn) : null,
        subtotalCents: totalCents,
        taxCents: 0,
        totalCents,
        memo: invoice.memo,
        collectionNote: invoice.collectionNote ?? null,
        lines: {
          create: [
            {
              id: `line_${invoice.id}`,
              description: `${invoice.plan.charAt(0)}${invoice.plan.slice(1).toLowerCase()} plan · monthly`,
              quantity: 1,
              unitPriceCents: totalCents,
              amountCents: totalCents,
            },
          ],
        },
      },
    });
  }

  for (const dispute of DISPUTES) {
    const invoice = INVOICES.find((row) => row.id === dispute.invoiceId);
    if (!invoice) {
      throw new Error(`Seed dispute ${dispute.id} points at a missing invoice.`);
    }
    await prisma.dispute.create({
      data: {
        id: dispute.id,
        invoiceId: dispute.invoiceId,
        workspaceId: "ws_fieldnote",
        status: dispute.status,
        reason: dispute.reason,
        openedOn: demoDay(dispute.openedOn),
        disputedAmountCents: dispute.disputedAmountCents,
        suggestedCreditCents: suggestDisputeCredit({
          disputedAmountCents: dispute.disputedAmountCents,
          planPriceCents: planPriceCents(invoice.plan),
        }),
        reviewerNote: dispute.reviewerNote ?? null,
      },
    });
  }

  // Collections 4.2 corpus accounts — one customer + one invoice each.
  for (const [index, [, account]] of CANON_ACCOUNTS.entries()) {
    await prisma.customer.create({
      data: {
        id: account.customerId,
        workspaceId: "ws_fieldnote",
        name: account.name,
        contactName: account.contactName,
        email: account.email,
        plan: account.plan,
        createdAt: demoDay("2026-02-02"),
      },
    });
    const state = canonInvoiceState(index);
    const totalCents = planPriceCents(account.plan);
    await prisma.invoice.create({
      data: {
        id: account.invoiceId,
        number: account.invoiceNumber,
        workspaceId: "ws_fieldnote",
        customerId: account.customerId,
        plan: account.plan,
        status: state.status,
        issuedOn: demoDay(state.issuedOn),
        dueOn: demoDay(state.dueOn),
        paidOn: "paidOn" in state && state.paidOn ? demoDay(state.paidOn) : null,
        subtotalCents: totalCents,
        taxCents: 0,
        totalCents,
        memo: `${account.plan.charAt(0)}${account.plan.slice(1).toLowerCase()} plan — August cycle for ${account.name}.`,
        lines: {
          create: [
            {
              id: `line_${account.invoiceId}`,
              description: `${account.plan.charAt(0)}${account.plan.slice(1).toLowerCase()} plan · monthly`,
              quantity: 1,
              unitPriceCents: totalCents,
              amountCents: totalCents,
            },
          ],
        },
      },
    });
  }

  const [customers, invoices, disputes] = await Promise.all([
    prisma.customer.count(),
    prisma.invoice.count(),
    prisma.dispute.count(),
  ]);
  console.log(
    `Seeded Fieldnote Workspace · ${customers} customers (${CANON_ACCOUNTS.length} from the Collections 4.2 corpus) · ${invoices} invoices · ${disputes} disputes`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

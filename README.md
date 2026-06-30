# GymPro — Gym Management System

A browser-only gym management system for a single gym: memberships, POS/sales,
check-ins, clients, inventory, staff, reports and settings. There is **no backend
server** — all data lives locally in the browser (SQLite via WASM) and can be
exported/imported as a portable `.db` file.

This is a React + Vite + TypeScript refactor of the original single-file build
(`GymPro_3.html`, kept in the repo as the visual/behavioral reference).

## Stack

- **React 18 + Vite + TypeScript** (strict)
- **sql.js** (SQLite compiled to WASM) for persistence — serialized to
  `localStorage` and exportable as a real `.db` file
- **Zustand** for app/auth/POS/UI state
- Plain global CSS (ported verbatim from the original for visual fidelity)
- Lightweight CSS bar charts (no chart dependency); manual CSV export

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check (tsc -b) + production build
npm run preview  # preview the production build
```

Open the dev URL. On first run you'll create your gym name + password; later
sessions require login. The lock button (sidebar footer) ends the session.

## Architecture

```
src/
  main.tsx                 # bootstrap: init DB, seed, wire DB->store revision
  App.tsx                  # loading / auth / shell gating + global Toast & Confirm

  types/index.ts           # all domain types (rows map 1:1 to SQLite columns)

  data/
    db.ts                  # sql.js engine: query/scalar/mutate/batch + write notifications
    schema.ts              # SQLite schema (identical to the original -> .db compatible)
    seedData.ts            # first-run starter plans/products
    importExport.ts        # .db download / read

  store/
    appStore.ts            # route, settings (cfg), revision counter, notif panel
    useQuery.ts            # reactive useQuery/useScalar + useFormatMoney
    toastStore.ts          # toasts (toast() helper usable outside React)
    confirmStore.ts        # promise-based confirmDialog()
    modalStore.ts          # which modal is open + its target id

  features/
    auth/                  # authStore (SHA-256), authUtils
    pos/                   # posStore, posLogic (checkout), ProductGrid/POSCart/CheckoutPanel
    memberships/           # membershipUtils (status/active-membership/client-status)
    inventory/             # stock status helper
    reports/               # aggregation helpers + CSV export
    dashboard/             # live notifications selector

  components/
    common/                # Button, Modal, Badge, StatCard, EmptyState, BarChart,
                           # FilterChips, Field, Avatar, Icon, Toast, ConfirmDialog
    layout/                # AppShell, Sidebar, Header, NotificationPanel

  pages/
    AuthPage, DashboardPage, POSPage, CheckInPage, ClientsPage,
    MembershipsPage, InventoryPage, ReportsPage, ProductsPage,
    PlansPage, StaffPage, SettingsPage
    modals/                # Client, ClientProfile, Product, Plan, Staff, Restock, Membership

  styles/globals.css       # ported design system
```

### How reactivity works

The SQLite database is the single source of truth. Every write (`mutate`/`batch`)
notifies a subscriber that bumps a `revision` counter in the app store. The
`useQuery`/`useScalar` hooks re-run their SQL whenever the revision changes, so
dashboards, lists and reports update live the moment a sale, check-in,
membership change or restock happens — no manual refresh.

### Data ownership

Use **Export DB** (sidebar -> Data, or Settings -> Data Management) to download a
standard SQLite `.db` file, and **Import DB** to restore it. Settings/credentials
live in `localStorage` separately from the gym database.

## Notes on the refactor

- **Business logic preserved exactly**, including the membership status ordering
  (frozen/canceled -> date expiry -> 7-day "expiring" window -> visit-limit
  exhaustion), inventory deduction on checkout, discount math, and report
  aggregations.
- Passwords are hashed with SHA-256 via the Web Crypto API (an upgrade over the
  original's non-crypto hash). The password is never shown in the UI.
- The exported `.db` schema is unchanged, so files remain compatible with the
  original build in both directions.

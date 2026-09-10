# V Corp People — HRMS MVP

A frontend-only HR & workforce management SaaS MVP for a fictional company, **V Corp**, built for the FE Task 1 assignment. HR/Admin users can manage employees, departments, leave, attendance, payroll and workspace settings from a single modern dashboard.

**Live app:** _add your Vercel URL here after deploying_
**Repository:** _add your GitHub URL here_
**Approximate time spent:** ~8 hours (within the assignment's time limit)

## 1. Project overview

V Corp People is a client-rendered SaaS dashboard covering:

- Mocked authentication (login, sign up, full forgot-password flow with a demo one-time code, all handled entirely on the frontend).
- An HR dashboard with headcount, attendance and payroll summaries, department distribution, and recent activity.
- Employee directory with search/filter/sort, add/edit, and activate/deactivate, plus a dedicated employee profile with Overview / Attendance / Leave / Payroll tabs.
- Department management with employee assignment.
- Leave request queue with approve/reject workflow and balance tracking.
- Attendance reporting with date/employee/department/status filters.
- Payroll workflow (Draft → Processing → Completed) with a payslip view.
- Settings: organization, profile, account, notifications, appearance (with instant light/dark switching).

## 2. Tech stack

- **TanStack Start** + **TanStack Router** (file-based routing, SSR shell) with the **Nitro** Vite plugin (`nitro/vite`) for a Vercel-deployable server build
- **TanStack Query** for all data fetching/mutation state (loading, error, caching, invalidation)
- **React 19** + **TypeScript**
- **HeroUI v3** as the primary component/design system (Button, Card, Table, Tabs, Drawer, Select, DatePicker, Calendar, Dropdown/Menu, Chip, Avatar, Switch, Skeleton, Alert, Toast, Pagination, etc.)
- **Tailwind CSS v4** for layout and product-specific styling, on top of HeroUI's design tokens
- **React Hook Form** + **Zod** for form state and validation
- **Faker.js** (`@faker-js/faker`) for realistic seed data
- **@internationalized/date** for calendar date handling in HeroUI's DatePicker
- **lucide-react** for icons

## 3. Setup & running locally

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000` by default (or the next free port). Sign in with the pre-filled demo credentials on the login screen:

```
Email:    admin@vcorp.com
Password: vcorp123
```

### Build for production

```bash
npm run build
npm run preview
```

### Deploying to Vercel

The project uses TanStack Start's Nitro Vite plugin (`nitro/vite`), which produces a Nitro-format build (`.output/`) that Vercel can auto-detect and deploy as a serverless app with no extra config — just import the GitHub repo into Vercel and deploy.

## 4. Project structure

```
src/
  components/
    auth/           # Auth screen layout
    dashboard/       # Dashboard-only visualizations (department distribution, attendance summary, payroll summary, activity feed)
    departments/      # Department form + "employees in this department" panel
    employees/        # Employee add/edit form
    leave/            # Leave request detail + reject-reason panels
    payroll/           # Payslip panel
    layout/            # AppShell, collapsible sidebar, topbar, mobile nav drawer
    ui/                # Shared building blocks: FormFields (text/select/date), FormModal
                       # (right-side drawer), ConfirmDialog, StatusBadge, PageHeader,
                       # EmptyStateBlock/ErrorStateBlock, StatCard, PaginationBar
  context/            # AuthContext (mock session)
  hooks/              # One hook module per domain, wrapping TanStack Query
  lib/
    db.ts             # Mock "API" — reads/writes localStorage, simulates latency
    seed.ts           # Faker-based seed data generator
    auth.ts           # Mock auth (login/signup/reset/session)
    storage.ts        # localStorage helpers
    chart-colors.ts   # Status → color mapping shared by dashboard & feature pages
    utils.ts          # Formatters (currency, date, name)
    zod-resolver.ts   # Local zod resolver for react-hook-form (see note below)
  routes/             # File-based routes (public: login/signup/forgot-password;
                       # protected: dashboard, employees, departments, leave,
                       # attendance, payroll, settings — behind an `_authed` layout guard)
  types/              # Domain types (Employee, Department, LeaveRequest, etc.)
```

## 5. Data & persistence approach

- No backend or database. All data is generated once with **Faker.js** on first load and persisted to **localStorage** under a versioned key, so edits survive a refresh.
- A small mock API layer (`src/lib/db.ts`) exposes async functions (`fetchEmployees`, `createEmployee`, `decideLeaveRequest`, `updatePayrollStatus`, …) that read/write localStorage and add a small artificial delay, so loading states are real and observable — not just decorative.
- **TanStack Query** wraps every one of those functions, giving cache invalidation on mutation, retry, and consistent loading/error state across the app.
- Authentication is fully mocked: a demo HR Admin account is seeded, sign-up creates a new local "user", and the forgot-password flow generates a one-time code client-side (shown in the UI, since there's no email provider) and updates the stored password hash — a real, working reset flow with no backend.

## 6. Important technical & design decisions

- **All data tables (Employees, Leave, Payroll, Attendance, and the sub-tables on the employee profile page) use HeroUI's real `Table` component** (`Table.ScrollContainer`, `Table.Column`, `Table.Body`/`Table.Collection`, `Table.Row`, `Table.Cell`), including sortable columns (`allowsSorting` + `Table.SortableColumnHeader`) on the Employees list. Two real HeroUI/react-aria-components gotchas came up and are worth noting for anyone extending this:
  - `overflow: auto` (which `Table.ScrollContainer` uses, for horizontal scroll on narrow screens) does not reliably clip content to a `border-radius` in Chromium — only `overflow: hidden` does. Each table's rounded/bordered surface is therefore a plain wrapping `<div className="overflow-hidden rounded-lg ...">` around `Table.ScrollContainer`, rather than putting those classes on the scroll container itself.
  - The dynamic `Table.Body`/`Table.Collection` caches rendered rows by item identity. If a cell's content is computed via a `.get()` lookup into an outer map (e.g. resolving an employee's department name from a separately-loaded departments query) *inside* the render callback, the row can get stuck showing stale/placeholder content even after that map is fully populated, because the collection doesn't know the lookup result changed. The fix used throughout this app: resolve every derived field (department name, employee name/avatar/designation, etc.) onto each row's own object *before* it's passed to `Table.Body`/`Table.Collection`, so the row's identity itself changes when the underlying data changes.
- **All overlays are right-side drawers**, not centered modals — Add/Edit Employee, Add/Edit Department, leave request details, reject-reason, payslip, and confirmation dialogs all share one `FormModal` component (built on HeroUI's `Drawer`) with a sticky header and sticky footer, so long forms scroll their body only.
- **A custom `zod-resolver.ts` replaces `@hookform/resolvers/zod`.** The published resolver package ships its own bundled react-hook-form type definitions that drifted from the installed react-hook-form version, producing false "unrelated types" TypeScript errors. A ~15-line resolver implemented directly against the installed react-hook-form types avoids the mismatch entirely.
- **Text fields inside forms that call `reset()` (edit flows) are bound via `Controller`, not `register()`.** `register()`'s ref-based imperative update didn't reliably propagate through HeroUI's `Input` wrapper layers when repopulating a form after an async `reset()` call, which meant edit forms opened with visibly blank text fields even though the correct data had loaded. Routing those fields through `Controller` (the same fully-controlled `value`/`onChange` pattern already used for `Select`/`DatePicker`) fixed this reliably and is now the standard pattern for any field in an edit-and-reset form (see `ControlledTextField`/`ControlledTextAreaField` in `FormFields.tsx`).
- **Attendance/dashboard "today" is a fixed reference date (`2026-09-08`)** matching the seed data's reference point, so the app has a stable, demoable "today" regardless of when it's actually run.
- **Sidebar is a fixed dark surface, independent of the light/dark theme toggle** (a common enterprise-dashboard pattern), and is collapsible to an icon rail on desktop; it becomes an overlay drawer on mobile/tablet.

## 7. Known limitations

- No real backend, multi-user collaboration, or server-side validation — by design, per the assignment.
- Payroll tax/deduction figures are randomly generated approximations, not a real statutory calculation.
- Department "remove employee" isn't a separate action — reassigning an employee to a different department (via the department's employee panel or the employee edit form) is the supported flow, since every employee always belongs to exactly one department in this data model.
- No automated test suite (unit/e2e) — verification was done through manual and scripted browser testing during development.

## 8. What I'd improve with more time

- A real Playwright/Vitest test suite committed to the repo (Playwright was used during development for manual verification but not checked in).
- Server-persisted data (Neon Postgres + Drizzle) as an optional swap-in for the localStorage layer, behind the same `lib/db.ts` function signatures.
- A calendar view for Attendance, in addition to the current table.
- Bulk actions (multi-select rows for status changes).
- Sorting on the Leave/Payroll/Attendance tables (currently only the Employees list has sortable columns, matching the assignment's explicit "sort employees" requirement).

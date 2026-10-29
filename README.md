# EstateFlow Master CRM (React prototype)

A responsive white-label real-estate CRM UI prototype with demo workspaces, lead pipeline, follow-ups, customers, properties, projects, site visits, bookings, payments overview, employee directory, attendance, payroll, reports, branding settings, and a Super Admin workspace directory.

## Run locally

1. Install Node.js LTS.
2. Extract this ZIP.
3. Open Command Prompt in this folder.
4. Run:
   ```bash
   npm install
   npm start
   ```
5. Open the local address printed by React (usually http://localhost:3000).

## Demo access

On the sign-in screen select one of these demo roles and click Continue:
- Super Admin — `admin@estateflow.demo` / `Admin@123`
- Company Owner — `owner@crm-demo.in` / `Owner@123`
- Employee — `rohit@demo.in` / `Employee@123`

The form is a role-preview shortcut, not secure authentication. No actual password validation occurs.

## Important prototype limitations

- All records are stored in browser `localStorage`; data is not shared across devices and can be edited by the browser user.
- The Super Admin company directory and company switcher are demo UI only. Tenant isolation is NOT enforced by a backend.
- Do not put real customer, salary, identity, or payment data into this prototype.
- Before selling it to companies, implement real authentication, server-side authorization, tenant-scoped database policies, migrations, audit logs, backups and restore tests, rate limits, monitoring, privacy/legal workflows, and subscription billing.
- Attendance is a browser-local demonstration, not verified GPS or payroll evidence. Payroll is an estimate, not statutory payroll software.
- WhatsApp, SMS, email automation, AI voice, payment gateway and mobile app packaging are not connected.

## Suggested production architecture

React frontend + secured backend/API + PostgreSQL (e.g. Supabase) or Firebase. Every company-owned record must carry a `tenant_id`/company ID, and the server must derive the active tenant from the authenticated session rather than trusting a client-provided ID. Enforce role permissions server-side and test cross-tenant access before launch.

// Mirrors backend/db/seed_data.py DEMO_USERS. These are real accounts with
// real hashed passwords server-side - the quick-login buttons submit these
// credentials through the normal /api/v1/auth/login flow, they do not
// bypass authentication.
export const DEMO_ACCOUNTS = [
  {
    username: "brian.mugambi",
    password: "SysAdmin@2026",
    fullName: "Brian Mugambi",
    role: "Admin",
    label: "Brian Mugambi (admin)",
    blurb: "Full platform control, governance & terminal settings",
    avatar: "/images/team/brian_mugambi.jpg",
  },
  {
    username: "carson.sila",
    password: "OpsControl@2026",
    fullName: "Carson Sila",
    role: "Ops",
    label: "Carson Sila",
    blurb: "Live yard telemetry, gantry control & ETL sync",
    avatar: "/images/team/carson_sila.jpg",
  },
  {
    username: "charlene.kamunyu",
    password: "BillingApprove@2026",
    fullName: "Charlene Kamunyu",
    role: "Billing Approver",
    label: "Charlene Kamunyu",
    blurb: "12-step tariff calculations & invoice approvals",
    avatar: "/images/team/charlene_kamunyu.jpg",
  },
  {
    username: "emanuel.brian",
    password: "FinanceLead@2026",
    fullName: "Emanuel Brian",
    role: "Finance",
    label: "Emanuel Brian",
    blurb: "AI/ML turnaround models, leakage & SAP ERP sync",
    avatar: "/images/team/emanuel_brian.jpg",
  },
  {
    username: "brian.sigei",
    password: "AuditTrail@2026",
    fullName: "Brian Sigei",
    role: "Auditor",
    label: "Brian Sigei",
    blurb: "EPRA/KRA compliance, tamper-evident audit logs",
    avatar: "/images/team/brian_sigei.jpg",
  },
  {
    username: "river.leah",
    password: "OmcPortal@2026",
    fullName: "River Leah",
    role: "OMC Representative",
    label: "River Leah",
    blurb: "Oil Marketing Company (OMC) fleet tracking & disputes",
    avatar: "/images/team/river_leah.jpg",
  },
] as const;

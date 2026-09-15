export interface KpcUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  organization: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: KpcUser;
}

export interface DemoAccount {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  organization: string;
}

export const ROLE_DISPLAY: Record<string, { label: string; blurb: string }> = {
  Ops: { label: "Ops Controller", blurb: "Live yard, gate telemetry and ETL sync" },
  "Billing Approver": { label: "Billing Approver", blurb: "Invoice review and approval" },
  Finance: { label: "Finance Lead", blurb: "ERP posting and financial oversight" },
  Auditor: { label: "Senior Auditor", blurb: "Read-only audit trail and compliance review" },
  Admin: { label: "System Admin", blurb: "Full platform and tariff control" },
  "OMC Representative": { label: "OMC Representative", blurb: "Carrier-side visibility into charges" },
};

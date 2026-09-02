export type Role = "read" | "write";

export type Principal = {
  id: string;
  display_name: string;
  email: string;
  title: string;
};

export type Resource = {
  id: string;
  display_name: string;
  environment: "production" | "staging";
  allowed_roles: Role[];
  denied_roles: Role[];
  notes: string;
};

export type RoleInfo = {
  id: Role;
  rank: number;
  notes: string;
};

export type Catalog = {
  demo: true;
  disclaimer: string;
  people: Principal[];
  resources: Resource[];
  roles: RoleInfo[];
};

export type Mandate = {
  max_ttl_hours: number;
  allowlisted_roles: Role[];
  version: number;
};

export type Ticket = {
  id: string;
  title: string;
  raw_body: string;
  body_untrusted: string;
};

export type ProposalStatus = "draft" | "issued" | "cancelled";

export type Proposal = {
  id: string;
  principal_id: string;
  resource_id: string;
  role: Role;
  ttl_hours: number;
  rationale: string;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
  issued_grant_id?: string;
};

export type IssuedGrant = {
  id: string;
  proposal_id: string;
  principal_id: string;
  resource_id: string;
  role: Role;
  ttl_hours: number;
  issued_at: string;
  expires_at: string;
  issuer: "human";
  receipt_code: string;
  idempotent_replay?: boolean;
};

export type RefusalCode =
  | "UNKNOWN_PRINCIPAL"
  | "UNKNOWN_RESOURCE"
  | "UNKNOWN_ROLE"
  | "ROLE_NOT_ALLOWLISTED"
  | "ROLE_DENIED_BY_RESOURCE_POLICY"
  | "TTL_EXCEEDS_MANDATE"
  | "TTL_INVALID"
  | "INVALID_ARGS"
  | "MONOTONIC_TTL_INCREASE"
  | "MONOTONIC_ROLE_ESCALATION"
  | "MONOTONIC_SCOPE_CHANGE"
  | "NOT_STRICTLY_TIGHTER"
  | "NO_SUCH_PROPOSAL"
  | "PROPOSAL_NOT_DRAFT"
  | "STRUCTURALLY_MISSING_TOOL"
  | "UNKNOWN_TOOL"
  | "ALREADY_ISSUED"
  | "HUMAN_ONLY_ACTION"
  | "MANDATE_CHANGE_DENIED"
  | "MANDATE_CHANGE_PENDING"
  | "INJECTION_CANNOT_ISSUE";

export type Evidence = {
  code: RefusalCode;
  message: string;
  attempted?: Record<string, unknown>;
  mandate?: Mandate;
  resource_policy?: {
    id: string;
    allowed_roles: Role[];
    denied_roles: Role[];
  };
  proposal?: Partial<Proposal>;
  tool?: string;
  notes?: string[];
};

export type ToolOk<T> = {
  ok: true;
  refused: false;
  data: T;
};

export type ToolRefused = {
  ok: false;
  refused: true;
  evidence: Evidence;
};

export type ToolResult<T = unknown> = ToolOk<T> | ToolRefused;

export type Actor = "agent" | "human" | "system";

export type ActivityEntry = {
  id: string;
  at: string;
  actor: Actor;
  tool: string;
  args: unknown;
  result: ToolResult;
};

export type MandateChangeRequest = {
  max_ttl_hours?: number;
  allowlisted_roles?: Role[];
  note?: string;
};

export type PendingMandateChange = {
  request: MandateChangeRequest;
  requested_at: string;
  status: "awaiting_human";
};

export type WebMcpStatus = {
  available: boolean;
  host: "document" | "navigator" | "none";
  registered: string[];
};

export type RoomSnapshot = {
  room_id: string;
  seeded_at: string;
  demo: true;
  disclaimer: string;
  mandate: Mandate;
  ticket: Ticket;
  catalog: Catalog;
  proposals: Proposal[];
  issued_grants: IssuedGrant[];
  activity: ActivityEntry[];
  last_refusal: Evidence | null;
  pending_mandate_change: PendingMandateChange | null;
  webmcp: WebMcpStatus;
  selected_proposal_id: string | null;
};

export type ProposeInput = {
  principal_id: string;
  resource_id: string;
  role: Role | string;
  ttl_hours: number;
  rationale?: string;
};

export type TightenInput = {
  proposal_id: string;
  ttl_hours?: number;
  role?: Role | string;
};

export type RoomClock = {
  now: () => Date;
  id: (prefix: string) => string;
};

export const REGISTERED_TOOL_NAMES = [
  "get_room",
  "list_catalog",
  "propose_grant",
  "tighten_proposal",
  "cancel_proposal",
  "get_activity",
  "request_mandate_change",
] as const;

export type RegisteredToolName = (typeof REGISTERED_TOOL_NAMES)[number];

export const FORBIDDEN_TOOL_NAMES = [
  "issue_grant",
  "approve_grant",
  "execute_grant",
  "grant_access",
  "apply_entitlement",
  "issue",
] as const;

export enum ContractStatus {
  SUBMITTED = "Submitted",
  IN_REVIEW = "In Review",
  NEEDS_CHANGES = "Needs Changes",
  APPROVED = "Approved",
}

export interface User {
  id: string;
  email: string;
  role: "client" | "attorney";
  tenantId: string; // Used for multi-tenant isolation ('Tenant A', 'Tenant B', etc., or 'Firm' for attorneys)
  name: string;
}

export interface Contract {
  id: string;
  title: string;
  content: string;
  status: ContractStatus;
  requestedDeadline: string; // ISO Date String
  clientId: string;
  clientName: string;
  tenantId: string;
  attorneyReviewRemarks?: string;
  revisionNotes?: string;
  createdAt: string; // ISO Timestamp
  updatedAt: string; // ISO Timestamp
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  contractId: string;
  createdAt: string; // ISO Timestamp
  read: boolean;
}

export interface AuditLog {
  id: string;
  contractId: string;
  contractTitle: string;
  actorEmail: string;
  actorRole: "client" | "attorney";
  timestamp: string; // ISO Timestamp
  actionType: "Create" | "Status Change" | "Edit & Resubmit" | "Approve" | "Reject";
  fromStatus?: ContractStatus;
  toStatus: ContractStatus;
  textHash: string; // sha256 or truncated hash
  textSnapshot: string;
}

export interface DeltaMapItem {
  type: "added" | "removed" | "unchanged";
  text: string;
}

export interface RevisionAnalysis {
  summary: string;
  detailedDelta: string;
  revisionNotesSummary: string;
}

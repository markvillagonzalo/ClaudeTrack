import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Contract, ContractStatus, User, Notification, AuditLog } from "../src/types.js";

const DB_FILE = path.join(process.cwd(), "contracts_db.json");

interface DatabaseSchema {
  users: User[];
  contracts: Contract[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

const DEFAULT_USERS: User[] = [
  {
    id: "user-client-a",
    email: "client-a@acme.com",
    role: "client",
    tenantId: "Acme Corp",
    name: "Sarah Connor (Acme Corp)",
  },
  {
    id: "user-client-b",
    email: "client-b@beta.com",
    role: "client",
    tenantId: "Beta Tech",
    name: "John Carter (Beta Tech)",
  },
  {
    id: "user-attorney",
    email: "attorney@ctlaw.com",
    role: "attorney",
    tenantId: "CT Law Firm",
    name: "Jameson Kent, Esq.",
  },
];

const DEFAULT_CONTRACTS: Contract[] = [
  {
    id: "contract-1",
    title: "Commercial Lease Agreement - Suite 404",
    content: `COMMERCIAL LEASE AGREEMENT

This Lease Agreement is made and entered into as of January 15, 2026, by and between Landlord Prime Properties LLC and Tenant Acme Corp.

1. PREMISES. Landlord hereby leases to Tenant the commercial space located at 100 Innovation Way, Suite 404, Boston, MA.
2. TERM. The lease shall be for a term of 36 months, commencing on February 1, 2026.
3. RENT. Tenant agrees to pay Landlord a monthly rent of $4,500.00, payable in advance on the first day of each calendar month.
4. USE OF PREMISES. Tenant shall use the Premises solely for general office and technology development operations.
5. MAINTENANCE. Tenant shall maintain the interior of the Premises in good order and repair at its own sole expense. Landlord shall be responsible for structural maintenance and utility mains.`,
    status: ContractStatus.SUBMITTED,
    requestedDeadline: "2026-06-30",
    clientId: "user-client-a",
    clientName: "Sarah Connor (Acme Corp)",
    tenantId: "Acme Corp",
    createdAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-15T10:00:00.000Z",
  },
  {
    id: "contract-2",
    title: "Master Software Services Agreement",
    content: `MASTER SOFTWARE SERVICES AGREEMENT

This Master Software Services Agreement (the "Agreement") is dated June 1, 2026, between Beta Tech (the "Client") and CoreConsultants LP (the "Service Provider").

1. SCOPE OF SERVICES. Service Provider shall perform the custom software architecture and database optimization services described in Statement of Work (SOW) #1.
2. FEES & COMPENSATION. Client shall compensate Service Provider at a rate of $200.00 per hour. Total aggregate fees under SOW #1 shall not exceed $50,000.00 without prior written authorization.
3. INTELLECTUAL PROPERTY. All deliverables, source code, data schemas, and architecture blueprints generated specifically for Client under this Agreement shall remain the exclusive property of Client upon full and final payment.
4. CONFIDENTIALITY. Both parties agree to protect all proprietary and business-intelligence information from unauthorized disclosure using reasonable commercial standards of care.`,
    status: ContractStatus.NEEDS_CHANGES,
    requestedDeadline: "2026-07-10",
    clientId: "user-client-b",
    clientName: "John Carter (Beta Tech)",
    tenantId: "Beta Tech",
    attorneyReviewRemarks: "Section 3 (Intellectual Property) is acceptable, but we need to limit the warranty and add an indemnity threshold. Additionally, Section 2 must clarify that aggregate fees do not include reasonable travel expenses.",
    revisionNotes: "Client requested clarification on compensation limits before initial legal team review.",
    createdAt: "2026-06-10T14:30:00.000Z",
    updatedAt: "2026-06-12T11:15:00.000Z",
  },
  {
    id: "contract-3",
    title: "Mutual Non-Disclosure Agreement",
    content: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into by and between Acme Corp and TechGlobal Partners Group.

1. PURPOSE. The parties wish to explore a potential business relationship of mutual benefit. In connection with this exploration, each party may disclose proprietary technical or business information (the "Confidential Information").
2. TERM OF OBLIGATION. The receiving party's obligations regarding confidentiality and restricted usage of Confidential Information shall persist for a period of five (5) years from the date of disclosure.
3. REMEDIES. The parties acknowledge that any breach of this Agreement may cause irreparable harm for which monetary damages alone are insufficient. The disclosing party shall be entitled to seek injunctive relief to prevent unauthorized disclosures.`,
    status: ContractStatus.APPROVED,
    requestedDeadline: "2026-06-25",
    clientId: "user-client-a",
    clientName: "Sarah Connor (Acme Corp)",
    tenantId: "Acme Corp",
    attorneyReviewRemarks: "Approved as drafted. Standard terms meet our firm compliance threshold.",
    createdAt: "2026-06-12T09:00:00.000Z",
    updatedAt: "2026-06-14T16:20:00.000Z",
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    contractId: "contract-1",
    contractTitle: "Commercial Lease Agreement - Suite 404",
    actorEmail: "client-a@acme.com",
    actorRole: "client",
    timestamp: "2026-06-15T10:00:00.000Z",
    actionType: "Create",
    toStatus: ContractStatus.SUBMITTED,
    textHash: crypto.createHash("sha256").update("COMMERCIAL LEASE AGREEMENT...").digest("hex").slice(0, 8),
    textSnapshot: "COMMERCIAL LEASE AGREEMENT\n\nThis Lease Agreement is made and entered into as of January 15, 2026, by and between Landlord Prime Properties LLC...",
  },
  {
    id: "log-2",
    contractId: "contract-2",
    contractTitle: "Master Software Services Agreement",
    actorEmail: "client-b@beta.com",
    actorRole: "client",
    timestamp: "2026-06-10T14:30:00.000Z",
    actionType: "Create",
    toStatus: ContractStatus.SUBMITTED,
    textHash: crypto.createHash("sha256").update("MASTER SOFTWARE SERVICES AGREEMENT...").digest("hex").slice(0, 8),
    textSnapshot: "MASTER SOFTWARE SERVICES AGREEMENT\n\nThis Master Software Services Agreement is dated June 1, 2026...",
  },
  {
    id: "log-3",
    contractId: "contract-2",
    contractTitle: "Master Software Services Agreement",
    actorEmail: "attorney@ctlaw.com",
    actorRole: "attorney",
    timestamp: "2026-06-12T11:15:00.000Z",
    actionType: "Status Change",
    fromStatus: ContractStatus.SUBMITTED,
    toStatus: ContractStatus.NEEDS_CHANGES,
    textHash: crypto.createHash("sha256").update("MASTER SOFTWARE SERVICES AGREEMENT...").digest("hex").slice(0, 8),
    textSnapshot: "MASTER SOFTWARE SERVICES AGREEMENT\n\nThis Master Software Services Agreement is dated June 1, 2026...",
  },
  {
    id: "log-4",
    contractId: "contract-3",
    contractTitle: "Mutual Non-Disclosure Agreement",
    actorEmail: "attorney@ctlaw.com",
    actorRole: "attorney",
    timestamp: "2026-06-14T16:20:00.000Z",
    actionType: "Approve",
    fromStatus: ContractStatus.IN_REVIEW,
    toStatus: ContractStatus.APPROVED,
    textHash: crypto.createHash("sha256").update("MUTUAL NON-DISCLOSURE AGREEMENT...").digest("hex").slice(0, 8),
    textSnapshot: "MUTUAL NON-DISCLOSURE AGREEMENT\n\nThis Mutual Non-Disclosure Agreement is entered into by...",
  },
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    userId: "user-client-b",
    message: "Master Software Services Agreement status updated to 'Needs Changes' by Attorney Jameson Kent, Esq.",
    contractId: "contract-2",
    createdAt: "2026-06-12T11:15:05.000Z",
    read: false,
  },
  {
    id: "notif-2",
    userId: "user-client-a",
    message: "Mutual Non-Disclosure Agreement has been Approved by Lawyer Jameson Kent, Esq.",
    contractId: "contract-3",
    createdAt: "2026-06-14T16:20:05.000Z",
    read: true,
  },
];

export class Database {
  private schema: DatabaseSchema;

  constructor() {
    this.schema = {
      users: DEFAULT_USERS,
      contracts: DEFAULT_CONTRACTS,
      notifications: DEFAULT_NOTIFICATIONS,
      auditLogs: DEFAULT_AUDIT_LOGS,
    };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        this.schema = {
          users: parsed.users || DEFAULT_USERS,
          contracts: parsed.contracts || DEFAULT_CONTRACTS,
          notifications: parsed.notifications || DEFAULT_NOTIFICATIONS,
          auditLogs: parsed.auditLogs || DEFAULT_AUDIT_LOGS,
        };
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load ClauseTrack database, resetting to default.", e);
      this.save();
    }
  }

  private save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save ClauseTrack database.", e);
    }
  }

  // Users Auth lookup
  getUsers(): User[] {
    return this.schema.users;
  }

  getUserById(id: string): User | undefined {
    return this.schema.users.find((u) => u.id === id);
  }

  // Multi-tenant contracts fetch
  getContracts(user: User): Contract[] {
    if (user.role === "attorney") {
      return this.schema.contracts;
    }
    // Strict Logical Tenant Isolation
    return this.schema.contracts.filter((c) => c.tenantId === user.tenantId);
  }

  getContractById(id: string, user: User): Contract | undefined {
    const contract = this.schema.contracts.find((c) => c.id === id);
    if (!contract) return undefined;
    
    // Strict boundary checks
    if (user.role !== "attorney" && contract.tenantId !== user.tenantId) {
      return undefined;
    }
    return contract;
  }

  createContract(contractData: Omit<Contract, "id" | "createdAt" | "updatedAt">, user: User): Contract {
    const newContract: Contract = {
      ...contractData,
      id: `contract-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.schema.contracts.unshift(newContract);
    
    // Log creation transaction
    this.createAuditLog(
      newContract.id,
      newContract.title,
      user.email,
      user.role,
      "Create",
      undefined,
      newContract.status,
      newContract.content
    );

    this.save();
    return newContract;
  }

  updateContract(
    id: string,
    updates: Partial<Pick<Contract, "title" | "content" | "status" | "attorneyReviewRemarks" | "revisionNotes" | "requestedDeadline">>,
    user: User
  ): Contract {
    const contractIndex = this.schema.contracts.findIndex((c) => c.id === id);
    if (contractIndex === -1) {
      throw new Error("Contract not found");
    }

    const currentContract = this.schema.contracts[contractIndex];

    // Security check
    if (user.role !== "attorney" && currentContract.tenantId !== user.tenantId) {
      throw new Error("Unauthorized access to contract");
    }

    // Integrity enforcement: "As soon as an authorized attorney shifts a contract into the Approved status, the rich text canvas becomes structurally locked and completely immutable for all parties."
    if (currentContract.status === ContractStatus.APPROVED && user.role !== "attorney") {
      throw new Error("Approved contracts are locked and completely immutable");
    }

    const fromStatus = currentContract.status;
    const toStatus = updates.status || fromStatus;

    const updatedContract: Contract = {
      ...currentContract,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.schema.contracts[contractIndex] = updatedContract;

    // Log the transaction
    let actionType: AuditLog["actionType"] = "Status Change";
    if (updates.status === ContractStatus.APPROVED) {
      actionType = "Approve";
    } else if (updates.content !== undefined && fromStatus === ContractStatus.NEEDS_CHANGES) {
      actionType = "Edit & Resubmit";
    }

    this.createAuditLog(
      id,
      updatedContract.title,
      user.email,
      user.role,
      actionType,
      fromStatus,
      toStatus,
      updatedContract.content
    );

    this.save();
    return updatedContract;
  }

  // Notifications Log
  getNotifications(userId: string): Notification[] {
    return this.schema.notifications.filter((n) => n.userId === userId);
  }

  createNotification(userId: string, contractId: string, message: string) {
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      contractId,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.schema.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  markNotificationsAsRead(userId: string) {
    this.schema.notifications = this.schema.notifications.map((n) => {
      if (n.userId === userId) {
        return { ...n, read: true };
      }
      return n;
    });
    this.save();
  }

  // Audit Logs
  getAuditLogs(contractId?: string, user?: User): AuditLog[] {
    let logs = this.schema.auditLogs;
    if (contractId) {
      logs = logs.filter((l) => l.contractId === contractId);
    }
    
    // Sort logs newest first
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (!user || user.role === "attorney") {
      return logs;
    }

    // Clients can only see logs for contracts they are authorized to see
    const accessibleContractIds = this.getContracts(user).map((c) => c.id);
    return logs.filter((l) => accessibleContractIds.includes(l.contractId));
  }

  private createAuditLog(
    contractId: string,
    contractTitle: string,
    actorEmail: string,
    actorRole: "client" | "attorney",
    actionType: AuditLog["actionType"],
    fromStatus: ContractStatus | undefined,
    toStatus: ContractStatus,
    content: string
  ): AuditLog {
    const textHash = crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
    const textSnapshot = content.slice(0, 500) + (content.length > 500 ? "\n... (truncated snapshot)" : "");

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      contractId,
      contractTitle,
      actorEmail,
      actorRole,
      timestamp: new Date().toISOString(),
      actionType,
      fromStatus,
      toStatus,
      textHash,
      textSnapshot,
    };

    this.schema.auditLogs.unshift(newLog);
    return newLog;
  }
}

export const db = new Database();

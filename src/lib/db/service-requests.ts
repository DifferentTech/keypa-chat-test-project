import { createClient, type Client, type InValue } from "@libsql/client";
import { config } from "../config";

export type ServiceType = "plumbing" | "electrical" | "hvac" | "general";
export type RequestStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";
export type Urgency = "low" | "medium" | "high" | "emergency";
export type TimeSlot = "morning" | "afternoon" | "evening";

export type ServiceRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  conversationId: string | null;
  propertyId: string;
  propertyAddress: string;
  serviceType: ServiceType;
  issue: string;
  urgency: Urgency;
  preferredDate: string | null;
  preferredTimeSlot: TimeSlot | null;
  status: RequestStatus;
  workflowRunId: string | null;
  assignedProfessionalId: string | null;
  assignedProfessionalName: string | null;
  confirmedDate: string | null;
  confirmedTimeSlot: string | null;
  adminNotes: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceRequestInput = {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  conversationId?: string;
  propertyId: string;
  propertyAddress: string;
  serviceType: ServiceType;
  issue: string;
  urgency: Urgency;
  preferredDate?: string;
  preferredTimeSlot?: TimeSlot;
  workflowRunId?: string;
};

export type UpdateServiceRequestInput = {
  status?: RequestStatus;
  workflowRunId?: string;
  assignedProfessionalId?: string;
  assignedProfessionalName?: string;
  confirmedDate?: string;
  confirmedTimeSlot?: string;
  adminNotes?: string;
  processedBy?: string;
};

let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    console.log("[ServiceRequests] Initializing Turso database client");
    _client = createClient({
      url: config.turso.url,
      authToken: config.turso.authToken,
    });
  }
  return _client;
}

// Initialize the service_requests table
export async function initializeServiceRequestsTable(): Promise<void> {
  const client = getClient();

  await client.execute(`
    CREATE TABLE IF NOT EXISTS service_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      user_phone TEXT NOT NULL,
      conversation_id TEXT,
      property_id TEXT NOT NULL,
      property_address TEXT NOT NULL,
      service_type TEXT NOT NULL,
      issue TEXT NOT NULL,
      urgency TEXT NOT NULL,
      preferred_date TEXT,
      preferred_time_slot TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      workflow_run_id TEXT,
      assigned_professional_id TEXT,
      assigned_professional_name TEXT,
      confirmed_date TEXT,
      confirmed_time_slot TEXT,
      admin_notes TEXT,
      processed_by TEXT,
      processed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Add workflow_run_id column if it doesn't exist (migration for existing tables)
  try {
    await client.execute(`ALTER TABLE service_requests ADD COLUMN workflow_run_id TEXT`);
    console.log("[ServiceRequests] Added workflow_run_id column");
  } catch {
    // Column already exists, ignore error
  }

  // Create indexes for common queries
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC)
  `);

  console.log("[ServiceRequests] Table initialized successfully");
}

// Generate a unique request ID
function generateRequestId(): string {
  return `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Create a new service request
export async function createServiceRequest(input: CreateServiceRequestInput): Promise<ServiceRequest> {
  const client = getClient();
  const now = new Date().toISOString();
  const id = generateRequestId();

  await client.execute({
    sql: `
      INSERT INTO service_requests (
        id, user_id, user_name, user_email, user_phone, conversation_id,
        property_id, property_address, service_type, issue, urgency,
        preferred_date, preferred_time_slot, status, workflow_run_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `,
    args: [
      id,
      input.userId,
      input.userName,
      input.userEmail,
      input.userPhone,
      input.conversationId || null,
      input.propertyId,
      input.propertyAddress,
      input.serviceType,
      input.issue,
      input.urgency,
      input.preferredDate || null,
      input.preferredTimeSlot || null,
      input.workflowRunId || null,
      now,
      now,
    ],
  });

  console.log(`[ServiceRequests] Created request ${id} for user ${input.userId}`);

  return {
    id,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    userPhone: input.userPhone,
    conversationId: input.conversationId || null,
    propertyId: input.propertyId,
    propertyAddress: input.propertyAddress,
    serviceType: input.serviceType,
    issue: input.issue,
    urgency: input.urgency,
    preferredDate: input.preferredDate || null,
    preferredTimeSlot: input.preferredTimeSlot || null,
    status: "pending",
    workflowRunId: input.workflowRunId || null,
    assignedProfessionalId: null,
    assignedProfessionalName: null,
    confirmedDate: null,
    confirmedTimeSlot: null,
    adminNotes: null,
    processedBy: null,
    processedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

// Get a service request by ID
export async function getServiceRequest(id: string): Promise<ServiceRequest | null> {
  const client = getClient();
  const result = await client.execute({
    sql: "SELECT * FROM service_requests WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  return rowToServiceRequest(result.rows[0]);
}

// Get all service requests with optional filters
export async function getServiceRequests(options?: {
  status?: RequestStatus;
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<ServiceRequest[]> {
  const client = getClient();
  const conditions: string[] = [];
  const args: InValue[] = [];

  if (options?.status) {
    conditions.push("status = ?");
    args.push(options.status);
  }

  if (options?.userId) {
    conditions.push("user_id = ?");
    args.push(options.userId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limitClause = options?.limit ? `LIMIT ${options.limit}` : "";
  const offsetClause = options?.offset ? `OFFSET ${options.offset}` : "";

  const result = await client.execute({
    sql: `SELECT * FROM service_requests ${whereClause} ORDER BY created_at DESC ${limitClause} ${offsetClause}`,
    args,
  });

  return result.rows.map(rowToServiceRequest);
}

// Update a service request
export async function updateServiceRequest(
  id: string,
  input: UpdateServiceRequestInput
): Promise<ServiceRequest | null> {
  const client = getClient();
  const now = new Date().toISOString();
  const updates: string[] = ["updated_at = ?"];
  const args: InValue[] = [now];

  if (input.status !== undefined) {
    updates.push("status = ?");
    args.push(input.status);
  }
  if (input.workflowRunId !== undefined) {
    updates.push("workflow_run_id = ?");
    args.push(input.workflowRunId);
  }
  if (input.assignedProfessionalId !== undefined) {
    updates.push("assigned_professional_id = ?");
    args.push(input.assignedProfessionalId);
  }
  if (input.assignedProfessionalName !== undefined) {
    updates.push("assigned_professional_name = ?");
    args.push(input.assignedProfessionalName);
  }
  if (input.confirmedDate !== undefined) {
    updates.push("confirmed_date = ?");
    args.push(input.confirmedDate);
  }
  if (input.confirmedTimeSlot !== undefined) {
    updates.push("confirmed_time_slot = ?");
    args.push(input.confirmedTimeSlot);
  }
  if (input.adminNotes !== undefined) {
    updates.push("admin_notes = ?");
    args.push(input.adminNotes);
  }
  if (input.processedBy !== undefined) {
    updates.push("processed_by = ?");
    args.push(input.processedBy);
    updates.push("processed_at = ?");
    args.push(now);
  }

  args.push(id);

  await client.execute({
    sql: `UPDATE service_requests SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });

  console.log(`[ServiceRequests] Updated request ${id}`);

  return getServiceRequest(id);
}

// Get request counts by status
export async function getRequestCounts(): Promise<Record<RequestStatus, number>> {
  const client = getClient();
  const result = await client.execute(
    "SELECT status, COUNT(*) as count FROM service_requests GROUP BY status"
  );

  const counts: Record<RequestStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    cancelled: 0,
  };

  for (const row of result.rows) {
    const status = row.status as RequestStatus;
    counts[status] = Number(row.count);
  }

  return counts;
}

// Helper to convert database row to ServiceRequest
function rowToServiceRequest(row: Record<string, unknown>): ServiceRequest {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userName: row.user_name as string,
    userEmail: row.user_email as string,
    userPhone: row.user_phone as string,
    conversationId: row.conversation_id as string | null,
    propertyId: row.property_id as string,
    propertyAddress: row.property_address as string,
    serviceType: row.service_type as ServiceType,
    issue: row.issue as string,
    urgency: row.urgency as Urgency,
    preferredDate: row.preferred_date as string | null,
    preferredTimeSlot: row.preferred_time_slot as TimeSlot | null,
    status: row.status as RequestStatus,
    workflowRunId: row.workflow_run_id as string | null,
    assignedProfessionalId: row.assigned_professional_id as string | null,
    assignedProfessionalName: row.assigned_professional_name as string | null,
    confirmedDate: row.confirmed_date as string | null,
    confirmedTimeSlot: row.confirmed_time_slot as string | null,
    adminNotes: row.admin_notes as string | null,
    processedBy: row.processed_by as string | null,
    processedAt: row.processed_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

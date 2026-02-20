import { NextRequest, NextResponse } from "next/server";
import {
  getServiceRequest,
  updateServiceRequest,
} from "@/lib/db/service-requests";
import { professionals } from "@/lib/professionals";

// VoltAgent server URL (where workflows are registered)
const VOLTAGENT_URL = "http://localhost:3141";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ApproveBody = {
  professionalId: string;
  confirmedDate: string;
  confirmedTimeSlot: string;
  adminNotes?: string;
  processedBy?: string;
};

type WorkflowResumeResponse = {
  success: boolean;
  data?: {
    executionId: string;
    status: "completed" | "suspended" | "error";
    result?: unknown;
  };
  error?: string;
};

// POST /api/admin/requests/[id]/approve - Approve a request
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as ApproveBody;

    const existingRequest = await getServiceRequest(id);
    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    if (existingRequest.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Request has already been processed" },
        { status: 400 }
      );
    }

    // Find professional name
    const serviceType = existingRequest.serviceType as keyof typeof professionals;
    const availableProfessionals = professionals[serviceType] || professionals.general;
    const professional = availableProfessionals.find((p) => p.id === body.professionalId);
    const professionalName = professional?.name || "Unknown Professional";

    // Check if we have a workflow execution ID
    const workflowRunId = existingRequest.workflowRunId;

    if (workflowRunId) {
      // Resume the workflow with approval data
      console.log(`[Admin API] Resuming workflow ${workflowRunId} for request ${id}`);

      const resumeResponse = await fetch(
        `${VOLTAGENT_URL}/workflows/service-request/executions/${workflowRunId}/resume`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeData: {
              approved: true,
              professionalId: body.professionalId,
              professionalName,
              confirmedDate: body.confirmedDate,
              confirmedTimeSlot: body.confirmedTimeSlot,
              adminNotes: body.adminNotes,
              processedBy: body.processedBy || "admin",
            },
          }),
        }
      );

      if (!resumeResponse.ok) {
        const errorText = await resumeResponse.text();
        console.error("[Admin API] Workflow resume error:", errorText);

        // Fallback to direct DB update if workflow resume fails
        console.log("[Admin API] Falling back to direct DB update");
        await updateServiceRequest(id, {
          status: "approved",
          assignedProfessionalId: body.professionalId,
          assignedProfessionalName: professionalName,
          confirmedDate: body.confirmedDate,
          confirmedTimeSlot: body.confirmedTimeSlot,
          adminNotes: body.adminNotes,
          processedBy: body.processedBy || "admin",
        });
      } else {
        const result = await resumeResponse.json() as WorkflowResumeResponse;
        console.log("[Admin API] Workflow resumed successfully:", result.data?.status);
      }
    } else {
      // No workflow execution ID - update directly (legacy request)
      console.log(`[Admin API] No workflow ID for request ${id}, updating directly`);
      await updateServiceRequest(id, {
        status: "approved",
        assignedProfessionalId: body.professionalId,
        assignedProfessionalName: professionalName,
        confirmedDate: body.confirmedDate,
        confirmedTimeSlot: body.confirmedTimeSlot,
        adminNotes: body.adminNotes,
        processedBy: body.processedBy || "admin",
      });
    }

    // Fetch the updated request
    const updatedRequest = await getServiceRequest(id);

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: `Request ${id} has been approved`,
      workflowResumed: !!workflowRunId,
    });
  } catch (error) {
    console.error("[API] Error approving request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve request" },
      { status: 500 }
    );
  }
}

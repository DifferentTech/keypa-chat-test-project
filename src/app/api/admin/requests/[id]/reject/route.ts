import { NextRequest, NextResponse } from "next/server";
import {
  getServiceRequest,
  updateServiceRequest,
} from "@/lib/db/service-requests";

// VoltAgent server URL (where workflows are registered)
const VOLTAGENT_URL = "http://localhost:3141";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type RejectBody = {
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

// POST /api/admin/requests/[id]/reject - Reject a request
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as RejectBody;

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

    // Check if we have a workflow execution ID
    const workflowRunId = existingRequest.workflowRunId;

    if (workflowRunId) {
      // Resume the workflow with rejection data
      console.log(`[Admin API] Resuming workflow ${workflowRunId} for request ${id} (rejecting)`);

      const resumeResponse = await fetch(
        `${VOLTAGENT_URL}/workflows/service-request/executions/${workflowRunId}/resume`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeData: {
              approved: false,
              adminNotes: body.adminNotes || "Request rejected by admin",
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
          status: "rejected",
          adminNotes: body.adminNotes || "Request rejected by admin",
          processedBy: body.processedBy || "admin",
        });
      } else {
        const result = await resumeResponse.json() as WorkflowResumeResponse;
        console.log("[Admin API] Workflow resumed successfully (rejected):", result.data?.status);
      }
    } else {
      // No workflow execution ID - update directly (legacy request)
      console.log(`[Admin API] No workflow ID for request ${id}, updating directly`);
      await updateServiceRequest(id, {
        status: "rejected",
        adminNotes: body.adminNotes || "Request rejected by admin",
        processedBy: body.processedBy || "admin",
      });
    }

    // Fetch the updated request
    const updatedRequest = await getServiceRequest(id);

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: `Request ${id} has been rejected`,
      workflowResumed: !!workflowRunId,
    });
  } catch (error) {
    console.error("[API] Error rejecting request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reject request" },
      { status: 500 }
    );
  }
}

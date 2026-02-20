import { NextRequest, NextResponse } from "next/server";
import {
  getServiceRequest,
  updateServiceRequest,
  type UpdateServiceRequestInput,
} from "@/lib/db/service-requests";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/requests/[id] - Get a single request
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const serviceRequest = await getServiceRequest(id);

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serviceRequest,
    });
  } catch (error) {
    console.error("[API] Error fetching request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch request" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/requests/[id] - Update a request (approve/reject)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as UpdateServiceRequestInput;

    const existingRequest = await getServiceRequest(id);
    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    const updatedRequest = await updateServiceRequest(id, body);

    return NextResponse.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("[API] Error updating request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update request" },
      { status: 500 }
    );
  }
}

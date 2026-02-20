import { NextRequest, NextResponse } from "next/server";
import { getServiceRequest } from "@/lib/db/service-requests";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/requests/[id] - Get request status (user-facing)
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

    // Return only the fields needed for status polling
    return NextResponse.json({
      success: true,
      data: {
        id: serviceRequest.id,
        status: serviceRequest.status,
        serviceType: serviceRequest.serviceType,
        issue: serviceRequest.issue,
        assignedProfessionalName: serviceRequest.assignedProfessionalName,
        confirmedDate: serviceRequest.confirmedDate,
        confirmedTimeSlot: serviceRequest.confirmedTimeSlot,
        adminNotes: serviceRequest.adminNotes,
      },
    });
  } catch (error) {
    console.error("[API] Error fetching request status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch request status" },
      { status: 500 }
    );
  }
}

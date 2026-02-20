import { NextRequest, NextResponse } from "next/server";
import {
  getServiceRequests,
  getRequestCounts,
  type RequestStatus,
} from "@/lib/db/service-requests";

// GET /api/admin/requests - List all service requests
export async function GET(request: NextRequest) {
  try {

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as RequestStatus | null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    const [requests, counts] = await Promise.all([
      getServiceRequests({
        status: status || undefined,
        limit,
        offset,
      }),
      getRequestCounts(),
    ]);

    return NextResponse.json({
      success: true,
      data: requests,
      counts,
      pagination: {
        limit,
        offset,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      },
    });
  } catch (error) {
    console.error("[API] Error fetching requests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

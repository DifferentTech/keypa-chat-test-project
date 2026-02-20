import { createTool } from "@voltagent/core";
import { z } from "zod";
import {
  createServiceRequest,
  getServiceRequests,
  type ServiceType,
  type Urgency,
  type TimeSlot,
} from "@/lib/db/service-requests";
import { professionals } from "@/lib/professionals";

export const scheduleProfessionalTool = createTool({
  name: "schedule_professional",
  description: `Schedules a professional service (plumber, electrician, HVAC technician, or general handyman) for home maintenance or repairs.
Creates a pending request that must be approved by an administrator.

IMPORTANT:
- Only call this tool when the user EXPLICITLY asks to schedule or book a professional.
- Do NOT call this tool for acknowledgments like "thanks", "ok", or "yes".
- Before calling, ensure you have the issue description and urgency level.`,
  parameters: z.object({
    serviceType: z
      .enum(["plumbing", "electrical", "hvac", "general"])
      .describe("Type of professional service needed"),
    issue: z.string().describe("Description of the issue or work needed"),
    preferredDate: z.string().optional().describe("Preferred date for the service (YYYY-MM-DD format)"),
    preferredTimeSlot: z
      .enum(["morning", "afternoon", "evening"])
      .optional()
      .describe("Preferred time of day"),
    urgency: z
      .enum(["low", "medium", "high", "emergency"])
      .describe("How urgent is the request"),
    // User info (passed from context)
    userId: z.string().describe("User ID"),
    userName: z.string().describe("User's full name"),
    userEmail: z.string().describe("User's email"),
    userPhone: z.string().describe("User's phone number"),
    propertyId: z.string().describe("Property ID"),
    propertyAddress: z.string().describe("Property address"),
  }),
  execute: async ({
    serviceType,
    issue,
    preferredDate,
    preferredTimeSlot,
    urgency,
    userId,
    userName,
    userEmail,
    userPhone,
    propertyId,
    propertyAddress,
  }) => {
    try {
      // Check if user already has a pending request
      const existingRequests = await getServiceRequests({
        userId,
        status: "pending",
      });

      if (existingRequests.length > 0) {
        const existing = existingRequests[0];
        return {
          success: false,
          alreadyPending: true,
          requestId: existing.id,
          message: `You already have a pending service request (${existing.id}) for ${existing.serviceType}. Please wait for admin approval.`,
        };
      }

      // Create the service request in the database
      const request = await createServiceRequest({
        userId,
        userName,
        userEmail,
        userPhone,
        propertyId,
        propertyAddress,
        serviceType: serviceType as ServiceType,
        issue,
        urgency: urgency as Urgency,
        preferredDate,
        preferredTimeSlot: preferredTimeSlot as TimeSlot | undefined,
      });

      console.log(`[ScheduleProfessional] Created request ${request.id}`);

      // Get available professionals for display
      const availableProfessionals = professionals[serviceType as keyof typeof professionals] || professionals.general;

      return {
        success: true,
        requestId: request.id,
        status: "pending",
        serviceType,
        issue,
        preferredDate,
        preferredTimeSlot,
        urgency,
        propertyAddress,
        availableProfessionals: availableProfessionals.map(p => ({
          name: p.name,
          rating: p.rating,
          reviews: p.reviews,
          priceRange: p.priceRange,
        })),
      };
    } catch (error) {
      console.error("[ScheduleProfessional] Error creating request:", error);
      return {
        success: false,
        error: "Failed to create service request. Please try again.",
      };
    }
  },
});

// Tool to check request status
export const checkRequestStatusTool = createTool({
  name: "check_request_status",
  description: "Check the status of a user's service requests. Use this when the user asks about their request status.",
  parameters: z.object({
    userId: z.string().describe("User ID to check requests for"),
    requestId: z.string().optional().describe("Specific request ID to check (optional)"),
  }),
  execute: async ({ userId, requestId }) => {
    try {
      const requests = await getServiceRequests({ userId });

      if (requests.length === 0) {
        return {
          success: true,
          hasRequests: false,
          message: "You don't have any service requests yet.",
        };
      }

      // If specific request ID provided, find it
      if (requestId) {
        const request = requests.find((r) => r.id === requestId);
        if (request) {
          return {
            success: true,
            request: {
              id: request.id,
              status: request.status,
              serviceType: request.serviceType,
              issue: request.issue,
              assignedProfessionalName: request.assignedProfessionalName,
              confirmedDate: request.confirmedDate,
              confirmedTimeSlot: request.confirmedTimeSlot,
              adminNotes: request.adminNotes,
            },
          };
        }
      }

      // Return most recent request
      const latest = requests[0];
      return {
        success: true,
        request: {
          id: latest.id,
          status: latest.status,
          serviceType: latest.serviceType,
          issue: latest.issue,
          assignedProfessionalName: latest.assignedProfessionalName,
          confirmedDate: latest.confirmedDate,
          confirmedTimeSlot: latest.confirmedTimeSlot,
          adminNotes: latest.adminNotes,
        },
      };
    } catch (error) {
      console.error("[CheckRequestStatus] Error:", error);
      return {
        success: false,
        error: "Failed to check request status.",
      };
    }
  },
});

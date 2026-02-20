import { createWorkflowChain } from "@voltagent/core";
import { z } from "zod";
import {
  createServiceRequest,
  updateServiceRequest,
  getServiceRequest,
  type ServiceType,
  type Urgency,
  type TimeSlot,
} from "@/lib/db/service-requests";
import { professionals } from "@/lib/professionals";
import { sharedMemory } from "@/lib/memory";

// Input schema for starting the workflow
const serviceRequestInput = z.object({
  // User info
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  userPhone: z.string(),
  // Property info
  propertyId: z.string(),
  propertyAddress: z.string(),
  // Service details
  serviceType: z.enum(["plumbing", "electrical", "hvac", "general"]),
  issue: z.string(),
  urgency: z.enum(["low", "medium", "high", "emergency"]),
  preferredDate: z.string().optional(),
  preferredTimeSlot: z.enum(["morning", "afternoon", "evening"]).optional(),
});

// Output schema for the workflow result
const serviceRequestResult = z.object({
  requestId: z.string(),
  status: z.enum(["approved", "rejected"]),
  message: z.string(),
  // Approval details (if approved)
  professionalName: z.string().optional(),
  confirmedDate: z.string().optional(),
  confirmedTimeSlot: z.string().optional(),
  // Rejection details (if rejected)
  rejectionReason: z.string().optional(),
});

// Create the service request workflow chain with human-in-the-loop
const serviceRequestWorkflowChain = createWorkflowChain({
  id: "service-request",
  name: "Service Request Workflow",
  purpose: "Process service requests with admin approval for scheduling professionals",
  input: serviceRequestInput,
  result: serviceRequestResult,
  // Memory is required for suspend/resume to work
  memory: sharedMemory,
})
  // Step 1: Create the service request in the database
  .andThen({
    id: "create-request",
    execute: async ({ data }) => {
      try {
        console.log(`[Workflow] Step 1: Creating service request for user ${data.userId}`);

        const request = await createServiceRequest({
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          userPhone: data.userPhone,
          propertyId: data.propertyId,
          propertyAddress: data.propertyAddress,
          serviceType: data.serviceType as ServiceType,
          issue: data.issue,
          urgency: data.urgency as Urgency,
          preferredDate: data.preferredDate,
          preferredTimeSlot: data.preferredTimeSlot as TimeSlot | undefined,
        });

        console.log(`[Workflow] Step 1: Created request ${request.id}`);

        // Get available professionals for context
        const availableProfessionals =
          professionals[data.serviceType as keyof typeof professionals] ||
          professionals.general;

        const result = {
          ...data,
          requestId: request.id,
          availableProfessionals: availableProfessionals.map((p) => ({
            id: p.id,
            name: p.name,
            rating: p.rating,
          })),
        };

        console.log(`[Workflow] Step 1 complete, returning with requestId: ${request.id}`);
        return result;
      } catch (error) {
        console.error(`[Workflow] Step 1 ERROR:`, error);
        throw error;
      }
    },
  })

  // Step 2: Wait for admin approval (SUSPEND here)
  .andThen({
    id: "await-approval",
    // Define what data we expect when admin resumes the workflow
    resumeSchema: z.object({
      approved: z.boolean(),
      // If approved
      professionalId: z.string().optional(),
      professionalName: z.string().optional(),
      confirmedDate: z.string().optional(),
      confirmedTimeSlot: z.string().optional(),
      // Admin notes (for both approve/reject)
      adminNotes: z.string().optional(),
      processedBy: z.string().optional(),
    }),
    execute: async ({ data, suspend, resumeData }) => {
      console.log(`[Workflow] Step 2: Starting await-approval step, requestId: ${data.requestId}`);
      console.log(`[Workflow] Step 2: resumeData:`, resumeData);

      // If we're resuming with admin's decision
      if (resumeData) {
        console.log(`[Workflow] Step 2: Resumed with admin decision: ${resumeData.approved ? "approved" : "rejected"}`);

        // Update the service request in the database
        await updateServiceRequest(data.requestId, {
          status: resumeData.approved ? "approved" : "rejected",
          assignedProfessionalId: resumeData.professionalId,
          assignedProfessionalName: resumeData.professionalName,
          confirmedDate: resumeData.confirmedDate,
          confirmedTimeSlot: resumeData.confirmedTimeSlot,
          adminNotes: resumeData.adminNotes,
          processedBy: resumeData.processedBy || "admin",
        });

        return {
          ...data,
          approved: resumeData.approved,
          professionalId: resumeData.professionalId,
          professionalName: resumeData.professionalName,
          confirmedDate: resumeData.confirmedDate,
          confirmedTimeSlot: resumeData.confirmedTimeSlot,
          adminNotes: resumeData.adminNotes,
        };
      }

      // Suspend workflow and wait for admin approval
      console.log(`[Workflow] Step 2: About to SUSPEND for request ${data.requestId}`);

      await suspend("Waiting for admin approval", {
        requestId: data.requestId,
        userId: data.userId,
        userName: data.userName,
        serviceType: data.serviceType,
        issue: data.issue,
        urgency: data.urgency,
        preferredDate: data.preferredDate,
        preferredTimeSlot: data.preferredTimeSlot,
        propertyAddress: data.propertyAddress,
        availableProfessionals: data.availableProfessionals,
      });

      // This should not be reached on first run - workflow suspends above
      console.log(`[Workflow] Step 2: AFTER suspend (should not see this on first run)`);
      return data;
    },
  })

  // Step 3: Format the final result
  .andThen({
    id: "format-result",
    execute: async ({ data, getStepData }) => {
      const timeSlotLabels: Record<string, string> = {
        morning: "Morning (9AM - 12PM)",
        afternoon: "Afternoon (12PM - 5PM)",
        evening: "Evening (5PM - 8PM)",
      };

      // Get approval data from previous step
      const approvalData = getStepData("await-approval")?.output as {
        approved?: boolean;
        professionalName?: string;
        confirmedDate?: string;
        confirmedTimeSlot?: string;
        adminNotes?: string;
      } | undefined;

      const approved = approvalData?.approved ?? false;
      const professionalName = approvalData?.professionalName;
      const confirmedDate = approvalData?.confirmedDate;
      const confirmedTimeSlot = approvalData?.confirmedTimeSlot;
      const adminNotes = approvalData?.adminNotes;

      if (approved) {
        return {
          requestId: data.requestId,
          status: "approved" as const,
          message: `Great news! Your service request has been approved.

**Appointment Details:**
- **Professional**: ${professionalName}
- **Date**: ${confirmedDate}
- **Time**: ${timeSlotLabels[confirmedTimeSlot || "morning"] || confirmedTimeSlot}
- **Service**: ${data.serviceType}
- **Location**: ${data.propertyAddress}

${adminNotes ? `**Note from admin**: ${adminNotes}` : ""}

The professional will contact you to confirm the appointment. If you need to reschedule, please let me know!`,
          professionalName,
          confirmedDate,
          confirmedTimeSlot,
        };
      } else {
        return {
          requestId: data.requestId,
          status: "rejected" as const,
          message: `I'm sorry, but your service request could not be approved at this time.

${adminNotes ? `**Reason**: ${adminNotes}` : ""}

Would you like me to help you submit a new request or find alternative solutions?`,
          rejectionReason: adminNotes,
        };
      }
    },
  });

// Convert the workflow chain to a workflow for registration with VoltAgent
export const serviceRequestWorkflow = serviceRequestWorkflowChain.toWorkflow();

export type ServiceRequestInput = z.infer<typeof serviceRequestInput>;
export type ServiceRequestResult = z.infer<typeof serviceRequestResult>;

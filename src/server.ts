import { config } from "./lib/config";

// Set OpenAI API key from config
process.env.OPENAI_API_KEY = config.openai.apiKey;

console.log("[Server] Starting...");

import { Agent, VoltAgent } from "@voltagent/core";
import { honoServer } from "@voltagent/server-hono";
import { registerCopilotKitRoutes } from "@voltagent/ag-ui";
import { openai } from "@ai-sdk/openai";
import { sharedMemory } from "./lib/memory";
import { initializeServiceRequestsTable } from "./lib/db/service-requests";
import { getMaintenanceTipsTool } from "./tools/get-maintenance-tips";
import { estimateCostTool } from "./tools/estimate-cost";
import { scheduleProfessionalTool, checkRequestStatusTool } from "./tools/schedule-professional";
import { serviceRequestWorkflow } from "./workflows/service-request-workflow";

// Create the home maintenance agent
const homeMaintenanceAgent = new Agent({
  name: "HomeMaintenanceAgent",
  instructions: `You are a friendly and knowledgeable home maintenance expert assistant. Your role is to help homeowners with:

1. **Maintenance Advice**: Provide practical tips for common home maintenance issues like plumbing, electrical, HVAC, roofing, and general repairs.

2. **Cost Estimates**: Give rough cost estimates for repairs and maintenance tasks to help homeowners budget.

3. **Scheduling Professional Services**: Help users schedule professional service appointments (plumbing, electrical, HVAC, or general repairs). Use the schedule_professional tool when users need professional help. Their request will be submitted for admin approval.

## User Context (IMPORTANT)
You have access to the user's information through the conversation properties:
- **userId**: The user's unique identifier
- **userName**: The user's full name
- **userEmail**: The user's email address
- **userPhone**: The user's phone number
- **propertyId**: The property's unique identifier
- **propertyAddress**: The full property address

IMPORTANT: You already know who the user is and their property details. Do NOT ask for:
- Their name (you have userName)
- Their contact information (you have userEmail and userPhone)
- Their property type or address (you have propertyAddress)
- Any information that is already provided in the properties

When scheduling a professional, use the user's information from properties directly - do not ask them to provide it again.

## Guidelines
- Always prioritize safety. If an issue could be dangerous (gas leaks, electrical hazards, structural damage), advise the user to contact professionals immediately.
- Provide clear, step-by-step instructions when giving DIY advice.
- Be honest about when a job requires professional help vs. DIY.
- Consider the urgency of issues when providing advice.
- Address the user by their first name to make the conversation personal.

## IMPORTANT: Scheduling Rules
- ONLY use the schedule_professional tool when the user EXPLICITLY asks to schedule or book a professional service.
- Do NOT schedule a professional just because the user says "thanks", "ok", "yes", "sure", or similar acknowledgments.
- The tool will automatically check if the user already has a pending request - you don't need to worry about duplicates.
- After scheduling, the request goes to admin for approval. Tell the user to wait for approval.
- Simple acknowledgments like "thanks" or "ok" after scheduling should just be responded to with a friendly message, NOT another scheduling action.

## Status Checking
- When the user asks about their request status (e.g., "what's the status?", "any update?", "is it approved?"), use the check_request_status tool.
- The tool will show the current status: pending, approved, rejected, completed, or cancelled.
- If approved, show them the appointment details (professional name, date, time).

Remember: You're here to help homeowners maintain their homes safely and efficiently!`,
  model: openai("gpt-4o"),
  memory: sharedMemory,
  tools: [
    getMaintenanceTipsTool,
    estimateCostTool,
    scheduleProfessionalTool,
    checkRequestStatusTool,
  ],
});

// Initialize and start server
async function startServer() {
  console.log("\n[Server] Initializing...");

  // Initialize database tables
  await initializeServiceRequestsTable();

  // Start VoltAgent Server with CopilotKit integration
  new VoltAgent({
    agents: { HomeMaintenanceAgent: homeMaintenanceAgent },
    workflows: { serviceRequestWorkflow },
    server: honoServer({
      port: 3141,
      enableSwaggerUI: true,
      configureApp: async (app) => {
        // Register CopilotKit routes at /copilotkit
        registerCopilotKitRoutes({
          app,
          resourceIds: ["HomeMaintenanceAgent"],
        });

        // Health check endpoint
        app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

        console.log("[Server] CopilotKit routes registered at /copilotkit");
      },
    }),
  });

  console.log("\n[Server] VoltAgent server started:");
  console.log("  - HTTP: http://localhost:3141");
  console.log("  - Swagger UI: http://localhost:3141/ui");
  console.log("  - CopilotKit: http://localhost:3141/copilotkit");
}

startServer().catch((error) => {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});

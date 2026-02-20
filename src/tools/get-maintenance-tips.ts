import { createTool } from "@voltagent/core";
import { z } from "zod";

const maintenanceTipsDatabase: Record<string, { tips: string[]; urgency: string; diyFriendly: boolean }> = {
  "leaky faucet": {
    tips: [
      "Turn off the water supply under the sink before starting any repair.",
      "Check if the leak is from the spout or the base - this determines the fix needed.",
      "For a dripping spout, the washer or O-ring usually needs replacement.",
      "Remove the handle (usually a screw under a decorative cap) to access internal parts.",
      "Take the old washer/O-ring to the hardware store to find an exact match.",
      "Apply plumber's grease to new O-rings before installation.",
      "Reassemble in reverse order and turn water back on slowly to test.",
    ],
    urgency: "low",
    diyFriendly: true,
  },
  "clogged drain": {
    tips: [
      "Try a plunger first - it works for most minor clogs.",
      "For bathroom drains, remove the stopper and clean out hair buildup.",
      "Use a drain snake for deeper clogs - insert and rotate to break up debris.",
      "Avoid chemical drain cleaners as they can damage pipes over time.",
      "For kitchen sinks, check and clean the P-trap under the sink.",
      "Pour boiling water down drains weekly as preventive maintenance.",
      "If multiple drains are slow, you may have a main line issue - call a plumber.",
    ],
    urgency: "medium",
    diyFriendly: true,
  },
  "hvac maintenance": {
    tips: [
      "Replace air filters every 1-3 months depending on usage and filter type.",
      "Keep outdoor AC unit clear of debris, leaves, and vegetation (2ft clearance).",
      "Schedule professional maintenance twice yearly - spring for AC, fall for heating.",
      "Clean supply and return vents regularly to ensure proper airflow.",
      "Check thermostat batteries annually and consider upgrading to a smart thermostat.",
      "Listen for unusual sounds - rattling, squealing, or grinding indicate problems.",
      "Ensure all vents are open and unobstructed by furniture.",
    ],
    urgency: "low",
    diyFriendly: true,
  },
  "water heater": {
    tips: [
      "Set temperature to 120°F to prevent scalding and save energy.",
      "Drain 1-2 gallons from the tank every few months to remove sediment.",
      "Test the pressure relief valve annually - lift and release the lever.",
      "Check for rust or corrosion around fittings and connections.",
      "Insulate older water heaters with a blanket to improve efficiency.",
      "Know the age of your unit - most last 8-12 years.",
      "If you notice rusty water or rumbling sounds, replacement may be needed soon.",
    ],
    urgency: "medium",
    diyFriendly: false,
  },
  "roof inspection": {
    tips: [
      "Inspect your roof twice a year - spring and fall - from the ground with binoculars.",
      "Look for missing, cracked, or curling shingles.",
      "Check flashing around chimneys, vents, and skylights for gaps or damage.",
      "Clean gutters and downspouts to prevent water backup and ice dams.",
      "Trim tree branches that hang over the roof.",
      "Check the attic for signs of leaks - water stains, mold, or daylight.",
      "After severe storms, do a quick visual inspection for damage.",
    ],
    urgency: "low",
    diyFriendly: false,
  },
  "electrical issues": {
    tips: [
      "SAFETY FIRST: If you smell burning or see sparks, turn off the main breaker and call an electrician immediately.",
      "Frequently tripping breakers indicate an overloaded circuit - reduce load or have circuits added.",
      "Flickering lights throughout the house may indicate a main connection issue.",
      "Test GFCI outlets monthly by pressing the test button.",
      "Never use extension cords as permanent wiring solutions.",
      "Warm outlets or switch plates are warning signs - have them inspected.",
      "Most electrical work requires permits and should be done by licensed electricians.",
    ],
    urgency: "high",
    diyFriendly: false,
  },
  default: {
    tips: [
      "Document the issue with photos and notes for professional consultations.",
      "Research the problem to understand what might be involved in fixing it.",
      "Get multiple quotes if hiring a professional.",
      "Check if the issue is covered under any home warranty or insurance.",
      "Prioritize safety - when in doubt, consult a professional.",
    ],
    urgency: "medium",
    diyFriendly: false,
  },
};

export const getMaintenanceTipsTool = createTool({
  name: "get_maintenance_tips",
  description:
    "Provides practical maintenance tips and advice for common home maintenance issues. Use this when a user asks about how to handle or fix a home maintenance problem.",
  parameters: z.object({
    issue: z.string().describe("The home maintenance issue to get tips for (e.g., 'leaky faucet', 'clogged drain', 'hvac maintenance')"),
    homeType: z.enum(["house", "apartment", "condo", "townhouse"]).optional().describe("The type of home, which may affect advice"),
  }),
  execute: async ({ issue, homeType }) => {
    // Normalize the issue for lookup
    const normalizedIssue = issue.toLowerCase().trim();

    // Find matching tips or use default
    let matchedKey = "default";
    for (const key of Object.keys(maintenanceTipsDatabase)) {
      if (normalizedIssue.includes(key) || key.includes(normalizedIssue)) {
        matchedKey = key;
        break;
      }
    }

    const data = maintenanceTipsDatabase[matchedKey];

    // Add home-type specific notes if applicable
    let additionalNotes: string[] = [];
    if (homeType === "apartment" || homeType === "condo") {
      additionalNotes = [
        "Note: Since you live in a multi-unit building, check your lease or HOA rules before making repairs.",
        "Some repairs may need to be handled by building maintenance or require approval.",
      ];
    }

    return {
      issue: normalizedIssue,
      matchedCategory: matchedKey === "default" ? "general" : matchedKey,
      tips: data.tips,
      urgency: data.urgency,
      diyFriendly: data.diyFriendly,
      additionalNotes,
      disclaimer: "These tips are for informational purposes. Always prioritize safety and consult professionals for complex or dangerous repairs.",
    };
  },
});

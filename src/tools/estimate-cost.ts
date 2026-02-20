import { createTool } from "@voltagent/core";
import { z } from "zod";

type CostEstimate = {
  lowDiy: number;
  highDiy: number;
  lowPro: number;
  highPro: number;
  laborHours: string;
  factors: string[];
};

const costDatabase: Record<string, CostEstimate> = {
  "leaky faucet": {
    lowDiy: 10,
    highDiy: 30,
    lowPro: 150,
    highPro: 300,
    laborHours: "0.5-1",
    factors: [
      "Type of faucet (single vs double handle)",
      "Parts needed (washer, cartridge, or entire faucet)",
      "Accessibility of plumbing",
    ],
  },
  "clogged drain": {
    lowDiy: 15,
    highDiy: 50,
    lowPro: 100,
    highPro: 350,
    laborHours: "0.5-2",
    factors: [
      "Location and severity of clog",
      "Need for specialized equipment (snake vs hydro-jetting)",
      "Main line vs fixture drain",
    ],
  },
  "water heater replacement": {
    lowDiy: 400,
    highDiy: 800,
    lowPro: 800,
    highPro: 2500,
    laborHours: "2-4",
    factors: [
      "Tank vs tankless unit",
      "Gas vs electric",
      "Capacity (gallons)",
      "Code compliance updates needed",
    ],
  },
  "hvac service": {
    lowDiy: 20,
    highDiy: 100,
    lowPro: 100,
    highPro: 300,
    laborHours: "1-2",
    factors: [
      "Type of service (tune-up vs repair)",
      "Parts replacement needed",
      "System age and condition",
    ],
  },
  "hvac replacement": {
    lowDiy: 0,
    highDiy: 0,
    lowPro: 5000,
    highPro: 15000,
    laborHours: "8-16",
    factors: [
      "System size (tonnage)",
      "Efficiency rating (SEER)",
      "Ductwork modifications needed",
      "Brand and warranty options",
    ],
  },
  "roof repair": {
    lowDiy: 50,
    highDiy: 300,
    lowPro: 300,
    highPro: 1500,
    laborHours: "2-8",
    factors: [
      "Extent of damage",
      "Roof accessibility and pitch",
      "Material type (asphalt, metal, tile)",
      "Flashing or structural repairs needed",
    ],
  },
  "roof replacement": {
    lowDiy: 0,
    highDiy: 0,
    lowPro: 8000,
    highPro: 25000,
    laborHours: "16-40",
    factors: [
      "Roof size (square footage)",
      "Material choice",
      "Removal of old roofing",
      "Structural repairs needed",
    ],
  },
  "electrical outlet": {
    lowDiy: 10,
    highDiy: 30,
    lowPro: 100,
    highPro: 250,
    laborHours: "0.5-1.5",
    factors: [
      "Type of outlet (standard, GFCI, smart)",
      "Wiring condition",
      "Permit requirements",
    ],
  },
  "electrical panel upgrade": {
    lowDiy: 0,
    highDiy: 0,
    lowPro: 1500,
    highPro: 4000,
    laborHours: "6-10",
    factors: [
      "Panel amperage (100A, 200A, 400A)",
      "Permit and inspection fees",
      "Utility company coordination",
    ],
  },
  "toilet repair": {
    lowDiy: 15,
    highDiy: 50,
    lowPro: 100,
    highPro: 250,
    laborHours: "0.5-2",
    factors: [
      "Type of repair (flapper, fill valve, wax ring)",
      "Toilet age and condition",
      "Water damage assessment",
    ],
  },
  "toilet replacement": {
    lowDiy: 150,
    highDiy: 400,
    lowPro: 300,
    highPro: 800,
    laborHours: "1-3",
    factors: [
      "Toilet style and features",
      "Rough-in size compatibility",
      "Disposal of old unit",
    ],
  },
  default: {
    lowDiy: 25,
    highDiy: 200,
    lowPro: 100,
    highPro: 500,
    laborHours: "1-4",
    factors: [
      "Scope and complexity of work",
      "Parts and materials needed",
      "Local labor rates",
      "Permits if required",
    ],
  },
};

export const estimateCostTool = createTool({
  name: "estimate_cost",
  description:
    "Provides rough cost estimates for home repair and maintenance tasks. Use this when a user wants to know how much a repair might cost.",
  parameters: z.object({
    task: z.string().describe("The repair or maintenance task to estimate cost for"),
    isDiy: z.boolean().optional().describe("Whether the user plans to DIY or hire a professional"),
    region: z.enum(["low_cost", "average", "high_cost"]).optional().describe("Cost of living in the area (affects labor rates)"),
  }),
  execute: async ({ task, isDiy, region = "average" }) => {
    // Normalize the task for lookup
    const normalizedTask = task.toLowerCase().trim();

    // Find matching cost data or use default
    let matchedKey = "default";
    for (const key of Object.keys(costDatabase)) {
      if (normalizedTask.includes(key) || key.includes(normalizedTask)) {
        matchedKey = key;
        break;
      }
    }

    const data = costDatabase[matchedKey];

    // Apply regional multiplier
    const regionMultiplier = {
      low_cost: 0.8,
      average: 1.0,
      high_cost: 1.4,
    }[region];

    const adjustedLowDiy = Math.round(data.lowDiy * regionMultiplier);
    const adjustedHighDiy = Math.round(data.highDiy * regionMultiplier);
    const adjustedLowPro = Math.round(data.lowPro * regionMultiplier);
    const adjustedHighPro = Math.round(data.highPro * regionMultiplier);

    // Check if DIY is possible
    const diyPossible = data.lowDiy > 0;

    return {
      task: normalizedTask,
      matchedCategory: matchedKey === "default" ? "general estimate" : matchedKey,
      estimates: {
        diy: diyPossible
          ? {
              low: adjustedLowDiy,
              high: adjustedHighDiy,
              currency: "USD",
              note: "Materials and tools only",
            }
          : null,
        professional: {
          low: adjustedLowPro,
          high: adjustedHighPro,
          currency: "USD",
          note: "Includes labor and materials",
        },
      },
      laborHours: data.laborHours,
      costFactors: data.factors,
      region,
      recommendation: isDiy !== undefined
        ? isDiy && diyPossible
          ? "DIY can save you money if you're comfortable with the task."
          : "Hiring a professional ensures the job is done correctly and safely."
        : diyPossible
          ? "Consider your skill level and available time when deciding between DIY and professional help."
          : "This task is recommended for professional service only.",
      disclaimer:
        "These are rough estimates based on national averages. Actual costs may vary based on specific circumstances, local rates, and market conditions.",
    };
  },
});

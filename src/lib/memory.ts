import { Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter } from "@voltagent/libsql";
import { z } from "zod";
import { config } from "./config";

// Schema for user context stored in working memory
export const userContextSchema = z.object({
  user: z.object({
    userId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    memberSince: z.string(),
    preferredContactMethod: z.enum(["email", "phone", "text"]),
  }),
  property: z.object({
    propertyId: z.string(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      fullAddress: z.string(),
    }),
    propertyType: z.string(),
    yearBuilt: z.number(),
    squareFeet: z.number(),
    bedrooms: z.number(),
    bathrooms: z.number(),
  }),
});

export type UserContextData = z.infer<typeof userContextSchema>;

const storage = new LibSQLMemoryAdapter({
  url: config.turso.url,
  authToken: config.turso.authToken,
});

export const sharedMemory = new Memory({
  storage,
  workingMemory: {
    enabled: true,
    scope: "conversation",
    schema: userContextSchema,
  },
});

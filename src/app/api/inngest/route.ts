import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateArchitectureFunction, generateReverseArchitectureFunction, regenerateReverseArchitectureFunction } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateArchitectureFunction,
    generateReverseArchitectureFunction,
    regenerateReverseArchitectureFunction
  ],
});
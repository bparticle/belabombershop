import { PrintfulClient } from "printful-request";
import { getEnv } from "./env-validation";

// Validate environment variables early
const env = getEnv();

export const printful = new PrintfulClient(env.PRINTFUL_API_KEY);

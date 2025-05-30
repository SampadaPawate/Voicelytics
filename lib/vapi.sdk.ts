import Vapi from "@vapi-ai/web";

// Make sure the VAPI token is available
const VAPI_TOKEN = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (!VAPI_TOKEN) {
  console.error("VAPI Web Token is not defined in environment variables. Please check your .env.local file.");
}

// Initialize VAPI with the token
export const vapi = new Vapi(VAPI_TOKEN || "");

// Export a function to check if VAPI is properly configured
export const isVapiConfigured = () => !!VAPI_TOKEN;

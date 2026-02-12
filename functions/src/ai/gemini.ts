import * as functions from "firebase-functions";
import {GoogleGenerativeAI} from "@google/generative-ai";

export function getGeminiApiKey(): string {
  const apiKey =
    functions.config().gemini?.api_key ||
    functions.config().google?.ai_api_key ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    "";

  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  return apiKey;
}

export function getGeminiModel(model: string) {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  return genAI.getGenerativeModel({model});
}

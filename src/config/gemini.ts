import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("⚠️ [Gemini Config] GEMINI_API_KEY is not defined in environment variables. AI features may use heuristic fallback.");
}

export const geminiClient = new GoogleGenAI({ apiKey });

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

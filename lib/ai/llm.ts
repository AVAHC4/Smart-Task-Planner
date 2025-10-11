import { generateObject } from "ai"
import { LlmDraftSchema } from "../schema"
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt"
import { google } from "@ai-sdk/google"

export async function generateDraftFromGoal(
  goal: string,
  constraints?: {
    deadline?: string
    timeboxDays?: number
    workDays?: string[]
    hoursPerDay?: number
    timezone?: string
  },
) {
  const schema = LlmDraftSchema

  const { object } = await generateObject({
    model: google("gemini-2.5-flash-lite-preview-06-17"),
    schema,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(goal, constraints) },
    ],
    maxOutputTokens: 2000,
    temperature: 0.3,
  })

  
  return object
}

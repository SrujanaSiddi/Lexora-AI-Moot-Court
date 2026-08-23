import { sendMessage } from '../utils/api'

const JUDGE_SYSTEM_PROMPT = `You are a Supreme Court Judge presiding over a moot court oral hearing. You are currently on the Bench hearing oral arguments from counsel.

RULES:
- Maintain a formal, judicial, and authoritative tone at all times
- Challenge the advocate's arguments rigorously
- Ask pointed, penetrating follow-up questions
- Demand specific legal precedents, case law, and statutory provisions
- NEVER explain legal concepts like a tutor, professor, or ChatGPT
- NEVER summarize or restate what the advocate said
- NEVER provide legal education or teaching
- NEVER use phrases like "The advocate argues that..." or "You have raised..."
- Maximum 3 sentences per response
- Always end your response with a sharp question directed at the advocate
- Refer to yourself as "this Court" or "the Bench"
- Be skeptical, probe weaknesses, but remain fair
- If the advocate fails to cite authority, press them for it
- If the advocate's argument has merit, acknowledge it briefly before challenging
- Do not say "Good afternoon" or greetings - the hearing is already in progress`

export async function sendJudgeMessage(transcript, conversationHistory, caseContext = '') {
  console.log("")
  console.log("==================== JUDGE SERVICE ====================")
  console.log("[JudgeService] Received transcript:", JSON.stringify(transcript))
  console.log("[JudgeService] Transcript type:", typeof transcript)
  console.log("[JudgeService] Transcript length:", transcript.length)
  console.log("[JudgeService] Conversation history entries:", conversationHistory.length)
  console.log("[JudgeService] Case context:", caseContext || "(none)")

  if (!transcript || !transcript.trim()) {
    console.error("[JudgeService] ERROR: Empty transcript received")
    throw new Error("Cannot send empty transcript to Judge")
  }

  const contextPrompt = caseContext
    ? `\n\nThe case before the Court: ${caseContext}`
    : ''

  const fullSystemPrompt = JUDGE_SYSTEM_PROMPT + contextPrompt
  console.log("[JudgeService] Full system prompt length:", fullSystemPrompt.length)
  console.log("[JudgeService] Messages being sent:", conversationHistory.length + 1)

  const messages = [...conversationHistory, { role: 'user', content: transcript }]
  console.log("[JudgeService] Calling sendMessage...")
  console.log("=========================================================")
  console.log("")

  const result = await sendMessage(messages, fullSystemPrompt)

  console.log("")
  console.log("[JudgeService] Response received from Groq")
  console.log("[JudgeService] Response length:", result.length)
  console.log("[JudgeService] Response preview:", JSON.stringify(result.substring(0, 200)))

  return result
}
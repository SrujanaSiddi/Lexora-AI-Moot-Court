const GEMINI_API_KEY = "AQ.Ab8RN6Im9Wo72Qd4wvWW6sIXyc6_vHkfiSRMB1pgECurlKEOpA"
const GEMINI_MODEL = "gemini-3.1-flash-lite"
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export async function sendMessage(messages, systemPrompt = "") {
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }))

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  }

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }],
    }
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

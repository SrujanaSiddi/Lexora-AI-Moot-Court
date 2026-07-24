const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_MODEL = "llama-3.1-8b-instant"
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function sendMessage(messages, systemPrompt = "") {
  const formattedMessages = []
  
  if (systemPrompt) {
    formattedMessages.push({
      role: "system",
      content: systemPrompt,
    })
  }
  
  messages.forEach((msg) => {
    formattedMessages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })
  })

  const body = {
    model: GROQ_MODEL,
    messages: formattedMessages,
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 1024,
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export async function saveChatMessage(sessionId, role, content) {
  console.log('[DB] saveChatMessage:', { sessionId, role, content })
  return { id: Date.now().toString(), sessionId, role, content, created_at: new Date().toISOString() }
}

export async function createSession(caseTitle, caseArea) {
  console.log('[DB] createSession:', { caseTitle, caseArea })
  return { id: Date.now().toString(), caseTitle, caseArea, created_at: new Date().toISOString() }
}

export async function getChatHistory(sessionId) {
  console.log('[DB] getChatHistory:', { sessionId })
  return []
}
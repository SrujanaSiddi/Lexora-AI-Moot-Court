import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { sendMessage } from '../utils/api'
import './Practice.css'

const SYSTEM_PROMPT = `You are Lexora, an AI MootCourt coach and mentor for law students preparing for moot court competitions. You are a strict but encouraging legal mentor.

FLOW RULES (follow this exact sequence):
1. WELCOME: Greet the student, explain the process briefly.
2. ISSUES PHASE: Ask the student to identify legal issues in the proposition. If they get some right, appreciate and prompt for more. If they are wrong or miss issues, give HINTS only (never reveal directly). Example hint: "Think about procedural fairness aspects" or "Consider constitutional remedies available."
3. LAWS PHASE: After issues are identified, ask the student to identify applicable laws, constitutional provisions, and statutes. Same hint approach - guide them but do not reveal directly.
4. DOUBTS PHASE: Allow the student to ask any questions about the case, laws, or legal concepts. Answer thoroughly.
5. MEMORIAL PHASE: Ask the student to upload or paste their memorial for review. Analyze it for: legal reasoning, argument structure, use of statutes, use of precedents, IRAC format, grammar, and legal language.

CRITICAL RULES:
- NEVER reveal answers directly unless the student explicitly asks "reveal" or after 3 failed attempts.
- When giving hints, be specific enough to guide but not so specific that it gives away the answer.
- Use phrases like "Think about...", "Consider whether...", "What about the aspect of..."
- If the student says "reveal" or "show me" or "I give up", then reveal the answer clearly.
- Be professional, use proper legal terminology.
- Format responses with clear paragraphs and bullet points where appropriate.
- Track what phase the conversation is in based on the context.`

const PHASES = ['welcome', 'issues', 'laws', 'doubts', 'memorial', 'feedback']

export default function Practice({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const caseData = location.state?.caseData
  const uploadedFile = location.state?.uploadedFile
  const fromUpload = location.state?.fromUpload

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('welcome')
  const [issueAttempts, setIssueAttempts] = useState(0)
  const [lawAttempts, setLawAttempts] = useState(0)
  const [showRevealIssues, setShowRevealIssues] = useState(false)
  const [showRevealLaws, setShowRevealLaws] = useState(false)
  const [issuesRevealed, setIssuesRevealed] = useState(false)
  const [lawsRevealed, setLawsRevealed] = useState(false)
  const [memorialText, setMemorialText] = useState('')
  const [showMemorialInput, setShowMemorialInput] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const initializedRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getWelcomeMessage = useCallback(() => {
    if (fromUpload) {
      return `Welcome, Counsel.\n\nYour proposition "${uploadedFile?.name}" has been received.\n\nI will now guide you through your moot court preparation. This session follows a structured approach:\n\n1. First, I will ask you to identify the legal issues in the proposition.\n2. Then, we will identify the applicable laws and provisions.\n3. You may ask any doubts during the process.\n4. Finally, you will submit your memorial for review.\n\nLet us begin.\n\nPlease read the proposition carefully. What legal issues do you identify in this case?`
    }
    return `Welcome, Counsel.\n\nI see you have chosen to practice with "${caseData?.title}" (${caseData?.area}).\n\nI will now guide you through your moot court preparation. This session follows a structured approach:\n\n1. First, I will ask you to identify the legal issues in the proposition.\n2. Then, we will identify the applicable laws and provisions.\n3. You may ask any doubts during the process.\n4. Finally, you will submit your memorial for review.\n\nLet us begin.\n\nPlease read the proposition carefully. What legal issues do you identify in this case?`
  }, [caseData, uploadedFile, fromUpload])

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      setMessages([{ role: 'assistant', content: getWelcomeMessage() }])
    }
  }, [getWelcomeMessage])

  const buildContextPrompt = () => {
    const base = fromUpload
      ? `The student uploaded "${uploadedFile?.name}".`
      : `The student is practicing "${caseData?.title}" in ${caseData?.area}. Description: ${caseData?.description}.`

    let phaseContext = ''
    if (phase === 'issues') {
      phaseContext = ` The student has made ${issueAttempts} attempt(s) at identifying issues. ${showRevealIssues ? 'Show reveal button is available.' : ''} ${issuesRevealed ? 'Issues have been revealed. Move to laws phase next.' : ''}`
    } else if (phase === 'laws') {
      phaseContext = ` The student has made ${lawAttempts} attempt(s) at identifying laws. ${showRevealLaws ? 'Show reveal button is available.' : ''} ${lawsRevealed ? 'Laws have been revealed. Move to doubts phase next.' : ''}`
    } else if (phase === 'doubts') {
      phaseContext = ' The student is in the doubts phase. Answer any legal questions thoroughly. When they indicate they are done, move to memorial phase.'
    } else if (phase === 'memorial') {
      phaseContext = ' The student will submit their memorial for review. Analyze it for legal reasoning, argument structure, use of statutes, precedents, IRAC format, grammar, and legal language.'
    }

    return base + phaseContext
  }

  const handleSend = async (customText) => {
    const text = (customText || input).trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Detect reveal requests
    const lowerText = text.toLowerCase()
    const isRevealRequest = lowerText.includes('reveal') || lowerText.includes('show me') ||
      lowerText.includes('give up') || lowerText.includes('i give up') ||
      lowerText.includes('show the answer') || lowerText.includes('show issues') ||
      lowerText.includes('show laws')

    if (phase === 'issues' && isRevealRequest && !issuesRevealed) {
      setIssuesRevealed(true)
      setShowRevealIssues(false)
    }
    if (phase === 'laws' && isRevealRequest && !lawsRevealed) {
      setLawsRevealed(true)
      setShowRevealLaws(false)
    }

    try {
      const response = await sendMessage(newMessages, SYSTEM_PROMPT + "\n\nContext: " + buildContextPrompt())
      setMessages([...newMessages, { role: 'assistant', content: response }])

      // Phase transitions based on AI response or user actions
      if (phase === 'issues') {
        setIssueAttempts(prev => prev + 1)
        if (issueAttempts >= 2 && !showRevealIssues && !issuesRevealed) {
          setShowRevealIssues(true)
        }
        if (issuesRevealed) {
          setTimeout(() => {
            setPhase('laws')
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'Good. Now that we have identified the issues, let us move to the next step.\n\nWhich laws, constitutional provisions, or statutes are applicable to this case? Please identify the relevant legal authorities.'
            }])
          }, 500)
        }
      } else if (phase === 'laws') {
        setLawAttempts(prev => prev + 1)
        if (lawAttempts >= 2 && !showRevealLaws && !lawsRevealed) {
          setShowRevealLaws(true)
        }
        if (lawsRevealed) {
          setTimeout(() => {
            setPhase('doubts')
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'We have now covered the issues and applicable laws.\n\nDo you have any doubts or questions about the case, the legal issues, or the applicable provisions? Feel free to ask anything before we proceed to the memorial review.'
            }])
          }, 500)
        }
      }
    } catch (err) {
      console.error('API Error:', err)
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Technical error: ' + (err.message || 'Unknown error') + '\n\nPlease check the browser console (F12) for details.'
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleRevealIssues = () => {
    const revealMsg = { role: 'user', content: 'Please reveal the issues.' }
    setMessages(prev => [...prev, revealMsg])
    setIssuesRevealed(true)
    setShowRevealIssues(false)
    setLoading(true)

    const contextPrompt = `${fromUpload ? `The student uploaded "${uploadedFile?.name}".` : `The student is practicing "${caseData?.title}" in ${caseData?.area}.`} REVEAL ALL LEGAL ISSUES in this proposition clearly and completely.`
    sendMessage([revealMsg], SYSTEM_PROMPT + "\n\nContext: " + contextPrompt)
      .then(response => {
        setMessages(prev => [...prev, { role: 'assistant', content: response }])
        setTimeout(() => {
          setPhase('laws')
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Now that the issues are clear, let us identify the applicable laws.\n\nWhich laws, constitutional provisions, or statutes are applicable to this case?'
          }])
        }, 500)
      })
      .catch((err) => {
        console.error('API Error:', err)
        setMessages(prev => [...prev, { role: 'assistant', content: 'Technical error: ' + (err.message || 'Unknown error') }])
      })
      .finally(() => setLoading(false))
  }

  const handleRevealLaws = () => {
    const revealMsg = { role: 'user', content: 'Please reveal the applicable laws.' }
    setMessages(prev => [...prev, revealMsg])
    setLawsRevealed(true)
    setShowRevealLaws(false)
    setLoading(true)

    const contextPrompt = `${fromUpload ? `The student uploaded "${uploadedFile?.name}".` : `The student is practicing "${caseData?.title}" in ${caseData?.area}.`} REVEAL ALL APPLICABLE LAWS, constitutional provisions, and statutes clearly and completely.`
    sendMessage([revealMsg], SYSTEM_PROMPT + "\n\nContext: " + contextPrompt)
      .then(response => {
        setMessages(prev => [...prev, { role: 'assistant', content: response }])
        setTimeout(() => {
          setPhase('doubts')
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'We have covered the issues and laws. Do you have any doubts or questions? Feel free to ask. When you are done, type "done" to proceed to the memorial review.'
          }])
        }, 500)
      })
      .catch((err) => {
        console.error('API Error:', err)
        setMessages(prev => [...prev, { role: 'assistant', content: 'Technical error: ' + (err.message || 'Unknown error') }])
      })
      .finally(() => setLoading(false))
  }

  const handleProceedToMemorial = () => {
    setPhase('memorial')
    setShowMemorialInput(true)
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Please paste your memorial below for review. I will analyze it for legal reasoning, argument structure, use of statutes, precedents, IRAC format, grammar, and legal language.'
    }])
  }

  const handleMemorialSubmit = () => {
    if (!memorialText.trim()) return

    const userMsg = { role: 'user', content: `Here is my memorial:\n\n${memorialText}` }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setMemorialText('')
    setShowMemorialInput(false)
    setLoading(true)

    const contextPrompt = `${fromUpload ? `The student uploaded "${uploadedFile?.name}".` : `The student is practicing "${caseData?.title}" in ${caseData?.area}.`} The student has submitted their memorial for review. Analyze it thoroughly for: 1) Legal reasoning quality, 2) Argument structure and organization, 3) Use of statutes and provisions, 4) Use of judicial precedents, 5) IRAC format compliance, 6) Grammar and legal language, 7) Overall strengths, 8) Areas for improvement. Provide a score out of 100 and detailed feedback.`

    sendMessage(newMessages, SYSTEM_PROMPT + "\n\nContext: " + contextPrompt)
      .then(response => {
        setMessages([...newMessages, { role: 'assistant', content: response }])
        setPhase('feedback')
      })
      .catch((err) => {
        console.error('API Error:', err)
        setMessages([...newMessages, { role: 'assistant', content: 'Technical error: ' + (err.message || 'Unknown error') }])
      })
      .finally(() => setLoading(false))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDoneFromDoubts = () => {
    handleSend('done')
    setTimeout(() => {
      setPhase('memorial')
      setShowMemorialInput(true)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Please paste your memorial below for review. I will analyze it for legal reasoning, argument structure, use of statutes, precedents, IRAC format, grammar, and legal language.'
      }])
    }, 1500)
  }

  const getPhaseLabel = () => {
    switch (phase) {
      case 'welcome': return 'Getting Started'
      case 'issues': return 'Identifying Issues'
      case 'laws': return 'Identifying Laws'
      case 'doubts': return 'Doubts & Clarifications'
      case 'memorial': return 'Memorial Review'
      case 'feedback': return 'Session Complete'
      default: return ''
    }
  }

  return (
    <div className="practice-page">
      <header className="practice-header">
        <div className="practice-top">
          <button className="practice-back" onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="practice-brand">Lexora</h1>
          <div className="practice-header-right">
            <span className="practice-phase-label">{getPhaseLabel()}</span>
            <button className="icon-btn" onClick={onMenuClick} title="Menu">
              <img src="/icons/dashboard.png" alt="Menu" />
            </button>
          </div>
        </div>
        <div className="practice-progress-bar">
          <div className={`progress-step ${PHASES.indexOf(phase) >= 0 ? 'active' : ''}`}>
            <span className="step-dot"></span>
            <span className="step-label">Issues</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${PHASES.indexOf(phase) >= 1 ? 'active' : ''}`}>
            <span className="step-dot"></span>
            <span className="step-label">Laws</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${PHASES.indexOf(phase) >= 2 ? 'active' : ''}`}>
            <span className="step-dot"></span>
            <span className="step-label">Doubts</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${PHASES.indexOf(phase) >= 3 ? 'active' : ''}`}>
            <span className="step-dot"></span>
            <span className="step-label">Memorial</span>
          </div>
        </div>
      </header>

      <div className="practice-chat">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
              {msg.role === 'assistant' && (
                <div className="avatar assistant-avatar">L</div>
              )}
              <div className="bubble-content">
                {msg.content.split('\n').map((line, j) => (
                  <p key={j}>{line || <br />}</p>
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="avatar user-avatar">S</div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble assistant">
              <div className="avatar assistant-avatar">L</div>
              <div className="bubble-content typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          {showRevealIssues && !issuesRevealed && (
            <div className="reveal-action">
              <button className="reveal-btn" onClick={handleRevealIssues}>
                Reveal Issues
              </button>
            </div>
          )}

          {showRevealLaws && !lawsRevealed && (
            <div className="reveal-action">
              <button className="reveal-btn" onClick={handleRevealLaws}>
                Reveal Applicable Laws
              </button>
            </div>
          )}

          {phase === 'doubts' && !showMemorialInput && (
            <div className="reveal-action">
              <button className="reveal-btn" onClick={handleProceedToMemorial}>
                Proceed to Memorial Review
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {showMemorialInput && phase === 'memorial' && (
          <div className="memorial-input-area">
            <textarea
              className="memorial-textarea"
              placeholder="Paste your memorial text here..."
              value={memorialText}
              onChange={(e) => setMemorialText(e.target.value)}
              rows={6}
            />
            <button
              className="memorial-submit"
              onClick={handleMemorialSubmit}
              disabled={!memorialText.trim() || loading}
            >
              Submit Memorial for Review
            </button>
          </div>
        )}

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder={phase === 'doubts' ? 'Ask your doubt or type "done"...' : 'Type your response...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="chat-send"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

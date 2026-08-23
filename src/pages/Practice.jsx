import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { sendMessage } from '../utils/api'
import {
  IconSparkles,
  IconLightbulb,
  IconScale,
  IconHelp,
  IconPen,
  IconTarget,
  IconCheck,
  IconMic,
  IconSend,
  IconFileText,
} from '../components/icons'
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
- Track what phase the conversation is in based on the context.

PHASE CONTROL RULES (VERY IMPORTANT):
- The student MUST complete the current phase before moving to the next one.
- If the student asks to skip to the next phase (e.g. "let's move to laws", "next step", "skip to doubts"), you must NOT allow it unless the current phase is truly complete.
- A phase is COMPLETE when:
  * Issues phase: The student has identified at least 3-4 key legal issues, OR they have requested you to reveal the issues.
  * Laws phase: The student has identified at least 2-3 applicable laws/provisions, OR they have requested you to reveal the laws.
  * Doubts phase: The student indicates they have no more doubts (e.g. types "done").
  * Memorial phase: The student submits their memorial.
- When a phase is complete, end your response with the marker: [PHASE_COMPLETE]
- If the student tries to skip and the phase is NOT complete, respond with: "Let us first complete the current phase before moving on. [CURRENT_PHASE]"
  where [CURRENT_PHASE] is one of: ISSUES, LAWS, DOUBTS, MEMORIAL.`

const PHASES = ['welcome', 'issues', 'laws', 'doubts', 'memorial', 'feedback']

const STEPS = [
  { key: 'welcome', label: 'Welcome', desc: 'Session introduction', icon: IconSparkles },
  { key: 'issues', label: 'Legal Issues', desc: 'Identify the issues', icon: IconLightbulb },
  { key: 'laws', label: 'Applicable Laws', desc: 'Identify the laws', icon: IconScale },
  { key: 'doubts', label: 'Doubts', desc: 'Ask questions', icon: IconHelp },
  { key: 'memorial', label: 'Memorial Review', desc: 'Draft & submit', icon: IconPen },
  { key: 'feedback', label: 'Feedback', desc: 'Review the result', icon: IconTarget },
]

const PHASE_BADGE = {
  issues: { label: 'Legal Issues', cls: 'badge-blue' },
  laws: { label: 'Applicable Laws', cls: 'badge-blue' },
  doubts: { label: 'Doubts', cls: 'badge-amber' },
  memorial: { label: 'Memorial Review', cls: 'badge-navy' },
  feedback: { label: 'Feedback', cls: 'badge-green' },
}

export default function Practice() {
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

  const isFreeMode = !caseData && !fromUpload

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getWelcomeMessage = useCallback(() => {
    if (!caseData && !fromUpload) {
      return 'Ask me any doubts you have about law, legal concepts, or moot court preparation. I am here to help!'
    }
    if (fromUpload) {
      return `Welcome, Counsel.\n\nYou have chosen to practice with "${uploadedFile?.name}" (${uploadedFile?.area || 'General'}).\n\nThis session will guide you through the proposition step by step. Please read the proposition carefully.\n\nWhat legal issues do you identify in this case?`
    }
    return `Welcome, Counsel.\n\nYou have chosen to practice with "${caseData?.title}" (${caseData?.area}).\n\nThis session will guide you through the proposition step by step. Please read the proposition carefully.\n\nWhat legal issues do you identify in this case?`
  }, [caseData, uploadedFile, fromUpload])

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      setMessages([{ role: 'assistant', content: getWelcomeMessage() }])
      if (!caseData && !fromUpload) {
        setPhase('doubts')
      }
    }
  }, [getWelcomeMessage, caseData, fromUpload])

  const buildContextPrompt = () => {
    const base = fromUpload
      ? `The student uploaded "${uploadedFile?.name}".`
      : `The student is practicing "${caseData?.title}" in ${caseData?.area}. Description: ${caseData?.description}.`

    if (phase === 'doubts') {
      return base + ' The student is in the doubts phase. Answer any legal questions thoroughly and clearly.'
    }

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

      // Strip the phase control markers from the displayed response
      const displayResponse = response
        .replace(/\s*\[PHASE_COMPLETE\]\s*/g, '')
        .replace(/\s*\[CURRENT_PHASE\]\s*/g, '')
        .replace(/\s*\[(ISSUES|LAWS|DOUBTS|MEMORIAL)\]\s*/g, '')
        .trim()

      setMessages([...newMessages, { role: 'assistant', content: displayResponse }])

      // Detect phase transition from AI response
      const hasPhaseCompleteMarker = response.includes('[PHASE_COMPLETE]')

      if (phase === 'issues') {
        setIssueAttempts(prev => prev + 1)
        if (issueAttempts >= 2 && !showRevealIssues && !issuesRevealed) {
          setShowRevealIssues(true)
        }
        if (issuesRevealed || hasPhaseCompleteMarker) {
          setPhase('laws')
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Good. Now that we have identified the issues, let us move to the next step.\n\nWhich laws, constitutional provisions, or statutes are applicable to this case? Please identify the relevant legal authorities.'
          }])
        }
      } else if (phase === 'laws') {
        setLawAttempts(prev => prev + 1)
        if (lawAttempts >= 2 && !showRevealLaws && !lawsRevealed) {
          setShowRevealLaws(true)
        }
        if (lawsRevealed || hasPhaseCompleteMarker) {
          setPhase('doubts')
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'We have now covered the issues and applicable laws.\n\nDo you have any doubts or questions about the case, the legal issues, or the applicable provisions? Feel free to ask anything before we proceed to the memorial review.'
          }])
        }
      } else if (phase === 'doubts' && hasPhaseCompleteMarker) {
        setPhase('memorial')
        setShowMemorialInput(true)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Please paste your memorial below for review. I will analyze it for legal reasoning, argument structure, use of statutes, precedents, IRAC format, grammar, and legal language.'
        }])
      }
    } catch (err) {
      console.error('API Error:', err)
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Technical error: ' + (err.message || 'Unknown error') + '\n\nPlease check the browser console (F12) for details.'
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
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
        const displayResponse = response.replace(/\s*\[PHASE_COMPLETE\]\s*/g, '').replace(/\s*\[CURRENT_PHASE\]\s*/g, '').replace(/\s*\[(ISSUES|LAWS|DOUBTS|MEMORIAL)\]\s*/g, '').trim()
        setMessages(prev => [...prev, { role: 'assistant', content: displayResponse }])
        setPhase('laws')
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Now that the issues are clear, let us identify the applicable laws.\n\nWhich laws, constitutional provisions, or statutes are applicable to this case?'
        }])
      })
      .catch((err) => {
        console.error('API Error:', err)
        setMessages(prev => [...prev, { role: 'assistant', content: 'Technical error: ' + (err.message || 'Unknown error') }])
      })
      .finally(() => {
        setLoading(false)
        setTimeout(() => inputRef.current?.focus(), 50)
      })
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
        const displayResponse = response.replace(/\s*\[PHASE_COMPLETE\]\s*/g, '').replace(/\s*\[CURRENT_PHASE\]\s*/g, '').replace(/\s*\[(ISSUES|LAWS|DOUBTS|MEMORIAL)\]\s*/g, '').trim()
        setMessages(prev => [...prev, { role: 'assistant', content: displayResponse }])
        setPhase('doubts')
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'We have covered the issues and laws. Do you have any doubts or questions? Feel free to ask. When you are done, type "done" to proceed to the memorial review.'
        }])
      })
      .catch((err) => {
        console.error('API Error:', err)
        setMessages(prev => [...prev, { role: 'assistant', content: 'Technical error: ' + (err.message || 'Unknown error') }])
      })
      .finally(() => {
        setLoading(false)
        setTimeout(() => inputRef.current?.focus(), 50)
      })
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

  const phaseIdx = PHASES.indexOf(phase)
  const visibleSteps = STEPS

  const getStepState = (key) => {
    const idx = STEPS.findIndex((s) => s.key === key)
    if (isFreeMode && ['welcome', 'issues', 'laws'].includes(key)) return 'skipped'
    if (key === 'issues' && (issuesRevealed || phaseIdx > STEPS.findIndex(s => s.key === 'issues'))) return 'done'
    if (key === 'laws' && (lawsRevealed || phaseIdx > STEPS.findIndex(s => s.key === 'laws'))) return 'done'
    if (phase === key) return 'current'
    if (phaseIdx > idx) return 'done'
    return 'upcoming'
  }

  const activeBadge = PHASE_BADGE[phase]

  const caseLabel = fromUpload
    ? uploadedFile?.name || 'Uploaded proposition'
    : caseData
      ? `${caseData.title} · ${caseData.area}`
      : 'Open consultation'

  return (
    <div className="practice-page">
      <div className="practice-topbar">
        <div className="practice-topbar-left">
          <h2 className="practice-page-title">MootCourt Coach</h2>
          <span className="practice-case-chip" title={caseLabel}>{caseLabel}</span>
        </div>
        <div className="practice-topbar-right">
          {activeBadge && <span className={`badge ${activeBadge.cls}`}>{activeBadge.label}</span>}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/oral-arguments', { state: { caseData } })}
          >
            <IconMic size={15} />
            Oral Arguments
          </button>
        </div>
      </div>

      <div className="practice-workspace">
        <aside className="practice-rail">
          <div className="practice-rail-title">Session steps</div>
          <div className="practice-steps">
            {visibleSteps.map((step) => {
              const state = getStepState(step.key)
              const Icon = step.icon
              return (
                <div className={`step-item ${state}`} key={step.key}>
                  <span className="step-icon">
                    {state === 'done' ? <IconCheck size={15} /> : <Icon size={15} />}
                  </span>
                  <div className="step-meta">
                    <span className="step-label">{step.label}</span>
                    <span className="step-desc">{state === 'done' ? 'Completed' : step.desc}</span>
                  </div>
                </div>
              )
            })}
          </div>
          {isFreeMode && (
            <p className="practice-rail-note">
              Free consultation mode — ask your doubts here.
            </p>
          )}
        </aside>

        <div className="practice-chat">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                {msg.role === 'assistant' && (
                  <div className="chat-msg-avatar">
                    <IconSparkles size={15} />
                  </div>
                )}
                <div className={`chat-msg-body ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                  {msg.role === 'assistant' && <div className="chat-msg-author">Lexora Coach</div>}
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} className={line ? '' : 'chat-msg-gap'}>{line || ' '}</p>
                  ))}
                </div>
                {msg.role === 'user' && (
                  <div className="chat-msg-avatar user">
                    <span>C</span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-msg assistant">
                <div className="chat-msg-avatar">
                  <IconSparkles size={15} />
                </div>
                <div className="chat-msg-body assistant typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

            {showRevealIssues && !issuesRevealed && (
              <div className="reveal-action">
                <div className="reveal-panel">
                  <p className="reveal-hint">
                    Try identifying the legal issues yourself first. If you would like, Lexora can reveal them.
                  </p>
                  <button className="btn btn-amber-soft" onClick={handleRevealIssues}>
                    Reveal Legal Issues
                  </button>
                </div>
              </div>
            )}

            {showRevealLaws && !lawsRevealed && (
              <div className="reveal-action">
                <div className="reveal-panel">
                  <p className="reveal-hint">
                    Try identifying the applicable laws yourself first. If you would like, Lexora can reveal them.
                  </p>
                  <button className="btn btn-amber-soft" onClick={handleRevealLaws}>
                    Reveal Applicable Laws
                  </button>
                </div>
              </div>
            )}

            {phase === 'doubts' && !showMemorialInput && (
              <div className="reveal-action">
                <div className="reveal-panel">
                  <p className="reveal-hint">
                    Finished with your doubts? Move on to review your memorial.
                  </p>
                  <button className="btn btn-primary" onClick={handleProceedToMemorial}>
                    Proceed to Memorial Review
                  </button>
                </div>
              </div>
            )}

            {showMemorialInput && phase === 'memorial' && (
              <div className="memorial-panel">
                <div className="memorial-panel-head">
                  <span className="memorial-panel-icon"><IconFileText size={16} /></span>
                  <div>
                    <div className="memorial-panel-title">Submit your memorial</div>
                    <div className="memorial-panel-desc">Paste your memorial text for AI review</div>
                  </div>
                </div>
                <textarea
                  className="memorial-textarea"
                  placeholder="Paste your memorial text here..."
                  value={memorialText}
                  onChange={(e) => setMemorialText(e.target.value)}
                  rows={7}
                />
                <div className="memorial-panel-foot">
                  <button
                    className="btn btn-primary"
                    onClick={handleMemorialSubmit}
                    disabled={!memorialText.trim() || loading}
                  >
                    Submit Memorial for Review
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

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
                aria-label="Chat input"
              />
              <button
                className="chat-send"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                aria-label="Send message"
              >
                <IconSend size={18} />
              </button>
            </div>
            <p className="chat-input-note">
              {phase === 'doubts' ? 'Type "done" to move to the memorial review.' : 'The coach will guide your next step.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
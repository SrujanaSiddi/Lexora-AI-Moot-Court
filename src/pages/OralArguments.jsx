import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { sendJudgeMessage } from '../services/judgeService'
import { startRecording, speakText, stopSpeaking, isSpeechSupported, isSpeechSynthesisSupported } from '../services/speechService'
import { saveChatMessage, createSession } from '../services/dbService'
import {
  IconChevronLeft,
  IconScale2,
  IconPlay,
  IconStop,
  IconRefresh,
  IconMic,
  IconSparkles,
} from '../components/icons'
import './OralArguments.css'

const RECORDING_DURATION = 20

export default function OralArguments() {
  const location = useLocation()
  const navigate = useNavigate()
  const caseData = location.state?.caseData

  const [phase, setPhase] = useState('greeting')
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [judgeResponse, setJudgeResponse] = useState('')
  const [conversation, setConversation] = useState([])
  const [countdown, setCountdown] = useState(RECORDING_DURATION)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState(null)

  const recorderRef = useRef(null)
  const timerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    const sid = Date.now().toString()
    setSessionId(sid)
    createSession(caseData?.title || 'Oral Argument Session', caseData?.area || 'General')
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, transcript, interimText, phase])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      stopSpeaking()
      if (recorderRef.current) {
        recorderRef.current.stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const getCaseContext = () => {
    if (!caseData) return ''
    return `The case being argued is "${caseData.title}" in ${caseData.area}. Description: ${caseData.description}`
  }

  const handleStartArgument = async () => {
    setError('')
    setTranscript('')
    setInterimText('')
    setJudgeResponse('')
    transcriptRef.current = ''
    setPhase('recording')
    setCountdown(RECORDING_DURATION)

    if (!isSpeechSupported()) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      setPhase('greeting')
      return
    }

    try {
      const recorder = await startRecording(
        (final) => {
          setTranscript(final)
          transcriptRef.current = final
        },
        (interim) => setInterimText(interim)
      )
      recorderRef.current = recorder
      console.log('[OralArguments] Recording started, 20s countdown beginning')

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleStopRecording()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(err.message)
      setPhase('greeting')
    }
  }

  const handleStopRecording = async () => {
    clearInterval(timerRef.current)
    setPhase('transcribing')

    let finalText = ''
    if (recorderRef.current) {
      finalText = await recorderRef.current.stop()
      recorderRef.current = null
      transcriptRef.current = finalText
      setTranscript(finalText)
      console.log('[OralArguments] Recording stopped. Raw transcript:', JSON.stringify(finalText), 'Length:', finalText.length)
    }

    if (!finalText.trim()) {
      console.warn('[OralArguments] Empty transcript after recording. Checking audioChunks...')
      setPhase('result')
      setJudgeResponse('The Court did not hear any argument. You may proceed when ready.')
      return
    }

    console.log('[OralArguments] Sending transcript to judge. Text:', JSON.stringify(finalText))
    setPhase('waiting')
    handleSendToJudge(finalText)
  }

  const handleSendToJudge = async (text) => {
    if (!text || !text.trim()) {
      console.warn('[OralArguments] handleSendToJudge called with empty text')
      setJudgeResponse('The Court did not hear any argument. You may proceed when ready.')
      setPhase('result')
      return
    }

    setIsLoading(true)
    try {
      console.log('[OralArguments] Calling sendJudgeMessage. Text length:', text.length)
      const response = await sendJudgeMessage(text, conversation, getCaseContext())
      console.log('[OralArguments] Judge response received. Length:', response.length)

      setJudgeResponse(response)
      setConversation((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: response },
      ])
      setPhase('result')

      if (sessionId) {
        saveChatMessage(sessionId, 'user', text)
        saveChatMessage(sessionId, 'assistant', response)
      }

      if (isSpeechSynthesisSupported()) {
        setIsSpeaking(true)
        speakText(response).then(() => setIsSpeaking(false))
      }
    } catch (err) {
      console.error('[OralArguments] Judge API Error:', err)
      setError('Groq API Error: ' + err.message)
      setPhase('result')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    stopSpeaking()
    setIsSpeaking(false)
    setTranscript('')
    setInterimText('')
    setJudgeResponse('')
    transcriptRef.current = ''
    setCountdown(RECORDING_DURATION)
    setPhase('greeting')
  }

  const handleEndSession = () => {
    stopSpeaking()
    setIsSpeaking(false)
    setPhase('ended')
  }

  const handleReplay = () => {
    if (judgeResponse) {
      setIsSpeaking(true)
      speakText(judgeResponse).then(() => setIsSpeaking(false))
    }
  }

  return (
    <div className="oa-page">
      <div className="oa-topbar">
        <button className="oa-back" onClick={() => navigate('/practice', { state: { caseData } })}>
          <IconChevronLeft size={18} />
          <span>Coach Session</span>
        </button>
        <span className="oa-topbar-title">Oral Arguments</span>
        <span className="oa-topbar-right">
          <span className="badge badge-dot pulse badge-green">Live session</span>
        </span>
      </div>

      <div className="oa-content">
        <div className="courtroom-header">
          <div className="court-seal">
            <IconScale2 size={26} />
          </div>
          <div className="court-info">
            <h2 className="court-title">Court of Lexora</h2>
            <p className="court-subtitle">Before the Hon'ble Bench · AI Presiding Judge</p>
            {caseData && <p className="court-case">{caseData.title}</p>}
            {!caseData && <p className="court-case">General oral argument practice</p>}
          </div>
        </div>

        <div className="oa-messages">
          {phase === 'greeting' && (
            <div className="oa-message judge">
              <div className="oa-avatar judge-avatar"><IconSparkles size={16} /></div>
              <div className="oa-bubble judge-bubble">
                <p>Good afternoon, Counsel. You may begin your submissions. You have up to {RECORDING_DURATION} seconds.</p>
              </div>
            </div>
          )}

          {conversation.map((msg, i) => (
            <div key={i} className={`oa-message ${msg.role === 'user' ? 'counsel' : 'judge'}`}>
              <div className={`oa-avatar ${msg.role === 'user' ? 'counsel-avatar' : 'judge-avatar'}`}>
                {msg.role === 'user' ? 'C' : <IconSparkles size={16} />}
              </div>
              <div className={`oa-bubble ${msg.role === 'user' ? 'counsel-bubble' : 'judge-bubble'}`}>
                <p>{msg.content}</p>
                {i === conversation.length - 1 && msg.role === 'assistant' && isSpeaking && (
                  <span className="speaking-badge">Speaking…</span>
                )}
              </div>
            </div>
          ))}

          {(phase === 'recording' || phase === 'transcribing') && (
            <div className="oa-message counsel">
              <div className="oa-avatar counsel-avatar">C</div>
              <div className="oa-bubble counsel-bubble">
                <p>{transcript || '(Waiting for speech...)'}</p>
                {interimText && transcript && (
                  <span className="interim-text">{interimText}</span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="oa-error">
              <p>{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="oa-controls">
          {phase === 'greeting' && (
            <button className="oa-btn oa-btn-primary" onClick={handleStartArgument}>
              <IconMic size={16} />
              Start Argument
            </button>
          )}

          {phase === 'recording' && (
            <div className="recording-bar">
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                <span className="recording-time">{countdown}s</span>
              </div>
              <button className="oa-btn oa-btn-danger" onClick={handleStopRecording}>
                <IconStop size={16} />
                Stop & Submit
              </button>
            </div>
          )}

          {phase === 'transcribing' && (
            <div className="status-bar">
              <div className="spinner light"></div>
              <span>Processing your argument…</span>
            </div>
          )}

          {phase === 'waiting' && (
            <div className="status-bar">
              <div className="spinner light"></div>
              <span>The Court is considering your submission…</span>
            </div>
          )}

          {phase === 'result' && !isLoading && (
            <div className="result-bar">
              {isSpeechSynthesisSupported() && (
                <button className="oa-btn oa-btn-ghost" onClick={handleReplay} disabled={isSpeaking}>
                  <IconRefresh size={15} />
                  Replay
                </button>
              )}
              <button className="oa-btn oa-btn-primary" onClick={handleContinue}>
                <IconPlay size={15} />
                Continue Argument
              </button>
              <button className="oa-btn oa-btn-secondary" onClick={handleEndSession}>
                End Session
              </button>
            </div>
          )}

          {phase === 'ended' && (
            <div className="ended-bar">
              <p className="ended-text">Your oral argument session has concluded.</p>
              <button className="oa-btn oa-btn-primary" onClick={() => navigate('/practice', { state: { caseData } })}>
                Return to Practice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
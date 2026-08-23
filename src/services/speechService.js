const MAX_SPEECH_LENGTH = 300

export function startRecording(onTranscript, onInterim) {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition is not supported in this browser. Please use Chrome or Edge.'))
      return
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const tracks = stream.getAudioTracks()
        console.log('[speechService] getUserMedia succeeded. Tracks:', tracks.length)
        tracks.forEach((t, i) => console.log(`[speechService] Track ${i}:`, t.label, 'state:', t.readyState))

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : ''
        console.log('[speechService] Selected MIME type:', mimeType || '(browser default)')

        const mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream)
        const audioChunks = []
        const recognition = new SpeechRecognition()

        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1

        let finalTranscript = ''

        recognition.onresult = (event) => {
          let interim = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              if (finalTranscript.length < MAX_SPEECH_LENGTH) {
                finalTranscript += t + ' '
              }
            } else {
              interim += t
            }
          }
          console.log('[speechService] onresult - final so far:', JSON.stringify(finalTranscript.trim()), 'interim:', JSON.stringify(interim))
          onTranscript(finalTranscript.trim())
          onInterim(interim)
        }

        recognition.onerror = (event) => {
          console.error('[speechService] Speech recognition error:', event.error)
        }

        recognition.onend = () => {
          console.log('[speechService] SpeechRecognition onend fired. Final transcript at end:', JSON.stringify(finalTranscript.trim()))
        }

        mediaRecorder.ondataavailable = (e) => {
          console.log('[speechService] ondataavailable - chunk size:', e.data.size, 'bytes')
          if (e.data.size > 0) {
            audioChunks.push(e.data)
          }
        }

        mediaRecorder.onstart = () => {
          console.log('[speechService] MediaRecorder started. State:', mediaRecorder.state)
        }

        mediaRecorder.onstop = () => {
          const totalSize = audioChunks.reduce((sum, c) => sum + c.size, 0)
          console.log('[speechService] MediaRecorder stopped. Chunks:', audioChunks.length, 'Total size:', totalSize, 'bytes')
        }

        mediaRecorder.start()
        recognition.start()
        console.log('[speechService] Recording started')

        resolve({
          mediaRecorder,
          recognition,
          stream,
          audioChunks,
          stop: () => {
            return new Promise((resolveStop) => {
              let recognitionEnded = false
              let mediaRecorderStopped = false

              const tryResolve = () => {
                if (recognitionEnded && mediaRecorderStopped) {
                  stream.getTracks().forEach((t) => t.stop())
                  const totalSize = audioChunks.reduce((sum, c) => sum + c.size, 0)
                  console.log('[speechService] stop() resolving. finalTranscript:', JSON.stringify(finalTranscript.trim()), 'Length:', finalTranscript.trim().length, 'Audio chunks:', audioChunks.length, 'Total audio size:', totalSize)
                  resolveStop(finalTranscript.trim())
                }
              }

              recognition.onend = () => {
                console.log('[speechService] recognition.onend (from stop)')
                recognitionEnded = true
                tryResolve()
              }

              mediaRecorder.addEventListener('stop', () => {
                console.log('[speechService] mediaRecorder stop event')
                mediaRecorderStopped = true
                tryResolve()
              })

              recognition.stop()
              if (mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop()
              }
            })
          },
        })
      })
      .catch((err) => {
        console.error('[speechService] getUserMedia failed:', err.message)
        reject(new Error('Microphone access denied. Please allow microphone permissions.'))
      })
  })
}

export function speakText(text) {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    utterance.pitch = 0.7
    utterance.volume = 1
    utterance.onend = resolve
    utterance.onerror = resolve
    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking() {
  window.speechSynthesis.cancel()
}

export function isSpeechSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function isSpeechSynthesisSupported() {
  return 'speechSynthesis' in window
}
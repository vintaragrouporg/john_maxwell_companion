import { useEffect, useMemo, useRef, useState } from 'react';
import VoiceAppShell from './components/VoiceAppShell.jsx';
import { startConversation, streamMessage, fetchSpeech } from './lib/brainClient.js';

const SKIN_STORAGE_KEY = 'john-maxwell-voice-skin';
const BOOKMARK_STORAGE_KEY = 'john-maxwell-saved-insights';

const skins = [
  {
    id: 'circle',
    name: 'Maxwell Circle',
    concept: 'Concept 1',
    accent: '#ffbd4a',
    secondary: '#6d4212',
    description: 'A living circle that breathes with the conversation.',
  },
  {
    id: 'compass',
    name: 'Maxwell Compass',
    concept: 'Concept 2',
    accent: '#ffd983',
    secondary: '#173e5d',
    description: 'Direction, leadership, and clear conversation flow.',
  },
  {
    id: 'flame',
    name: 'Maxwell Flame',
    concept: 'Concept 3',
    accent: '#ffac35',
    secondary: '#7a2d0d',
    description: 'Passion, purpose, and transformation.',
  },
  {
    id: 'beacon',
    name: 'Leadership Beacon',
    concept: 'Concept 4',
    accent: '#ffc55d',
    secondary: '#123a56',
    description: 'Clarity, direction, and confidence.',
  },
];

const voiceStates = [
  { id: 'idle', label: 'Ready when you are.', button: 'Tap to speak' },
  { id: 'listening', label: "I'm listening.", button: 'Listening' },
  { id: 'reflecting', label: 'Reflecting...', button: 'Reflecting' },
  { id: 'responding', label: "Here's my response.", button: 'Save insight' },
];

function getSpeechRecognitionCtor() {
  return typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;
}

const journalEntries = [
  {
    id: 'accountability',
    date: 'June 23',
    title: 'Building Accountability in My Team',
    duration: '14 min',
    question: 'How do I become a better leader for my team?',
    response:
      'Leadership begins with influence, not position. When you add value to people, they will follow you anywhere.',
    takeaway: 'Add value to your people and you will earn their influence.',
  },
  {
    id: 'conflict',
    date: 'June 22',
    title: 'Leading Through Conflict',
    duration: '18 min',
    question: 'How do I lead well when the team is divided?',
    response: 'A leader listens first, brings clarity second, and models the standard before asking for it.',
    takeaway: 'Conflict can become alignment when the leader protects trust.',
  },
  {
    id: 'communication',
    date: 'June 18',
    title: 'Improving Executive Communication',
    duration: '12 min',
    question: 'How can I communicate with more executive presence?',
    response: 'Clarity is kindness. Say what matters, why it matters, and what action comes next.',
    takeaway: 'Strong communication reduces uncertainty.',
  },
];

const defaultInsights = [
  { id: 'influence', text: 'Leadership is influence.', date: 'June 23' },
  { id: 'vision', text: 'People buy into the leader before they buy into the vision.', date: 'June 22' },
  { id: 'growth', text: 'Growth requires intentionality.', date: 'June 18' },
];

function getInitialSkin() {
  const savedSkin = window.localStorage.getItem(SKIN_STORAGE_KEY);
  return skins.some((skin) => skin.id === savedSkin) ? savedSkin : 'circle';
}

function getInitialBookmarks() {
  try {
    return JSON.parse(window.localStorage.getItem(BOOKMARK_STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

export default function App() {
  const [selectedSkinId, setSelectedSkinId] = useState(getInitialSkin);
  const [voiceStateIndex, setVoiceStateIndex] = useState(0);
  const [activeSheet, setActiveSheet] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedJournalId, setSelectedJournalId] = useState(null);
  const [bookmarkedInsights, setBookmarkedInsights] = useState(getInitialBookmarks);
  const [voiceTransition, setVoiceTransition] = useState(null);
  const voiceTransitionTimerRef = useRef(null);

  // Real conversation state (replaces the old scripted demo question/response).
  const [threadId, setThreadId] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState("I'm glad you're here. Tap the orb and ask me anything about leadership.");
  const [currentInsight, setCurrentInsight] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const micSupported = useMemo(() => Boolean(getSpeechRecognitionCtor()), []);
  const recognitionRef = useRef(null);
  const streamAbortRef = useRef(null);
  const answerRef = useRef('');

  const selectedSkin = useMemo(
    () => skins.find((skin) => skin.id === selectedSkinId) ?? skins[0],
    [selectedSkinId],
  );

  const voiceState = voiceStates[voiceStateIndex];

  useEffect(() => {
    window.localStorage.setItem(SKIN_STORAGE_KEY, selectedSkinId);
  }, [selectedSkinId]);

  useEffect(() => {
    window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarkedInsights));
  }, [bookmarkedInsights]);

  useEffect(
    () => () => {
      window.clearTimeout(voiceTransitionTimerRef.current);
      recognitionRef.current?.abort();
      streamAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!micSupported) {
      setErrorMessage("Voice input isn't supported in this browser. Try Chrome, Edge, or Safari.");
    }
  }, [micSupported]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { id, openingMessage } = await startConversation();
        if (cancelled) return;
        setThreadId(id);
        setAnswer(openingMessage);
      } catch {
        if (!cancelled) {
          setErrorMessage("Couldn't reach the Maxwell Brain service. Is it running on VITE_BRAIN_API_URL?");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function moveToVoiceState(nextIndex, transitionName, options = {}) {
    const { delayStateChange = 0, transitionDuration = 700 } = options;

    window.clearTimeout(voiceTransitionTimerRef.current);
    setVoiceTransition(transitionName);

    const finishTransition = () => {
      voiceTransitionTimerRef.current = window.setTimeout(() => {
        setVoiceTransition(null);
      }, transitionDuration);
    };

    if (delayStateChange > 0) {
      voiceTransitionTimerRef.current = window.setTimeout(() => {
        setVoiceStateIndex(nextIndex);
        finishTransition();
      }, delayStateChange);
      return;
    }

    setVoiceStateIndex(nextIndex);
    finishTransition();
  }

  function startListening() {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      setErrorMessage("Voice input isn't supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    if (!threadId) {
      setErrorMessage("Still connecting to Maxwell Brain — try again in a moment.");
      return;
    }

    setErrorMessage(null);
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      setQuestion(transcript);
      moveToVoiceState(2, 'listeningToReflecting', { transitionDuration: 360 });
      sendQuery(transcript);
    };
    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      setErrorMessage(`Voice input error: ${event.error}`);
      moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
    };
    recognition.onend = () => {
      recognitionRef.current = null;
    };

    moveToVoiceState(1, 'idleToListening', { transitionDuration: 620 });
    try {
      recognition.start();
    } catch {
      setErrorMessage("Couldn't start the microphone. Check browser permissions.");
      moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
    }
  }

  function stopListening() {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
  }

  async function sendQuery(text) {
    setAnswer('');
    answerRef.current = '';
    setCurrentInsight(null);
    streamAbortRef.current?.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;
    let respondingStarted = false;

    try {
      await streamMessage(threadId, text, {
        signal: controller.signal,
        onToken: (token) => {
          if (!respondingStarted) {
            respondingStarted = true;
            moveToVoiceState(3, 'reflectingToResponding', { transitionDuration: 920 });
          }
          answerRef.current += token;
          setAnswer(answerRef.current);
        },
        onDone: () => {
          setCurrentInsight({
            id: `insight-${threadId}-${Date.now()}`,
            text: answerRef.current,
            date: new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' }),
          });
          playSpokenAnswer(answerRef.current);
        },
        onError: (message) => {
          setErrorMessage(message);
          moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
        },
      });
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setErrorMessage(err?.message || 'Something went wrong talking to Maxwell Brain.');
        moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
      }
    }
  }

  async function playSpokenAnswer(text) {
    // No-op until HUGGINGFACE_API_TOKEN is configured on the Brain side — fetchSpeech
    // resolves to null in that case, so this silently activates once voice is set up.
    const blob = await fetchSpeech(text);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.addEventListener('ended', () => URL.revokeObjectURL(url));
    audio.play().catch(() => {});
  }

  function cycleVoiceState() {
    const currentState = voiceStates[voiceStateIndex].id;

    if (currentState === 'responding') {
      if (currentInsight) toggleInsightBookmark(currentInsight);
      moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 1600 });
      return;
    }

    if (currentState === 'idle') {
      startListening();
      return;
    }

    if (currentState === 'listening') {
      stopListening();
      return;
    }

    if (currentState === 'reflecting') {
      streamAbortRef.current?.abort();
      moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
      return;
    }
  }

  function saveCurrentInsight() {
    if (currentInsight) toggleInsightBookmark(currentInsight);
  }

  function toggleInsightBookmark(insight) {
    setBookmarkedInsights((currentInsights) => {
      const exists = currentInsights.some((item) => item.id === insight.id);
      return exists
        ? currentInsights.filter((item) => item.id !== insight.id)
        : [insight, ...currentInsights];
    });
  }

  return (
    <VoiceAppShell
      activeTab={activeTab}
      selectedJournalId={selectedJournalId}
      journalEntries={journalEntries}
      defaultInsights={defaultInsights}
      bookmarkedInsights={bookmarkedInsights}
      demoQuestion={question}
      demoResponse={answer}
      currentInsightId={currentInsight?.id}
      errorMessage={errorMessage}
      skin={selectedSkin}
      skins={skins}
      voiceState={voiceState}
      voiceTransition={voiceTransition}
      voiceStates={voiceStates}
      activeSheet={activeSheet}
      onCycleVoiceState={cycleVoiceState}
      onOpenSelector={() => setActiveSheet('skins')}
      onOpenSettings={() => setActiveSheet('settings')}
      onCloseSelector={() => setActiveSheet(null)}
      onSelectSkin={setSelectedSkinId}
      onSelectTab={(tabId) => {
        setActiveTab(tabId);
        if (tabId !== 'journal') {
          setSelectedJournalId(null);
        }
      }}
      onSelectJournal={setSelectedJournalId}
      onBackToJournal={() => setSelectedJournalId(null)}
      onToggleInsight={toggleInsightBookmark}
      onSaveCurrentInsight={saveCurrentInsight}
      onSelectVoiceState={(stateId) => {
        window.clearTimeout(voiceTransitionTimerRef.current);
        setVoiceTransition(null);
        setVoiceStateIndex(voiceStates.findIndex((state) => state.id === stateId));
      }}
    />
  );
}

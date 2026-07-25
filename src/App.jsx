import { useEffect, useMemo, useRef, useState } from 'react';
import VoiceAppShell from './components/VoiceAppShell.jsx';
import { startConversation, streamMessage, fetchSpeech, getProfile, saveProfile } from './lib/brainClient.js';

const SKIN_STORAGE_KEY = 'john-maxwell-voice-skin';
const BOOKMARK_STORAGE_KEY = 'john-maxwell-saved-insights';
const USER_ID_STORAGE_KEY = 'john-maxwell-user-id';
const PROFILE_STORAGE_KEY = 'john-maxwell-user-profile';
const VOICE_ENABLED_STORAGE_KEY = 'john-maxwell-voice-enabled';

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
  { id: 'responding', label: "Here's my response.", button: 'Tap to interrupt' },
];

function getSpeechRecognitionCtor() {
  return typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;
}

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

function getInitialUserId() {
  const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) return existing;
  const id = `u_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  window.localStorage.setItem(USER_ID_STORAGE_KEY, id);
  return id;
}

function getInitialProfile() {
  try {
    return JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function getInitialVoiceEnabled() {
  const stored = window.localStorage.getItem(VOICE_ENABLED_STORAGE_KEY);
  return stored === null ? true : stored === 'true';
}

export default function App() {
  const [selectedSkinId, setSelectedSkinId] = useState(getInitialSkin);
  const [voiceStateIndex, setVoiceStateIndex] = useState(0);
  const [activeSheet, setActiveSheet] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [bookmarkedInsights, setBookmarkedInsights] = useState(getInitialBookmarks);
  const [voiceTransition, setVoiceTransition] = useState(null);
  const voiceTransitionTimerRef = useRef(null);

  // Real conversation state (replaces the old scripted demo question/response).
  const [threadId, setThreadId] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState("I'm glad you're here. Tap the orb and ask me anything about leadership.");
  const [currentInsight, setCurrentInsight] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Lets Brain personalize conversations across sessions (name, role, tone, etc.)
  const [userId] = useState(getInitialUserId);
  const [profile, setProfile] = useState(getInitialProfile);
  const [voiceEnabled, setVoiceEnabled] = useState(getInitialVoiceEnabled);
  const micSupported = useMemo(() => Boolean(getSpeechRecognitionCtor()), []);
  const recognitionRef = useRef(null);
  const streamAbortRef = useRef(null);
  const answerRef = useRef('');
  const audioElRef = useRef(null);
  const autoListenTimerRef = useRef(null);
  const voiceStateIndexRef = useRef(voiceStateIndex);

  const selectedSkin = useMemo(
    () => skins.find((skin) => skin.id === selectedSkinId) ?? skins[0],
    [selectedSkinId],
  );

  const voiceState = voiceStates[voiceStateIndex];

  useEffect(() => {
    voiceStateIndexRef.current = voiceStateIndex;
  }, [voiceStateIndex]);

  useEffect(() => {
    window.localStorage.setItem(SKIN_STORAGE_KEY, selectedSkinId);
  }, [selectedSkinId]);

  useEffect(() => {
    window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarkedInsights));
  }, [bookmarkedInsights]);

  useEffect(() => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    window.localStorage.setItem(VOICE_ENABLED_STORAGE_KEY, String(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const serverProfile = await getProfile(userId);
      if (cancelled || !serverProfile) return;
      // Server is the durable copy — prefer it over the local cache when it has data
      // (e.g. localStorage was cleared but Brain still remembers this userId).
      const hasData = Object.entries(serverProfile).some(([key, value]) => key !== 'userId' && value);
      if (hasData) setProfile((prev) => ({ ...prev, ...serverProfile }));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(
    () => () => {
      window.clearTimeout(voiceTransitionTimerRef.current);
      window.clearTimeout(autoListenTimerRef.current);
      recognitionRef.current?.abort();
      streamAbortRef.current?.abort();
      audioElRef.current?.pause();
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
        const { id, openingMessage } = await startConversation({ userId, ...profile });
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
    // Intentionally runs once on mount with whatever profile is cached locally at
    // that moment — later profile edits apply to the next reply via Brain's own
    // per-userId lookup, not by restarting the conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    window.clearTimeout(autoListenTimerRef.current);

    // Unlock audio playback on iOS Safari: a <audio> element can only start
    // playing programmatically later (after the async fetch/stream below) if
    // it already played once inside a real user gesture. Reusing this same
    // element in playSpokenAnswer carries that unlock forward.
    if (!audioElRef.current) audioElRef.current = new Audio();
    audioElRef.current.play().catch(() => {});
    audioElRef.current.pause();

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
    window.clearTimeout(autoListenTimerRef.current);
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
    if (!voiceEnabled) return;
    // No-op until voice is configured on the Brain side — fetchSpeech resolves to
    // null in that case, so this silently activates once voice is set up.
    const blob = await fetchSpeech(text);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    // Reuse the element unlocked in startListening — iOS Safari blocks playback
    // on a freshly created Audio() this far removed from the original tap gesture.
    const audio = audioElRef.current || new Audio();
    audioElRef.current = audio;
    audio.src = url;
    audio.addEventListener(
      'ended',
      () => {
        URL.revokeObjectURL(url);
        // iOS Safari requires SpeechRecognition.start() to trace back to a real
        // user gesture — a setTimeout-triggered call (no tap involved) silently
        // fails to actually engage the mic, even though nothing errors. So we
        // can't auto-resume listening here; instead, return to idle automatically
        // (skipping the old separate dismiss tap) and let one real tap start the
        // next turn, same as the reliable first-question flow.
        // Only fires if the user hasn't already interrupted or backed out.
        autoListenTimerRef.current = window.setTimeout(() => {
          if (voiceStateIndexRef.current === 3) moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
        }, 600);
      },
      { once: true },
    );
    audio.play().catch((err) => setErrorMessage(`Couldn't play audio: ${err.message}`));
  }

  function cycleVoiceState() {
    const currentState = voiceStates[voiceStateIndex].id;

    if (currentState === 'responding') {
      // Barge-in: interrupt Maxwell mid-answer (or right after) and go straight
      // back to listening, rather than making the user wait him out. Saving an
      // insight is now a separate action (the star button), not tied to this tap.
      window.clearTimeout(autoListenTimerRef.current);
      audioElRef.current?.pause();
      startListening();
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

  function handleSaveProfile(updates) {
    const next = { ...profile, ...updates, userId };
    setProfile(next);
    saveProfile(next);
  }

  function handleToggleVoiceEnabled() {
    setVoiceEnabled((current) => !current);
  }

  return (
    <VoiceAppShell
      activeTab={activeTab}
      bookmarkedInsights={bookmarkedInsights}
      demoQuestion={question}
      demoResponse={answer}
      currentInsightId={currentInsight?.id}
      errorMessage={errorMessage}
      profile={profile}
      userId={userId}
      onSaveProfile={handleSaveProfile}
      onProfileUpdated={setProfile}
      voiceEnabled={voiceEnabled}
      onToggleVoiceEnabled={handleToggleVoiceEnabled}
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
      onSelectTab={setActiveTab}
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

import { useEffect, useMemo, useRef, useState } from 'react';
import VoiceAppShell from './components/VoiceAppShell.jsx';
import {
  startConversation,
  streamMessage,
  fetchSpeech,
  getProfile,
  saveProfile,
  listConversations,
  getThread,
  getSavedInsights,
  saveInsight,
  deleteInsight,
  registerDevice,
  setUserToken,
} from './lib/brainClient.js';

// How long an idle conversation is still considered "the same sitting" and
// resumed on reload, vs. treated as a genuine return visit that gets Brain's
// personalized re-engagement opener (goal check-in / coaching summary recap)
// instead of silently dropping back into old context.
const RESUME_WINDOW_MS = 4 * 60 * 60 * 1000;

const SKIN_STORAGE_KEY = 'john-maxwell-voice-skin';
const BOOKMARK_STORAGE_KEY = 'john-maxwell-saved-insights';
const USER_ID_STORAGE_KEY = 'john-maxwell-user-id';
const PROFILE_STORAGE_KEY = 'john-maxwell-user-profile';
const VOICE_ENABLED_STORAGE_KEY = 'john-maxwell-voice-enabled';
const DEVICE_TOKEN_STORAGE_KEY = 'john-maxwell-device-token';
const ONBOARDING_DISMISSED_STORAGE_KEY = 'john-maxwell-onboarding-dismissed';

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
  const [citationCount, setCitationCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Lets Brain personalize conversations across sessions (name, role, tone, etc.)
  const [userId] = useState(getInitialUserId);
  const [tokenReady, setTokenReady] = useState(false);
  const [profile, setProfile] = useState(getInitialProfile);
  const [voiceEnabled, setVoiceEnabled] = useState(getInitialVoiceEnabled);
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => window.localStorage.getItem(ONBOARDING_DISMISSED_STORAGE_KEY) === 'true',
  );
  const micSupported = useMemo(() => Boolean(getSpeechRecognitionCtor()), []);
  const recognitionRef = useRef(null);
  const streamAbortRef = useRef(null);
  const answerRef = useRef('');
  const audioElRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const autoListenTimerRef = useRef(null);
  const listenTimeoutRef = useRef(null);
  const voiceStateIndexRef = useRef(voiceStateIndex);
  // TEMPORARY diagnostic trail for the "mic never re-engages" bug — records
  // which SpeechRecognition lifecycle events actually fire so the failure
  // mode is visible on-screen without needing a remote debugger. Remove once
  // root-caused.
  const micEventsRef = useRef([]);

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

  // Must resolve before any other Brain call that touches this user's data —
  // once a userId has a registered token, Brain requires it on every request.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = window.localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
        if (cached) {
          setUserToken(cached);
        } else {
          const token = await registerDevice(userId);
          if (cancelled) return;
          window.localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token);
          setUserToken(token);
        }
      } catch {
        // This userId is still unclaimed either way, so the first requests
        // as this user will succeed regardless — proceed and let normal
        // error handling surface anything if registration never recovers.
      } finally {
        if (!cancelled) setTokenReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!tokenReady) return;
    let cancelled = false;
    (async () => {
      const serverInsights = await getSavedInsights(userId);
      if (cancelled) return;
      if (serverInsights.length > 0) {
        setBookmarkedInsights(
          serverInsights.map((i) => ({
            id: i.id,
            text: i.text,
            date: new Date(i.createdAt * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }),
          })),
        );
      } else if (bookmarkedInsights.length > 0) {
        // One-time migration: this browser has local-only bookmarks from before
        // server sync existed. Push them up so they're not orphaned.
        bookmarkedInsights.forEach((insight) => saveInsight(userId, insight.id, insight.text));
      }
    })();
    return () => {
      cancelled = true;
    };
    // Runs once tokenReady flips true to hydrate/migrate; toggleInsightBookmark
    // keeps things in sync from then on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, tokenReady]);

  useEffect(() => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    window.localStorage.setItem(VOICE_ENABLED_STORAGE_KEY, String(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    if (!tokenReady) return;
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
  }, [userId, tokenReady]);

  useEffect(
    () => () => {
      window.clearTimeout(voiceTransitionTimerRef.current);
      window.clearTimeout(autoListenTimerRef.current);
      window.clearTimeout(listenTimeoutRef.current);
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
    if (!tokenReady) return;
    let cancelled = false;
    (async () => {
      try {
        const recentThreads = await listConversations(userId);
        const resumable = recentThreads.find(
          (t) => t.userTurnCount > 0 && Date.now() - t.updatedAt < RESUME_WINDOW_MS,
        );
        if (resumable) {
          const thread = await getThread(resumable.id);
          if (thread) {
            if (cancelled) return;
            const lastAssistant = [...thread.messages].reverse().find((m) => m.role === 'assistant');
            setThreadId(thread.id);
            setAnswer(lastAssistant?.content || "Welcome back — let's keep going.");
            return;
          }
        }
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
    // Runs once tokenReady flips true, with whatever profile is cached locally
    // at that moment — later profile edits apply to the next reply via Brain's
    // own per-userId lookup, not by restarting the conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenReady]);

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
    setQuestion('');
    window.clearTimeout(autoListenTimerRef.current);
    window.clearTimeout(listenTimeoutRef.current);
    // Defensive: covers the barge-in path (interrupting Maxwell mid-response),
    // where playback may not have reached its natural 'ended' event yet.
    releaseAudioSession();

    // Unlock audio playback on iOS Safari: a <audio> element can only start
    // playing programmatically later (after the async fetch/stream below) if
    // it already played once inside a real user gesture. Only needed once —
    // after that, real TTS playback keeps the element unlocked on its own.
    // Re-doing this play()/pause() dance on every tap (including immediately
    // after that same element just finished playing a real response) touches
    // the audio OUTPUT session milliseconds before requesting the microphone
    // INPUT session. On iOS the two share one audio session, and starting the
    // mic that soon after can silently fail to capture anything — the tap
    // registers, recognition.start() doesn't throw, the UI shows "Listening",
    // but no audio ever reaches it.
    if (!audioElRef.current) audioElRef.current = new Audio();
    if (!audioUnlockedRef.current) {
      audioElRef.current.play().catch(() => {});
      audioElRef.current.pause();
      audioUnlockedRef.current = true;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    micEventsRef.current = [];
    const logMicEvent = (name) => micEventsRef.current.push(name);
    recognition.onstart = () => logMicEvent('start');
    recognition.onaudiostart = () => logMicEvent('audiostart');
    recognition.onsoundstart = () => logMicEvent('soundstart');
    recognition.onspeechstart = () => logMicEvent('speechstart');
    recognition.onspeechend = () => logMicEvent('speechend');
    recognition.onsoundend = () => logMicEvent('soundend');
    recognition.onaudioend = () => logMicEvent('audioend');

    recognition.onresult = (event) => {
      logMicEvent('result');
      // Any result — even interim — proves the mic is actually capturing
      // audio, so the "silently never engaged" watchdog no longer applies.
      window.clearTimeout(listenTimeoutRef.current);
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      if (finalTranscript.trim()) {
        setQuestion(finalTranscript.trim());
        moveToVoiceState(2, 'listeningToReflecting', { transitionDuration: 360 });
        sendQuery(finalTranscript.trim());
      } else if (interimTranscript.trim()) {
        // Live preview only — not sent until a final result arrives, so the
        // user can see they're being heard while they're still talking.
        setQuestion(interimTranscript.trim());
      }
    };
    recognition.onerror = (event) => {
      window.clearTimeout(listenTimeoutRef.current);
      if (event.error === 'aborted') return;
      setErrorMessage(`Voice input error: ${event.error} [events: ${micEventsRef.current.join(',') || 'none'}]`);
      moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
    };
    recognition.onend = () => {
      recognitionRef.current = null;
    };

    moveToVoiceState(1, 'idleToListening', { transitionDuration: 620 });
    try {
      recognition.start();
      // Safety net: if the mic never actually engages (recognition.start()
      // succeeds but no result arrives — the exact "stuck on Listening"
      // symptom above), don't leave the user stuck with no feedback.
      listenTimeoutRef.current = window.setTimeout(() => {
        if (recognitionRef.current === recognition) {
          recognition.abort();
          recognitionRef.current = null;
          setErrorMessage(`Didn't catch that — tap to try again. [events: ${micEventsRef.current.join(',') || 'none'}]`);
          moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
        }
      }, 8000);
    } catch {
      setErrorMessage("Couldn't start the microphone. Check browser permissions.");
      moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
    }
  }

  function stopListening() {
    window.clearTimeout(autoListenTimerRef.current);
    window.clearTimeout(listenTimeoutRef.current);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 400 });
  }

  async function sendQuery(text) {
    setAnswer('');
    answerRef.current = '';
    setCurrentInsight(null);
    setCitationCount(0);
    streamAbortRef.current?.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;
    let respondingStarted = false;

    try {
      await streamMessage(threadId, text, {
        signal: controller.signal,
        onCitations: (citations) => {
          const real = (citations || []).filter((c) => c.chunkId);
          setCitationCount(real.length);
        },
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

  // iOS shares one audio session between <audio> playback and microphone
  // capture. Just calling .pause() leaves that session in the "playback"
  // category — it doesn't actually release it, so a mic request shortly after
  // can silently fail to receive any audio even though recognition.start()
  // doesn't throw. Clearing the src and calling .load() forces iOS to tear
  // the session down for real.
  function releaseAudioSession() {
    const audio = audioElRef.current;
    if (!audio) return;
    audio.pause();
    if (audio.hasAttribute('src')) {
      audio.removeAttribute('src');
      audio.load();
    }
  }

  async function playSpokenAnswer(text) {
    if (!voiceEnabled) return;
    const { blob, error } = await fetchSpeech(text);
    if (error) {
      setErrorMessage(`Couldn't play audio: ${error}`);
      return;
    }
    // No-op until voice is configured on the Brain side — fetchSpeech resolves to
    // a null blob with no error in that case, so this silently activates once
    // voice is set up, with no code changes needed here.
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
        // Release the audio session as soon as playback actually finishes —
        // well before the user's next tap — rather than waiting until they
        // tap again to discover the mic needs it released first.
        releaseAudioSession();
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
    const exists = bookmarkedInsights.some((item) => item.id === insight.id);
    if (exists) {
      deleteInsight(userId, insight.id);
    } else {
      saveInsight(userId, insight.id, insight.text);
    }
    setBookmarkedInsights((currentInsights) => {
      const stillExists = currentInsights.some((item) => item.id === insight.id);
      return stillExists
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

  function handleDismissOnboarding() {
    setOnboardingDismissed(true);
    window.localStorage.setItem(ONBOARDING_DISMISSED_STORAGE_KEY, 'true');
  }

  function handleDataDeleted() {
    // The server-side data is already gone at this point — clear everything
    // identity-related locally too and reload as a brand new anonymous user.
    // Cosmetic prefs (skin, voice on/off) aren't personal data, so they're left.
    window.localStorage.removeItem(USER_ID_STORAGE_KEY);
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    window.localStorage.removeItem(BOOKMARK_STORAGE_KEY);
    window.localStorage.removeItem(DEVICE_TOKEN_STORAGE_KEY);
    window.location.reload();
  }

  return (
    <VoiceAppShell
      activeTab={activeTab}
      bookmarkedInsights={bookmarkedInsights}
      demoQuestion={question}
      demoResponse={answer}
      currentInsightId={currentInsight?.id}
      citationCount={citationCount}
      errorMessage={errorMessage}
      profile={profile}
      userId={userId}
      onSaveProfile={handleSaveProfile}
      onProfileUpdated={setProfile}
      onDataDeleted={handleDataDeleted}
      voiceEnabled={voiceEnabled}
      onToggleVoiceEnabled={handleToggleVoiceEnabled}
      showOnboarding={!onboardingDismissed && !profile.firstName}
      onDismissOnboarding={handleDismissOnboarding}
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

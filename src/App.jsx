import { useEffect, useMemo, useRef, useState } from 'react';
import VoiceAppShell from './components/VoiceAppShell.jsx';

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

const demoQuestion = 'How do I become a better leader for my team?';
const demoResponse =
  'Leadership begins with influence, not position. When you add value to people, they will follow you anywhere.';

const voiceStates = [
  { id: 'idle', label: 'Ready when you are.', button: 'Tap to speak' },
  { id: 'listening', label: "I'm listening.", button: 'Listening' },
  { id: 'reflecting', label: 'Reflecting...', button: 'Reflecting' },
  { id: 'responding', label: 'Leadership begins with influence, not position...', button: 'Save insight' },
];

const journalEntries = [
  {
    id: 'accountability',
    date: 'June 23',
    title: 'Building Accountability in My Team',
    duration: '14 min',
    question: demoQuestion,
    response: demoResponse,
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
    },
    [],
  );

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

  function cycleVoiceState() {
    const currentState = voiceStates[voiceStateIndex].id;

    if (currentState === 'responding') {
      toggleInsightBookmark({
        id: 'demo-response',
        text: 'Leadership begins with influence, not position.',
        date: 'June 23',
      });
      moveToVoiceState(0, 'respondingToIdle', { transitionDuration: 1600 });
      return;
    }

    if (currentState === 'idle') {
      moveToVoiceState(1, 'idleToListening', { transitionDuration: 620 });
      return;
    }

    if (currentState === 'listening') {
      moveToVoiceState(2, 'listeningToReflecting', {
        delayStateChange: 760,
        transitionDuration: 360,
      });
      return;
    }

    if (currentState === 'reflecting') {
      moveToVoiceState(3, 'reflectingToResponding', { transitionDuration: 920 });
      return;
    }

    setVoiceStateIndex((currentIndex) => (currentIndex + 1) % voiceStates.length);
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
      demoQuestion={demoQuestion}
      demoResponse={demoResponse}
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
      onSelectVoiceState={(stateId) => {
        window.clearTimeout(voiceTransitionTimerRef.current);
        setVoiceTransition(null);
        setVoiceStateIndex(voiceStates.findIndex((state) => state.id === stateId));
      }}
    />
  );
}

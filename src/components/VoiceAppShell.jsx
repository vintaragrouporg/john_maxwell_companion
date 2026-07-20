import { useState } from 'react';
import SkinSelector from './SkinSelector.jsx';
import VoiceOrb from './VoiceOrb.jsx';
import CompassVisual from './CompassVisual.jsx';
import FlameVisual from './FlameVisual.jsx';
import BeaconVisual from './BeaconVisual.jsx';
import HeroVisual from './HeroVisual.jsx';
import VoiceWaveform from './VoiceWaveform.jsx';
import JournalScreen from './JournalScreen.jsx';
import InsightsScreen from './InsightsScreen.jsx';
import ProfileScreen from './ProfileScreen.jsx';

const visualBySkin = {
  circle: VoiceOrb,
  compass: CompassVisual,
  flame: FlameVisual,
  beacon: BeaconVisual,
};

export default function VoiceAppShell({
  activeTab,
  selectedJournalId,
  journalEntries,
  defaultInsights,
  bookmarkedInsights,
  demoQuestion,
  demoResponse,
  currentInsightId,
  errorMessage,
  skin,
  skins,
  voiceState,
  voiceTransition,
  voiceStates,
  activeSheet,
  onCycleVoiceState,
  onOpenSelector,
  onOpenSettings,
  onCloseSelector,
  onSelectSkin,
  onSelectTab,
  onSelectJournal,
  onBackToJournal,
  onToggleInsight,
  onSaveCurrentInsight,
  onSelectVoiceState,
}) {
  const CenterVisual = visualBySkin[skin.id] ?? VoiceOrb;
  const isDemoInsightSaved = Boolean(
    currentInsightId && bookmarkedInsights.some((insight) => insight.id === currentInsightId),
  );

  return (
    <main
      className={`appShell skin-${skin.id} state-${voiceState.id} ${
        voiceTransition ? `voiceTransition-${voiceTransition}` : ''
      }`}
      style={{ '--accent': skin.accent, '--secondary': skin.secondary }}
    >
      <div className="ambientGlow" aria-hidden="true" />
      <section className="phoneSurface" aria-label="John Maxwell voice coaching demo">
        <header className="appHeader">
          <button className="iconButton menuButton" type="button" onClick={onOpenSelector} aria-label="Open skin selector">
            <span />
            <span />
            <span />
          </button>
          <div className="brandLockup" aria-label="John Maxwell, Leadership. Impact. Growth.">
            <h1>John Maxwell</h1>
            <p>Leadership. Impact. Growth.</p>
          </div>
          <button className="iconButton settingsButton" type="button" onClick={onOpenSettings} aria-label="Open demo settings">
            <span className="gear" />
          </button>
        </header>

        {activeTab === 'home' && (
          <HomeScreen
            CenterVisual={CenterVisual}
            skin={skin}
            voiceState={voiceState}
            voiceTransition={voiceTransition}
            demoQuestion={demoQuestion}
            demoResponse={demoResponse}
            errorMessage={errorMessage}
            isDemoInsightSaved={isDemoInsightSaved}
            onSaveCurrentInsight={onSaveCurrentInsight}
            onCycleVoiceState={onCycleVoiceState}
          />
        )}

        {activeTab === 'journal' && (
          <JournalScreen
            entries={journalEntries}
            selectedEntryId={selectedJournalId}
            onSelectEntry={onSelectJournal}
            onBack={onBackToJournal}
            onToggleInsight={onToggleInsight}
            savedInsights={bookmarkedInsights}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsScreen
            defaultInsights={defaultInsights}
            savedInsights={bookmarkedInsights}
            onToggleInsight={onToggleInsight}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen skin={skin} onOpenSelector={onOpenSelector} onOpenSettings={onOpenSettings} />
        )}

        <BottomNav activeTab={activeTab} onSelectTab={onSelectTab} />
      </section>

      <SkinSelector
        skins={skins}
        activeSkinId={skin.id}
        voiceStates={voiceStates}
        activeVoiceStateId={voiceState.id}
        mode={activeSheet}
        isOpen={activeSheet !== null}
        onClose={onCloseSelector}
        onSelectSkin={onSelectSkin}
        onSelectVoiceState={onSelectVoiceState}
      />
    </main>
  );
}

function HomeScreen({
  CenterVisual,
  skin,
  voiceState,
  voiceTransition,
  demoQuestion,
  demoResponse,
  errorMessage,
  isDemoInsightSaved,
  onSaveCurrentInsight,
  onCycleVoiceState,
}) {
  const [isHeroPressed, setIsHeroPressed] = useState(false);
  const showTranscript = ['reflecting', 'responding'].includes(voiceState.id) && demoQuestion;
  const showResponse = voiceState.id === 'responding';

  return (
    <section className="homeScreen">
      <div
        className="visualStage"
        onPointerDown={() => setIsHeroPressed(true)}
        onPointerUp={() => setIsHeroPressed(false)}
        onPointerCancel={() => setIsHeroPressed(false)}
        onPointerLeave={() => setIsHeroPressed(false)}
      >
        <HeroVisual
          skin={skin}
          state={voiceState.id}
          transition={voiceTransition}
          isPressed={isHeroPressed}
          FallbackVisual={CenterVisual}
        />
      </div>

      <section className="voicePanel homeVoicePanel" aria-live="polite">
        <p className="stateCopy">{voiceState.label}</p>
        {errorMessage && <p className="errorCopy">{errorMessage}</p>}
        <VoiceWaveform skin={skin.id} state={voiceState.id} />

        <div className="conversationPreview">
          {showTranscript && (
            <article className="conversationCard transcriptCard">
              <span>You asked</span>
              <p>{demoQuestion}</p>
            </article>
          )}

          {showResponse && (
            <article className="conversationCard responseCard">
              <div>
                <span>John Maxwell</span>
                <button
                  className={`bookmarkButton ${isDemoInsightSaved ? 'isSaved' : ''}`}
                  type="button"
                  aria-label="Save response insight"
                  onClick={onSaveCurrentInsight}
                >
                  ☆
                </button>
              </div>
              <p>{demoResponse}</p>
            </article>
          )}
        </div>

        <button className="speakButton" type="button" onClick={onCycleVoiceState}>
          <span>{voiceState.button}</span>
        </button>
      </section>
    </section>
  );
}

function BottomNav({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'journal', label: 'Journal', icon: '▤' },
    { id: 'insights', label: 'Insights', icon: '✧' },
    { id: 'profile', label: 'Profile', icon: '○' },
  ];

  return (
    <nav className="bottomNav" aria-label="Primary navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'isActive' : ''}
          onClick={() => onSelectTab(tab.id)}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

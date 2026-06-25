export default function SkinSelector({
  skins,
  activeSkinId,
  voiceStates,
  activeVoiceStateId,
  mode,
  isOpen,
  onClose,
  onSelectSkin,
  onSelectVoiceState,
}) {
  const isSettingsMode = mode === 'settings';

  return (
    <>
      <button
        className={`sheetScrim ${isOpen ? 'isOpen' : ''}`}
        type="button"
        aria-label="Close skin selector"
        onClick={onClose}
      />
      <aside className={`skinSheet ${isOpen ? 'isOpen' : ''}`} aria-hidden={!isOpen}>
        <div className="sheetHandle" />
        <div className="sheetHeader">
          <div>
            <p className="eyebrow">{isSettingsMode ? 'Demo settings' : 'Visual skins'}</p>
            <h2>{isSettingsMode ? 'Conversation state' : 'Choose the presence'}</h2>
          </div>
          <button className="sheetClose" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {!isSettingsMode && (
          <div className="skinGrid">
            {skins.map((skin) => (
              <button
                key={skin.id}
                className={`skinChoice ${activeSkinId === skin.id ? 'isActive' : ''}`}
                type="button"
                style={{ '--choice-accent': skin.accent, '--choice-secondary': skin.secondary }}
                onClick={() => onSelectSkin(skin.id)}
              >
                <span className={`skinMini skinMini-${skin.id}`} />
                <span>
                  <small>{skin.concept}</small>
                  <strong>{skin.name}</strong>
                  <em>{skin.description}</em>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className={`statePicker ${isSettingsMode ? 'isSettingsPicker' : ''}`} aria-label="Demo state selector">
          {voiceStates.map((state) => (
            <button
              key={state.id}
              type="button"
              className={activeVoiceStateId === state.id ? 'isActive' : ''}
              onClick={() => onSelectVoiceState(state.id)}
            >
              {state.id}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}

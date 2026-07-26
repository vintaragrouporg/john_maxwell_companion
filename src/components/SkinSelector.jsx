import { useEffect, useRef } from 'react';

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
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <button
        className={`sheetScrim ${isOpen ? 'isOpen' : ''}`}
        type="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close skin selector"
        onClick={onClose}
      />
      <aside
        className={`skinSheet ${isOpen ? 'isOpen' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={isSettingsMode ? 'Conversation state' : 'Choose the presence'}
        aria-hidden={!isOpen}
      >
        <div className="sheetHandle" aria-hidden="true" />
        <div className="sheetHeader">
          <div>
            <p className="eyebrow">{isSettingsMode ? 'Demo settings' : 'Visual skins'}</p>
            <h2>{isSettingsMode ? 'Conversation state' : 'Choose the presence'}</h2>
          </div>
          <button
            className="sheetClose"
            type="button"
            ref={closeButtonRef}
            tabIndex={isOpen ? 0 : -1}
            onClick={onClose}
            aria-label="Close"
          >
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
                tabIndex={isOpen ? 0 : -1}
                aria-pressed={activeSkinId === skin.id}
                style={{ '--choice-accent': skin.accent, '--choice-secondary': skin.secondary }}
                onClick={() => onSelectSkin(skin.id)}
              >
                <span className={`skinMini skinMini-${skin.id}`} aria-hidden="true" />
                <span>
                  <small>{skin.concept}</small>
                  <strong>{skin.name}</strong>
                  <em>{skin.description}</em>
                </span>
              </button>
            ))}
          </div>
        )}

        <div
          className={`statePicker ${isSettingsMode ? 'isSettingsPicker' : ''}`}
          role="group"
          aria-label="Demo state selector"
        >
          {voiceStates.map((state) => (
            <button
              key={state.id}
              type="button"
              tabIndex={isOpen ? 0 : -1}
              className={activeVoiceStateId === state.id ? 'isActive' : ''}
              aria-pressed={activeVoiceStateId === state.id}
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

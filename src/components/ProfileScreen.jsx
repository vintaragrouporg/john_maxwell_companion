import { useEffect, useState } from 'react';

const TONE_OPTIONS = [
  { id: 'direct', label: 'Direct' },
  { id: 'empathetic', label: 'Empathetic' },
];

const BREVITY_OPTIONS = [
  { id: 'short', label: 'Short' },
  { id: 'normal', label: 'Normal' },
];

export default function ProfileScreen({
  skin,
  onOpenSelector,
  profile,
  onSaveProfile,
  voiceEnabled,
  onToggleVoiceEnabled,
}) {
  const [activeSection, setActiveSection] = useState(null);
  const backToProfile = () => setActiveSection(null);

  if (activeSection === 'voice') {
    return (
      <section className="productScreen">
        <div className="screenHeading detailHeading">
          <button className="backButton" type="button" onClick={backToProfile} aria-label="Back to profile">
            ‹
          </button>
          <div>
            <p className="eyebrow">Settings</p>
            <h2>Voice Preference</h2>
          </div>
        </div>
        <div className="detailStack">
          <article className="detailBlock">
            <span>Spoken responses</span>
            <p>When on, Maxwell's answers are read aloud after each response finishes streaming.</p>
          </article>
          <button className="settingsRow" type="button" onClick={onToggleVoiceEnabled}>
            <span>Spoken responses</span>
            <strong>{voiceEnabled ? 'On' : 'Off'}</strong>
          </button>
        </div>
      </section>
    );
  }

  if (activeSection === 'about') {
    return (
      <section className="productScreen">
        <div className="screenHeading detailHeading">
          <button className="backButton" type="button" onClick={backToProfile} aria-label="Back to profile">
            ‹
          </button>
          <div>
            <p className="eyebrow">About</p>
            <h2>John Maxwell</h2>
          </div>
        </div>
        <div className="detailStack">
          <article className="detailBlock">
            <p>
              John C. Maxwell is a leadership author, speaker, and coach whose teaching has shaped
              how generations of leaders think about influence, growth, and the character behind
              good leadership.
            </p>
          </article>
          <article className="detailBlock">
            <span>Core teaching</span>
            <p>
              "Everything rises and falls on leadership." Frameworks like the 5 Levels of
              Leadership and the Law of the Lid run through every conversation here.
            </p>
          </article>
          <article className="detailBlock">
            <span>This companion</span>
            <p>
              A voice-first coaching experience built to bring Maxwell's teaching into real,
              personal conversation — grounded in his own recorded material.
            </p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="productScreen profileScreen">
      <div className="profileMark" aria-hidden="true">JM</div>
      <div className="screenHeading profileHeading">
        <p className="eyebrow">Profile</p>
        <h2>{profile.firstName ? `Hi, ${profile.firstName}` : 'Your profile'}</h2>
      </div>

      <ProfileForm profile={profile} onSave={onSaveProfile} />

      <div className="settingsList">
        <button className="settingsRow" type="button" onClick={onOpenSelector}>
          <span>Preferred Skin</span>
          <strong>{skin.name}</strong>
        </button>
        <button className="settingsRow" type="button" onClick={() => setActiveSection('voice')}>
          <span>Voice Preference</span>
          <strong>{voiceEnabled ? 'On' : 'Off'}</strong>
        </button>
        <button className="settingsRow" type="button" onClick={() => setActiveSection('about')}>
          <span>About John Maxwell</span>
          <strong>Leadership. Impact. Growth.</strong>
        </button>
      </div>
    </section>
  );
}

function ProfileForm({ profile, onSave }) {
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  function updateField(field, value) {
    setSaved(false);
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(draft);
    setSaved(true);
  }

  return (
    <form className="profileForm" onSubmit={handleSubmit}>
      <label className="formField">
        <span>First name</span>
        <input
          type="text"
          value={draft.firstName || ''}
          onChange={(e) => updateField('firstName', e.target.value)}
          placeholder="What should Maxwell call you?"
        />
      </label>

      <label className="formField">
        <span>Role</span>
        <input
          type="text"
          value={draft.role || ''}
          onChange={(e) => updateField('role', e.target.value)}
          placeholder="e.g. Engineering Manager"
        />
      </label>

      <label className="formField">
        <span>What are you working on right now?</span>
        <textarea
          value={draft.currentChallenge || ''}
          onChange={(e) => updateField('currentChallenge', e.target.value)}
          placeholder="The leadership challenge on your mind"
          rows={3}
        />
      </label>

      <div className="formSegmentGroup">
        <span>Coaching tone</span>
        <div className="segmentedControl">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={draft.tonePref === opt.id ? 'isActive' : ''}
              onClick={() => updateField('tonePref', opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="formSegmentGroup">
        <span>Response length</span>
        <div className="segmentedControl">
          {BREVITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={draft.brevityPref === opt.id ? 'isActive' : ''}
              onClick={() => updateField('brevityPref', opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button className="profileSaveButton" type="submit">
        {saved ? 'Saved' : 'Save profile'}
      </button>
    </form>
  );
}

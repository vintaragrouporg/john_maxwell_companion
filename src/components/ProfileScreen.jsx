import { useEffect, useState } from 'react';
import { getGoals, createGoal, setGoalStatus, deleteAllData } from '../lib/brainClient.js';

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
  userId,
  profile,
  onSaveProfile,
  voiceEnabled,
  onToggleVoiceEnabled,
  onDataDeleted,
}) {
  const [activeSection, setActiveSection] = useState(null);
  const backToProfile = () => setActiveSection(null);

  if (activeSection === 'delete') {
    return (
      <section className="productScreen">
        <div className="screenHeading detailHeading">
          <button className="backButton" type="button" onClick={backToProfile} aria-label="Back to profile">
            ‹
          </button>
          <div>
            <p className="eyebrow">Settings</p>
            <h2>Delete My Data</h2>
          </div>
        </div>
        <DeleteDataSection userId={userId} onDataDeleted={onDataDeleted} />
      </section>
    );
  }

  if (activeSection === 'goals') {
    return (
      <section className="productScreen">
        <div className="screenHeading detailHeading">
          <button className="backButton" type="button" onClick={backToProfile} aria-label="Back to profile">
            ‹
          </button>
          <div>
            <p className="eyebrow">Settings</p>
            <h2>My Goals</h2>
          </div>
        </div>
        <GoalsSection userId={userId} />
      </section>
    );
  }

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
          <button className="settingsRow" type="button" aria-pressed={voiceEnabled} onClick={onToggleVoiceEnabled}>
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
        <button className="settingsRow" type="button" onClick={() => setActiveSection('goals')}>
          <span>My Goals</span>
          <strong>Track &amp; check in</strong>
        </button>
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
        <button className="settingsRow" type="button" onClick={() => setActiveSection('delete')}>
          <span>Delete My Data</span>
          <strong>Permanent</strong>
        </button>
      </div>
    </section>
  );
}

function DeleteDataSection({ userId, onDataDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteAllData(userId);
      onDataDeleted();
    } catch (err) {
      setError(err?.message || "Couldn't delete your data — try again.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="detailStack">
      <article className="detailBlock">
        <p>
          This permanently deletes your profile, goals, reflection answers, saved insights, and
          every conversation with Maxwell. There's no undo — you'll start over as a brand new,
          anonymous user.
        </p>
      </article>
      {error && <p className="errorCopy">{error}</p>}
      <button
        className={`dangerButton ${confirming ? 'isConfirming' : ''}`}
        type="button"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? 'Deleting…' : confirming ? 'Tap again to permanently delete' : 'Delete everything'}
      </button>
    </div>
  );
}

function GoalsSection({ userId }) {
  const [goals, setGoals] = useState(null); // null = loading
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const active = await getGoals(userId);
      if (!cancelled) setGoals(active);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleAdd(event) {
    event.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { id } = await createGoal(userId, title.trim());
      setGoals((prev) => [{ id, title: title.trim(), status: 'active' }, ...(prev || [])]);
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAchieve(goal) {
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    await setGoalStatus(goal.id, 'achieved');
  }

  return (
    <>
      <form className="profileForm" onSubmit={handleAdd}>
        <label className="formField">
          <span>Add a goal</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Have the hard conversation with my report"
          />
        </label>
        <button className="profileSaveButton" type="submit" disabled={submitting || !title.trim()}>
          {submitting ? 'Adding…' : 'Add goal'}
        </button>
      </form>

      {goals === null && (
        <article className="detailBlock">
          <p>Loading your goals…</p>
        </article>
      )}

      {goals !== null && goals.length === 0 && (
        <article className="detailBlock">
          <p>No active goals yet. Add one above, and Maxwell will check in on it in a future conversation.</p>
        </article>
      )}

      {goals !== null && goals.length > 0 && (
        <div className="detailStack">
          {goals.map((goal) => (
            <article key={goal.id ?? goal.title} className="detailBlock goalBlock">
              <p>{goal.title}</p>
              {goal.id && (
                <button className="achieveButton" type="button" onClick={() => handleAchieve(goal)}>
                  Mark achieved
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </>
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
        <div className="segmentedControl" role="group" aria-label="Coaching tone">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={draft.tonePref === opt.id ? 'isActive' : ''}
              aria-pressed={draft.tonePref === opt.id}
              onClick={() => updateField('tonePref', opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="formSegmentGroup">
        <span>Response length</span>
        <div className="segmentedControl" role="group" aria-label="Response length">
          {BREVITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={draft.brevityPref === opt.id ? 'isActive' : ''}
              aria-pressed={draft.brevityPref === opt.id}
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

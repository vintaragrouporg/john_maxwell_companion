import { useEffect, useMemo, useState } from 'react';
import { submitReflection, getReflectionAnswers } from '../lib/brainClient.js';
import { REFLECTION_QUESTIONS } from '../lib/reflectionQuestions.js';

const FIELD_LABELS = {
  firstName: 'Name',
  role: 'Role',
  industry: 'Industry',
  currentChallenge: 'Current challenge',
  goals: 'Goals',
  tonePref: 'Coaching tone',
  brevityPref: 'Response length',
};

export default function InsightsScreen({ userId, profile, onProfileUpdated }) {
  const [answeredIds, setAnsweredIds] = useState(null); // null = still loading
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastLearned, setLastLearned] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const answers = await getReflectionAnswers(userId);
      if (!cancelled) setAnsweredIds(new Set(answers.map((a) => a.questionId)));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const nextQuestion = useMemo(() => {
    if (!answeredIds) return null;
    return REFLECTION_QUESTIONS.find((q) => !answeredIds.has(q.id)) ?? null;
  }, [answeredIds]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!nextQuestion || !draft.trim() || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await submitReflection(userId, nextQuestion.id, nextQuestion.text, draft.trim());
      onProfileUpdated(result.profile);
      setAnsweredIds((prev) => new Set(prev).add(nextQuestion.id));
      const learnedFields = Object.keys(result.profileUpdates || {});
      setLastLearned(learnedFields.length ? learnedFields.map((f) => FIELD_LABELS[f] || f) : null);
      setDraft('');
    } catch (err) {
      setErrorMessage(err?.message || "Couldn't save that answer — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalAnswered = answeredIds ? answeredIds.size : 0;

  return (
    <section className="productScreen">
      <div className="screenHeading">
        <p className="eyebrow">Insights</p>
        <h2>Your leadership profile</h2>
        <span>A running reflection — each answer helps Maxwell know you better.</span>
      </div>

      {profile?.profileNarrative && (
        <article className="detailBlock narrativeBlock">
          <span>What we know so far</span>
          <p>{profile.profileNarrative}</p>
        </article>
      )}

      {lastLearned && (
        <article className="detailBlock learnedBlock">
          <p>✓ Updated: {lastLearned.join(', ')}</p>
        </article>
      )}

      {answeredIds === null && (
        <article className="detailBlock">
          <p>Loading your reflection progress…</p>
        </article>
      )}

      {answeredIds !== null && nextQuestion && (
        <form className="profileForm reflectionForm" onSubmit={handleSubmit}>
          <label className="formField">
            <span>
              Question {totalAnswered + 1} of {REFLECTION_QUESTIONS.length}
            </span>
            <p className="reflectionQuestion">{nextQuestion.text}</p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Answer in your own words…"
              rows={4}
              autoFocus
            />
          </label>
          {errorMessage && <p className="errorCopy">{errorMessage}</p>}
          <button className="profileSaveButton" type="submit" disabled={submitting || !draft.trim()}>
            {submitting ? 'Saving…' : 'Continue'}
          </button>
        </form>
      )}

      {answeredIds !== null && !nextQuestion && (
        <article className="detailBlock">
          <span>All caught up</span>
          <p>
            You've answered every reflection question for now. Come back after your next few
            conversations — your profile keeps growing from here.
          </p>
        </article>
      )}
    </section>
  );
}

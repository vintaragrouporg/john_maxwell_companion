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

// Answers come back in chronological order, and revisiting a question inserts
// a new row rather than overwriting — keep only the latest per question.
function dedupeToLatest(answers) {
  const byQuestion = new Map();
  for (const a of answers) byQuestion.set(a.questionId, a);
  return Array.from(byQuestion.values());
}

export default function InsightsScreen({ userId, profile, onProfileUpdated }) {
  const [pastAnswers, setPastAnswers] = useState(null); // null = still loading
  const [revisitingId, setRevisitingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastLearned, setLastLearned] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const answers = await getReflectionAnswers(userId);
      if (!cancelled) setPastAnswers(dedupeToLatest(answers));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const answeredIds = useMemo(() => new Set((pastAnswers || []).map((a) => a.questionId)), [pastAnswers]);

  const nextQuestion = useMemo(() => {
    if (!pastAnswers) return null;
    return REFLECTION_QUESTIONS.find((q) => !answeredIds.has(q.id)) ?? null;
  }, [pastAnswers, answeredIds]);

  const activeQuestion = revisitingId ? REFLECTION_QUESTIONS.find((q) => q.id === revisitingId) : nextQuestion;
  const isRevisit = Boolean(revisitingId);

  function startRevisit(questionId) {
    const previous = pastAnswers.find((a) => a.questionId === questionId);
    setRevisitingId(questionId);
    setDraft(previous?.answer || '');
    setErrorMessage(null);
    setLastLearned(null);
  }

  function cancelRevisit() {
    setRevisitingId(null);
    setDraft('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!activeQuestion || !draft.trim() || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await submitReflection(userId, activeQuestion.id, activeQuestion.text, draft.trim());
      onProfileUpdated(result.profile);
      setPastAnswers((prev) =>
        dedupeToLatest([
          ...(prev || []),
          { questionId: activeQuestion.id, question: activeQuestion.text, answer: draft.trim(), createdAt: Date.now() / 1000 },
        ]),
      );
      const learnedFields = Object.keys(result.profileUpdates || {});
      setLastLearned(learnedFields.length ? learnedFields.map((f) => FIELD_LABELS[f] || f) : null);
      setDraft('');
      setRevisitingId(null);
    } catch (err) {
      setErrorMessage(err?.message || "Couldn't save that answer — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalAnswered = pastAnswers ? pastAnswers.length : 0;
  const allAnswered = pastAnswers !== null && !nextQuestion;

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

      {pastAnswers === null && (
        <article className="detailBlock">
          <p>Loading your reflection progress…</p>
        </article>
      )}

      {allAnswered && (
        <article className="detailBlock learnedBlock">
          <span>You're all caught up</span>
          <p>
            You've reflected on everything Maxwell's asked so far. Your circumstances change —
            revisit any answer below whenever something shifts, and check back for new questions
            as they're added.
          </p>
        </article>
      )}

      {pastAnswers !== null && activeQuestion && (
        <form className="profileForm reflectionForm" onSubmit={handleSubmit}>
          <label className="formField">
            <span>
              {isRevisit ? 'Revisiting' : `Question ${totalAnswered + 1} of ${REFLECTION_QUESTIONS.length}`}
            </span>
            <p className="reflectionQuestion">{activeQuestion.text}</p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Answer in your own words…"
              rows={4}
              autoFocus
            />
          </label>
          {errorMessage && <p className="errorCopy">{errorMessage}</p>}
          <div className="reflectionFormActions">
            <button className="profileSaveButton" type="submit" disabled={submitting || !draft.trim()}>
              {submitting ? 'Saving…' : isRevisit ? 'Update answer' : 'Continue'}
            </button>
            {isRevisit && (
              <button type="button" className="reflectionCancel" onClick={cancelRevisit} disabled={submitting}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {pastAnswers && pastAnswers.length > 0 && !isRevisit && (
        <div className="savedHighlightsSection">
          <div className="screenHeading">
            <p className="eyebrow">Your reflections</p>
            <h2>Answers so far</h2>
          </div>
          <div className="detailStack">
            {pastAnswers.map((a) => (
              <article key={a.questionId} className="detailBlock reflectionHistoryBlock">
                <span>{a.question}</span>
                <p>{a.answer}</p>
                <button type="button" className="achieveButton" onClick={() => startRevisit(a.questionId)}>
                  Revisit
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

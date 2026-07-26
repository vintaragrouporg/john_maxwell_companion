import { useEffect, useState } from 'react';
import { listConversations, getThread } from '../lib/brainClient.js';

export default function JournalScreen({ userId, bookmarkedInsights, onToggleInsight }) {
  const [threads, setThreads] = useState(null); // null = still loading
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await listConversations(userId);
      if (!cancelled) setThreads(all.filter((t) => t.userTurnCount > 0));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function openThread(id) {
    setSelectedThreadId(id);
    setLoadingDetail(true);
    const thread = await getThread(id);
    setSelectedThread(thread);
    setLoadingDetail(false);
  }

  function backToList() {
    setSelectedThreadId(null);
    setSelectedThread(null);
  }

  if (selectedThreadId) {
    return (
      <section className="productScreen journalDetailScreen">
        <div className="screenHeading detailHeading">
          <button className="backButton" type="button" onClick={backToList} aria-label="Back to journal">
            ‹
          </button>
          <div>
            <p className="eyebrow">Conversation</p>
            <h2>{selectedThread ? formatDate(selectedThread.createdAt) : 'Loading…'}</h2>
          </div>
        </div>

        {loadingDetail && (
          <article className="detailBlock">
            <p>Loading…</p>
          </article>
        )}

        {selectedThread && (
          <div className="detailStack">
            {selectedThread.messages.map((msg, i) =>
              msg.role === 'user' ? (
                <DetailBlock key={i} label="You asked" text={msg.content} />
              ) : (
                <article key={i} className="detailBlock maxwellBlock">
                  <span>John Maxwell</span>
                  <p>{msg.content}</p>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="productScreen">
      <div className="screenHeading">
        <p className="eyebrow">Leadership journal</p>
        <h2>Previous conversations</h2>
      </div>

      {threads === null && (
        <article className="detailBlock">
          <p>Loading your conversations…</p>
        </article>
      )}

      {threads !== null && threads.length === 0 && (
        <article className="detailBlock">
          <p>No conversations yet — ask Maxwell something on the Home tab to get started.</p>
        </article>
      )}

      {threads !== null && threads.length > 0 && (
        <div className="journalList">
          {threads.map((t) => (
            <button key={t.id} className="journalEntry" type="button" onClick={() => openThread(t.id)}>
              <span className="entryIcon" aria-hidden="true">◇</span>
              <span>
                <small>
                  {formatDate(t.createdAt)} · {t.userTurnCount} exchange{t.userTurnCount === 1 ? '' : 's'}
                </small>
                <strong>Conversation</strong>
              </span>
            </button>
          ))}
        </div>
      )}

      {bookmarkedInsights.length > 0 && (
        <section className="savedHighlightsSection">
          <div className="screenHeading">
            <p className="eyebrow">Saved highlights</p>
            <h2>Moments worth revisiting</h2>
          </div>
          <div className="insightList">
            {bookmarkedInsights.map((insight) => (
              <article key={insight.id} className="insightCard">
                <div>
                  <span aria-hidden="true">&ldquo;</span>
                  <button
                    className="bookmarkButton isSaved"
                    type="button"
                    aria-label="Remove saved insight"
                    aria-pressed="true"
                    onClick={() => onToggleInsight(insight)}
                  >
                    <span aria-hidden="true">☆</span>
                  </button>
                </div>
                <p>{insight.text}</p>
                <small>{insight.date}</small>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function DetailBlock({ label, text }) {
  return (
    <article className="detailBlock">
      <span>{label}</span>
      <p>{text}</p>
    </article>
  );
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export default function JournalScreen({
  entries,
  selectedEntryId,
  onSelectEntry,
  onBack,
  onToggleInsight,
  savedInsights,
}) {
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId);

  if (selectedEntry) {
    const saved = savedInsights.some((insight) => insight.id === `journal-${selectedEntry.id}`);

    return (
      <section className="productScreen journalDetailScreen">
        <div className="screenHeading detailHeading">
          <button className="backButton" type="button" onClick={onBack} aria-label="Back to journal">
            ‹
          </button>
          <div>
            <p className="eyebrow">Conversation detail</p>
            <h2>{selectedEntry.title}</h2>
            <span>{selectedEntry.date} · {selectedEntry.duration}</span>
          </div>
        </div>

        <div className="detailStack">
          <DetailBlock label="You asked" text={selectedEntry.question} />
          <article className="detailBlock maxwellBlock">
            <div>
              <span>John Maxwell</span>
              <button
                className={`bookmarkButton ${saved ? 'isSaved' : ''}`}
                type="button"
                aria-label="Save journal insight"
                onClick={() =>
                  onToggleInsight({
                    id: `journal-${selectedEntry.id}`,
                    text: selectedEntry.takeaway,
                    date: selectedEntry.date,
                  })
                }
              >
                ☆
              </button>
            </div>
            <p>{selectedEntry.response}</p>
          </article>
          <DetailBlock label="Key takeaway" text={selectedEntry.takeaway} />
          <DetailBlock label="Action step" text="Identify one leadership behavior you can model this week." />
        </div>
      </section>
    );
  }

  return (
    <section className="productScreen">
      <div className="screenHeading">
        <p className="eyebrow">Leadership journal</p>
        <h2>Previous conversations</h2>
      </div>

      <div className="journalList">
        {entries.map((entry) => (
          <button key={entry.id} className="journalEntry" type="button" onClick={() => onSelectEntry(entry.id)}>
            <span className="entryIcon">◇</span>
            <span>
              <small>{entry.date} · {entry.duration}</small>
              <strong>{entry.title}</strong>
            </span>
          </button>
        ))}
      </div>
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

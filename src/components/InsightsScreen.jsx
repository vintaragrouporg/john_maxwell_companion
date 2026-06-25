export default function InsightsScreen({ defaultInsights, savedInsights, onToggleInsight }) {
  const insights = [
    ...savedInsights,
    ...defaultInsights.filter((insight) => !savedInsights.some((saved) => saved.id === insight.id)),
  ];

  return (
    <section className="productScreen">
      <div className="screenHeading">
        <p className="eyebrow">Saved insights</p>
        <h2>Moments worth revisiting</h2>
      </div>

      <div className="insightList">
        {insights.map((insight) => {
          const saved = savedInsights.some((item) => item.id === insight.id);

          return (
            <article key={insight.id} className="insightCard">
              <div>
                <span>“</span>
                <button
                  className={`bookmarkButton ${saved ? 'isSaved' : ''}`}
                  type="button"
                  aria-label="Toggle saved insight"
                  onClick={() => onToggleInsight(insight)}
                >
                  ☆
                </button>
              </div>
              <p>{insight.text}</p>
              <small>{insight.date}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

import React, { useState } from 'react';

export default function SeabedSummary({ commits, currentRepoId }) {
  const [summaryText, setSummaryText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);

    let summary = null;
    if (currentRepoId) {
      try {
        const res = await fetch(`/api/repos/${currentRepoId}/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.summary) {
            summary = json.data.summary;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Gemini summary from backend:', err.message);
      }
    }

    if (!summary) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      summary = `You've reached the ocean floor.\n\nWhat began as a few scattered shells slowly became a living reef. Small fixes strengthened the currents, new creatures appeared, forgotten paths were rediscovered, and the project learned to breathe on its own.\n\nEvery commit left a footprint beneath the waves. Together they became the story of this repository.`;
    }

    setSummaryText(summary);
    setLoading(false);
  };

  const finalMeters = (commits.length || 1) * 50;

  return (
    <section className="gemini-zone seabed-summary">
      <span className="gemini-star">✦</span>
      <p className="eyebrow">// DEEPEST OCEAN FLOOR · <span id="finalDepth">{finalMeters} M</span></p>
      <h2>BENEATH THE OCEAN</h2>
      <p>
        You've reached the deepest point of your expedition after replaying the repository's history.
        Reflect on the memories left behind as the ocean reveals the true story of this codebase.
      </p>
      <button
        className="primary-button"
        id="summarizeButton"
        onClick={handleSummarize}
        disabled={loading}
      >
        {loading
          ? '✦ LISTENING TO THE DEEP OCEAN…'
          : summaryText
          ? '✦ STORY UNVEILED'
          : '✦ REVEAL OCEAN CHRONICLE'}
      </button>
      <small>UNDERWATER EXPEDITION COMPLETE · GOOGLE GEMINI NARRATOR</small>

      {summaryText && (
        <div className="summary-output" id="summaryOutput">
          <span>✦ OCEAN FLOOR CHRONICLE</span>
          <p id="summaryText" style={{ whitespace: 'pre-line' }}>{summaryText}</p>
        </div>
      )}
    </section>
  );
}

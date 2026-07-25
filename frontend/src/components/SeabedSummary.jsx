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
      await new Promise((resolve) => setTimeout(resolve, 900));
      summary = `Across ${commits.length} commits, this project evolved from its initial foundation into an interactive GitHub journey. The work focused on repository exploration, pixel-art ocean design, accessible swim navigation, detailed change inspection, and a prepared Gemini summary flow.`;
    }

    setSummaryText(summary);
    setLoading(false);
  };

  const finalMeters = commits.length * 40;

  return (
    <section className="gemini-zone seabed-summary">
      <span className="gemini-star">✦</span>
      <p className="eyebrow">// FINAL DEPTH · <span id="finalDepth">{finalMeters} M</span></p>
      <h2>BENEATH THE OCEAN</h2>
      <p>
        You reached the end of the repository. Send every commit and change to your Google Gemini
        integration for one complete project summary.
      </p>
      <button
        className="primary-button"
        id="summarizeButton"
        onClick={handleSummarize}
        disabled={loading}
      >
        {loading ? '✦ GEMINI IS EXPLORING…' : summaryText ? '✦ SUMMARY COMPLETE' : '✦ SUMMARIZE EVERYTHING'}
      </button>
      <small>FRONTEND DEMO · CONNECT YOUR GOOGLE API ENDPOINT HERE</small>

      {summaryText && (
        <div className="summary-output" id="summaryOutput">
          <span>GEMINI SUMMARY</span>
          <p id="summaryText">{summaryText}</p>
        </div>
      )}
    </section>
  );
}

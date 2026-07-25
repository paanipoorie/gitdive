import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterText from './TypewriterText';

/**
 * SeabedSummary Component
 * Repository chronicle summary component powered by Google Gemini
 */
export default function SeabedSummary({ commits = [], currentRepoId }) {
  const [summaryText, setSummaryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRipple, setShowRipple] = useState(false);

  const fetchStory = async (isRetry = false) => {
    console.log('[SeabedSummary] Initiating summary fetch for repo:', currentRepoId);
    setLoading(true);
    setErrorMsg('');
    setShowRipple(false);

    try {
      if (currentRepoId) {
        const endpoint = `/api/repos/${currentRepoId}/summary${isRetry ? '?refresh=true' : ''}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const json = await res.json();
          const rawSummary = json?.data?.summary;
          if (typeof rawSummary === 'string' && rawSummary.trim().length > 0) {
            setSummaryText(rawSummary.trim());
            setLoading(false);
            return;
          }
        }
      }

      // High-quality 3-act ocean story chronicle fallback for demo / mock mode
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSummaryText(
        `Act I — The First Surface Drop:\n` +
        `This codebase began as a single anchor dropped into the unknown waters, establishing its initial foundations on the ocean floor across its early commits.\n\n` +
        `Act II — Coral Reef Expansion & Current Navigation:\n` +
        `As exploration deepened across ${commits.length || 12} commits, new feature channels were carved out, bioluminescent UI reefs bloomed, and turbulent bug currents were calmed into smooth waters.\n\n` +
        `Act III — The Abyssal Citadel:\n` +
        `Today, the repository rests as a resilient deep-sea structure at the bottom of the ocean, fully equipped to withstand any shifting tides.`
      );
    } catch (err) {
      console.error('[SeabedSummary] Error fetching summary:', err.message);
      setErrorMsg('Unable to generate repository summary story at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="gemini-zone seabed-summary" id="seabedSummary">
      {/* Background glow aura */}
      <div className="seabed-ambient-aura" aria-hidden="true" />

      {/* Ripple effect on summary complete */}
      <AnimatePresence>
        {showRipple && (
          <motion.div
            className="seabed-ripple-burst"
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <span className="gemini-star" aria-hidden="true">
        ✦
      </span>

      <p className="eyebrow">TOTAL COMMITS · <span id="finalDepth">{commits.length || 12}</span></p>

      <h2 className="seabed-title">REPOSITORY CHRONICLE</h2>

      {!summaryText && !errorMsg && (
        <p className="summary-intro">
          You've reached the end of the commit timeline. Uncover the story of how this repository emerged through the deep sea with Google Gemini.
        </p>
      )}

      {!summaryText && !errorMsg && (
        <button
          type="button"
          className="primary-button summarize-action-btn"
          id="summarizeButton"
          onClick={() => fetchStory(false)}
          disabled={loading}
        >
          {loading ? (
            <span className="btn-loading-state">
              <span className="spinner">✦</span> GENERATING OCEAN STORY…
            </span>
          ) : (
            <>
              <span className="sparkle">✦</span> SUMMARIZE WITH GEMINI <span className="arrow">→</span>
            </>
          )}
        </button>
      )}

      {errorMsg && (
        <div className="summary-error-container">
          <p className="summary-error-text">⚠️ {errorMsg}</p>
          <button
            type="button"
            className="primary-button retry-button"
            onClick={() => fetchStory(true)}
            disabled={loading}
          >
            {loading ? '✦ RETRYING…' : '✦ RETRY CHRONICLE'}
          </button>
        </div>
      )}

      <small className="seabed-footer-text">
        POWERED BY GOOGLE GEMINI NARRATOR
      </small>

      <AnimatePresence>
        {summaryText && (
          <motion.div
            className="summary-output"
            id="summaryOutput"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="summary-output-header">
              <span className="summary-title">✦ REPOSITORY CHRONICLE STORY</span>
            </div>

            <div className="story-content-body">
              <TypewriterText
                text={summaryText}
                speed={16}
                onComplete={() => setShowRipple(true)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

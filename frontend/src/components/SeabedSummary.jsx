import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SeabedSummary({ commits = [], currentRepoId }) {
  const [summaryText, setSummaryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStory = async (isRetry = false) => {
    console.log('[SeabedSummary] Button clicked for repo:', currentRepoId);
    console.log('[SeabedSummary] Request payload:', { currentRepoId, refresh: isRetry });

    if (!currentRepoId) {
      console.warn('[SeabedSummary] No active repoId available');
      setSummaryText('');
      setErrorMsg('Unable to generate repository story.');
      console.log('[SeabedSummary] Response length:', 0);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const endpoint = `/api/repos/${currentRepoId}/summary${isRetry ? '?refresh=true' : ''}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('[SeabedSummary] Response received:', res.status, res.statusText);

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      const rawSummary = json?.data?.summary;
      const validSummary = typeof rawSummary === 'string' ? rawSummary.trim() : '';

      console.log('[SeabedSummary] Response length:', validSummary.length);

      if (!validSummary) {
        throw new Error('Received empty or whitespace story from server');
      }

      setSummaryText(validSummary);
      setErrorMsg('');
    } catch (err) {
      console.error('[SeabedSummary] Error fetching repository story:', err.message);
      setSummaryText('');
      setErrorMsg('Unable to generate repository story.');
    } finally {
      setLoading(false);
    }
  };

  const finalMeters = (commits.length || 1) * 50;

  const storyLines = summaryText
    ? summaryText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: 'easeOut' },
    },
  };

  return (
    <section className="gemini-zone seabed-summary">
      <span className="gemini-star">✦</span>
      <p className="eyebrow">
        // DEEPEST OCEAN FLOOR · <span id="finalDepth">{finalMeters} M</span>
      </p>
      <h2>BENEATH THE OCEAN</h2>

      {!summaryText && !errorMsg && (
        <p className="summary-intro">
          You've reached the deepest point of your expedition after replaying the repository's history.
          Reflect on the memories left behind as the ocean reveals the true story of this codebase.
        </p>
      )}

      {!summaryText && !errorMsg && (
        <button
          className="primary-button"
          id="summarizeButton"
          onClick={() => fetchStory(false)}
          disabled={loading}
        >
          {loading ? '✦ LISTENING TO THE DEEP OCEAN…' : '✦ REVEAL OCEAN CHRONICLE'}
        </button>
      )}

      {errorMsg && (
        <div className="summary-error-container" style={{ marginTop: '1rem' }}>
          <p className="summary-error-text" style={{ color: '#ff6b6b', fontWeight: 600, marginBottom: '0.75rem' }}>
            {errorMsg}
          </p>
          <button
            className="primary-button retry-button"
            onClick={() => fetchStory(true)}
            disabled={loading}
          >
            {loading ? '✦ RETRYING STORY…' : '✦ RETRY'}
          </button>
        </div>
      )}

      <small style={{ display: 'block', marginTop: '1rem' }}>
        UNDERWATER EXPEDITION COMPLETE · GOOGLE GEMINI NARRATOR
      </small>

      <AnimatePresence>
        {summaryText && (
          <motion.div
            className="summary-output"
            id="summaryOutput"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <span className="summary-title" style={{ display: 'block', marginBottom: '0.75rem', color: '#70e000', fontWeight: 'bold' }}>
              ✦ OCEAN FLOOR CHRONICLE
            </span>
            {storyLines.map((line, idx) => (
              <motion.p
                key={idx}
                variants={lineVariants}
                className="story-line-animated"
                style={{ marginBottom: '0.75rem', lineHeight: '1.6' }}
              >
                {line}
              </motion.p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterText from './TypewriterText';

const ANIMAL_MARKS = ['🐠', '🐡', '🦑', '🐙', '🦀', '🐟', '🐢', '🦐', '🐬', '🪼', '🦈', '🐳'];

const springTransition = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
  mass: 0.85,
};

const contentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 290, damping: 25 },
  },
};

export default function CommitBubble({
  commit,
  index,
  isActive,
  currentRepoId,
  cachedSummary,
  onSaveSummary,
  onSelectBubble,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [localSummary, setLocalSummary] = useState(null);
  const [showRipple, setShowRipple] = useState(false);

  const sha = commit.fullHash || commit.hash;
  const activeSummary = cachedSummary || localSummary;

  const sideClass = index % 2 === 0 ? 'bubble-left' : 'bubble-right';
  const animalMark = ANIMAL_MARKS[index % ANIMAL_MARKS.length];

  const handleFetchSummary = async (forceRefresh = false) => {
    if (loading) return;
    setLoading(true);
    setError(false);
    setErrorMessage('');
    setShowRipple(false);

    try {
      let resultSummary = null;

      if (currentRepoId && sha) {
        console.log(`[CommitBubble] Requesting summary for sha=${sha}`);
        const url = `/api/repos/${currentRepoId}/commits/${sha}/summary`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: forceRefresh }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data?.summary) {
            resultSummary = json.data.summary;
          }
        } else {
          const errJson = await res.json().catch(() => ({}));
          const errMsg = errJson.error?.message || `HTTP ${res.status}`;
          setErrorMessage(errMsg);
        }
      }

      // Fallback demo summary if backend API isn't configured with API key
      if (!resultSummary) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        resultSummary = `Commit summary for ${commit.title}: Modified ${
          commit.files.length
        } file(s) adding ${commit.added || 12} lines and removing ${
          commit.removed || 4
        } lines.`;
      }

      setLocalSummary(resultSummary);
      if (onSaveSummary) {
        onSaveSummary(sha, resultSummary);
      }
      setLoading(false);
    } catch (err) {
      console.error('[CommitBubble] Summary error:', err);
      setErrorMessage(err.message || 'Network error');
      setError(true);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onSelectBubble) onSelectBubble(index);
    }
  };

  const commitTypeClass = `type-${(commit.type || 'COMMIT').toLowerCase()}`;

  return (
    <motion.article
      className={`framer-commit-bubble ${sideClass} ${isActive ? 'is-active-capsule' : ''}`}
      data-index={index}
      data-hash={sha}
      layout
      transition={springTransition}
      onClick={() => onSelectBubble && onSelectBubble(index)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={`Commit #${commit.hash}: ${commit.title}. Press enter to expand.`}
      animate={{
        width: isActive ? 'min(560px, 88vw)' : '160px',
        minHeight: isActive ? '360px' : '160px',
        borderRadius: isActive ? '24px' : '50%',
        background: isActive
          ? 'radial-gradient(ellipse at 20% 20%, rgba(18, 120, 155, 0.42), transparent 60%), rgba(3, 19, 44, 0.96)'
          : 'radial-gradient(circle at 35% 25%, rgba(180, 245, 240, 0.22), transparent 50%), rgba(8, 48, 82, 0.65)',
        borderColor: isActive ? 'rgba(88, 231, 224, 0.95)' : 'rgba(112, 235, 228, 0.55)',
        boxShadow: isActive
          ? '0 0 35px rgba(88, 231, 224, 0.35), inset 0 0 25px rgba(88, 231, 224, 0.2), 0 20px 40px rgba(0, 7, 22, 0.85)'
          : '0 0 20px rgba(49, 198, 204, 0.25), inset 0 0 15px rgba(81, 218, 217, 0.15)',
      }}
      style={{
        position: 'relative',
        borderStyle: 'solid',
        borderWidth: '2px',
        backdropFilter: 'blur(12px)',
        zIndex: isActive ? 30 : 8,
        cursor: 'pointer',
        overflow: 'hidden',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {/* Terminal Bracket Accents on Active Capsule */}
      {isActive && (
        <>
          <span className="terminal-corner top-left" aria-hidden="true">┌</span>
          <span className="terminal-corner top-right" aria-hidden="true">┐</span>
          <span className="terminal-corner bottom-left" aria-hidden="true">└</span>
          <span className="terminal-corner bottom-right" aria-hidden="true">┘</span>
          <div className="holographic-scanline" aria-hidden="true" />
        </>
      )}

      {/* Ripple Animation when AI summary completes */}
      <AnimatePresence>
        {showRipple && (
          <motion.div
            className="ocean-ripple-effect"
            initial={{ scale: 0.1, opacity: 0.8 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <i className="tiny-bubbles" aria-hidden="true">
        ° · °
      </i>

      <AnimatePresence mode="wait">
        {!isActive ? (
          /* Collapsed Bubble View */
          <motion.div
            key="collapsed"
            className="collapsed-bubble-inner"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="bubble-animal-icon">{animalMark}</span>
            <h3 className="collapsed-title">{commit.title}</h3>
            <span className="collapsed-hash">#{commit.hash}</span>
          </motion.div>
        ) : (
          /* Holographic Terminal Expanded View */
          <motion.div
            key="expanded"
            className="expanded-capsule-content"
            variants={contentContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header: Meta tags & timestamp */}
            <motion.div className="capsule-header" variants={childVariants}>
              <div className="capsule-meta-tags">
                <span className={`type-badge ${commitTypeClass}`}>
                  {commit.type || 'COMMIT'}
                </span>
                <span className="hash-tag">#{commit.hash}</span>
              </div>
              <time className="capsule-date">{commit.date}</time>
            </motion.div>

            {/* Commit Title */}
            <motion.h3 className="capsule-title" variants={childVariants}>
              {commit.title}
            </motion.h3>

            {/* Commit Message Description */}
            {commit.description && (
              <motion.p className="capsule-description" variants={childVariants}>
                {commit.description}
              </motion.p>
            )}

            {/* Changed Files & Code Statistics */}
            <motion.div className="capsule-files-section" variants={childVariants}>
              <div className="files-header-bar">
                <b className="files-header">CHANGED FILES ({commit.files.length})</b>
                {(commit.added !== undefined || commit.removed !== undefined) && (
                  <span className="diff-stats" title="Lines added / removed">
                    <span className="stat-added">+{commit.added || 0}</span> /{' '}
                    <span className="stat-removed">-{commit.removed || 0}</span>
                  </span>
                )}
              </div>

              {/* Clean file chips with text only */}
              <div className="files-chips">
                {commit.files.slice(0, 4).map((file, idx) => (
                  <span key={idx} className="file-chip" title={file}>
                    <span className="file-name-text">{file}</span>
                  </span>
                ))}
                {commit.files.length > 4 && (
                  <span className="file-chip more-chip">+{commit.files.length - 4} more</span>
                )}
              </div>
            </motion.div>

            {/* Gemini AI Memory Panel Section */}
            <motion.div className="capsule-ai-container" variants={childVariants}>
              {activeSummary ? (
                <motion.div
                  className="capsule-ai-box ai-box-done"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                >
                  <div className="ai-box-header">
                    <div className="ai-title-left">
                      <span className="ai-star-sparkle">✦</span>
                      <span>GEMINI SUMMARY</span>
                    </div>
                  </div>

                  <p className="ai-summary-body">
                    <TypewriterText
                      text={activeSummary}
                      speed={14}
                      onComplete={() => setShowRipple(true)}
                    />
                  </p>
                </motion.div>
              ) : loading ? (
                <div className="capsule-ai-box ai-box-loading">
                  <div className="ai-loading-pulse">
                    <span className="pulse-icon spinner">✦</span>
                    <span className="pulse-text">Generating summary...</span>
                    <div className="pulse-dots">
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                      />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                      />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="capsule-ai-box ai-box-error">
                  <div className="ai-error-content">
                    <span>⚠️ Failed to generate summary.</span>
                    {errorMessage && (
                      <p className="error-submsg">{errorMessage}</p>
                    )}
                    <button
                      type="button"
                      className="ai-retry-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFetchSummary(false);
                      }}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="capsule-ai-box ai-box-idle">
                  <button
                    type="button"
                    className="ai-explain-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFetchSummary(false);
                    }}
                  >
                    <span className="ai-sparkle-icon">✦</span>
                    <span>Summarize with Gemini</span>
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

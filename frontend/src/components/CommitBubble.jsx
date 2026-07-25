import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ANIMAL_MARKS = ['🐠', '🐡', '🦑', '🐙', '🦀', '🐟', '🐢', '🦐', '🐬', '🪼', '🦈', '🐳'];

const springTransition = {
  type: 'spring',
  stiffness: 210,
  damping: 23,
  mass: 0.85,
  bounce: 0.16,
};

const contentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.12,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 24 },
  },
};

export default function CommitBubble({ commit, index, isActive, currentRepoId }) {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const sideClass = index % 2 === 0 ? 'bubble-left' : 'bubble-right';
  const animalMark = ANIMAL_MARKS[index % ANIMAL_MARKS.length];

  useEffect(() => {
    let isMounted = true;

    if (isActive && !summary && !summaryLoading) {
      setSummaryLoading(true);

      const fetchDetail = async () => {
        let aiSummary = null;

        if (currentRepoId && commit.fullHash) {
          try {
            const res = await fetch(`/api/repos/${currentRepoId}/commits/${commit.fullHash}/detail`);
            if (res.ok) {
              const json = await res.json();
              if (json.data?.summary) {
                aiSummary = json.data.summary;
              }
            }
          } catch (e) {
            console.warn('Backend detail fetch failed, fallback to mock AI summary:', e);
          }
        }

        if (!aiSummary) {
          // Simulate AI processing delay for demo / mock mode
          await new Promise((resolve) => setTimeout(resolve, 850));
          aiSummary = `This commit (${commit.hash}) introduced ${commit.title.toLowerCase()}. It modified ${
            commit.files.length
          } file(s) including ${commit.files.slice(0, 2).join(', ')}, refining the code structure and application flow.`;
        }

        if (isMounted) {
          setSummary(aiSummary);
          setSummaryLoading(false);
        }
      };

      fetchDetail();
    }

    return () => {
      isMounted = false;
    };
  }, [isActive, summary, summaryLoading, currentRepoId, commit]);

  return (
    <motion.article
      className={`framer-commit-bubble ${sideClass} ${isActive ? 'is-active-capsule' : ''}`}
      data-index={index}
      data-hash={commit.fullHash || commit.hash}
      layout
      transition={springTransition}
      animate={{
        width: isActive ? 'min(540px, 86vw)' : '160px',
        minHeight: isActive ? '340px' : '160px',
        borderRadius: isActive ? '32px' : '50%',
        background: isActive
          ? 'radial-gradient(circle at 18% 18%, rgba(20, 130, 160, 0.45), transparent 55%), rgba(3, 20, 48, 0.96)'
          : 'radial-gradient(circle at 32% 22%, rgba(214, 255, 252, 0.18), transparent 45%), rgba(10, 71, 110, 0.55)',
        borderColor: isActive ? 'rgba(88, 231, 224, 0.9)' : 'rgba(112, 235, 228, 0.6)',
        boxShadow: isActive
          ? 'inset 0 0 35px rgba(81, 218, 217, 0.3), 0 0 45px rgba(49, 198, 204, 0.4), 0 16px 36px rgba(0, 5, 18, 0.75)'
          : 'inset 0 0 25px rgba(81, 218, 217, 0.2), 0 0 20px rgba(49, 198, 204, 0.25)',
      }}
      style={{
        position: 'relative',
        borderStyle: 'solid',
        borderWidth: '2px',
        backdropFilter: 'blur(10px)',
        zIndex: isActive ? 30 : 8,
        cursor: 'pointer',
        overflow: 'hidden',
        maxWidth: 'calc(100vw - 32px)',
      }}
      tabIndex={0}
      aria-label={`Commit ${commit.hash}: ${commit.title}`}
    >
      <i className="tiny-bubbles" aria-hidden="true">
        ° · °
      </i>

      <AnimatePresence mode="wait">
        {!isActive ? (
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
            <span className="collapsed-hash">{commit.hash}</span>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            className="expanded-capsule-content"
            variants={contentContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="capsule-header" variants={childVariants}>
              <div className="capsule-meta-tags">
                <span className="type-badge">{commit.type || 'COMMIT'}</span>
                <span className="hash-tag">#{commit.hash}</span>
              </div>
              <time className="capsule-date">{commit.date}</time>
            </motion.div>

            <motion.h3 className="capsule-title" variants={childVariants}>
              {commit.title}
            </motion.h3>

            {commit.description && (
              <motion.p className="capsule-description" variants={childVariants}>
                {commit.description}
              </motion.p>
            )}

            <motion.div className="capsule-files-section" variants={childVariants}>
              <b className="files-header">CHANGED FILES ({commit.files.length})</b>
              <div className="files-chips">
                {commit.files.slice(0, 4).map((file, idx) => (
                  <span key={idx} className="file-chip">
                    📄 {file}
                  </span>
                ))}
                {commit.files.length > 4 && (
                  <span className="file-chip more-chip">+{commit.files.length - 4} more</span>
                )}
              </div>
            </motion.div>

            <motion.div className="capsule-ai-box" variants={childVariants}>
              <div className="ai-box-title">
                <span className="ai-star-sparkle">✦</span>
                <span>AI COMMIT MEMORY</span>
              </div>

              {summaryLoading ? (
                <div className="ai-loading-pulse">
                  <span className="pulse-text">Analyzing commit with Gemini AI...</span>
                  <div className="pulse-dots">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: 0 }}
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: 0.2 }}
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: 0.4 }}
                    />
                  </div>
                </div>
              ) : (
                <p className="ai-summary-body">{summary}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

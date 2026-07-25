import React, { useState, useEffect, useRef } from 'react';
import RepoGate from './components/RepoGate';
import StickyDiver from './components/StickyDiver';
import CommitBubble from './components/CommitBubble';
import SeabedSummary from './components/SeabedSummary';

const MOCK_COMMITS = [
  {
    type: 'INIT',
    title: 'Create project foundation',
    hash: '8a2c1d4',
    fullHash: '8a2c1d4',
    date: 'Jul 18, 2026 · 09:42',
    description: 'Set up the initial application structure, design tokens, and project documentation.',
    added: 684,
    removed: 0,
    files: ['index.html', 'styles.css', 'README.md'],
  },
  {
    type: 'FEATURE',
    title: 'Add GitHub connection flow',
    hash: '91be2a0',
    fullHash: '91be2a0',
    date: 'Jul 18, 2026 · 14:06',
    description: 'Created the repository input experience and validation states for GitHub URLs.',
    added: 241,
    removed: 18,
    files: ['index.html', 'script.js', 'styles.css'],
  },
  {
    type: 'STYLE',
    title: 'Build pixel ocean environment',
    hash: 'c72fd81',
    fullHash: 'c72fd81',
    date: 'Jul 19, 2026 · 11:28',
    description: 'Added the deep-sea palette, surface light rays, bubbles, coral, and pixel styling.',
    added: 509,
    removed: 77,
    files: ['styles.css', 'assets/creatures.png'],
  },
  {
    type: 'FEATURE',
    title: 'Add diver selection',
    hash: '0f4ca92',
    fullHash: '0f4ca92',
    date: 'Jul 19, 2026 · 16:51',
    description: 'Users can now choose a female, male, or unspecified diver before starting.',
    added: 187,
    removed: 21,
    files: ['explorer.html', 'explorer.js', 'assets/female.png', 'assets/male.png'],
  },
  {
    type: 'FEATURE',
    title: 'Render repository commit list',
    hash: 'fd201b6',
    fullHash: 'fd201b6',
    date: 'Jul 20, 2026 · 10:15',
    description: 'Created a full scrollable history with commit metadata and changed files.',
    added: 356,
    removed: 42,
    files: ['explorer.js', 'explorer.html'],
  },
  {
    type: 'FEATURE',
    title: 'Create swim navigation system',
    hash: '5e98cb3',
    fullHash: '5e98cb3',
    date: 'Jul 21, 2026 · 13:08',
    description: 'Connected the diver position to the selected commit with keyboard navigation.',
    added: 298,
    removed: 35,
    files: ['explorer.js', 'styles.css'],
  },
  {
    type: 'FIX',
    title: 'Repair mobile ocean controls',
    hash: '2db51aa',
    fullHash: '2db51aa',
    date: 'Jul 22, 2026 · 18:13',
    description: 'Improved touch targets, responsive layout, and the small-screen timeline.',
    added: 94,
    removed: 63,
    files: ['styles.css', 'explorer.js'],
  },
  {
    type: 'ACCESS',
    title: 'Add keyboard and focus states',
    hash: '73ac114',
    fullHash: '73ac114',
    date: 'Jul 23, 2026 · 09:27',
    description: 'Added keyboard swimming, visible focus treatment, and semantic labels.',
    added: 126,
    removed: 17,
    files: ['explorer.html', 'styles.css'],
  },
  {
    type: 'AI',
    title: 'Prepare Gemini summary handoff',
    hash: 'bd92e63',
    fullHash: 'bd92e63',
    date: 'Jul 24, 2026 · 10:37',
    description: 'Added the frontend summary action and the response display container.',
    added: 173,
    removed: 28,
    files: ['explorer.html', 'explorer.js'],
  },
  {
    type: 'DOCS',
    title: 'Document backend integration',
    hash: 'e037b2f',
    fullHash: 'e037b2f',
    date: 'Jul 24, 2026 · 15:42',
    description: 'Documented the expected GitHub and Google API response contracts.',
    added: 88,
    removed: 4,
    files: ['README.md', 'explorer.js'],
  },
  {
    type: 'POLISH',
    title: 'Refine commit detail cards',
    hash: '34aff80',
    fullHash: '34aff80',
    date: 'Jul 25, 2026 · 07:16',
    description: 'Improved hover feedback, change statistics, and information hierarchy.',
    added: 142,
    removed: 96,
    files: ['styles.css', 'explorer.html'],
  },
  {
    type: 'SHIP',
    title: 'Complete Beneath the Ocean',
    hash: 'f41ea77',
    fullHash: 'f41ea77',
    date: 'Jul 25, 2026 · 08:55',
    description: 'Final polish for the two-page Commit Diver frontend experience.',
    added: 219,
    removed: 51,
    files: ['index.html', 'explorer.html', 'styles.css', 'explorer.js'],
  },
];

export default function ExplorerApp() {
  const [commits, setCommits] = useState([]);
  const [diverSrc, setDiverSrc] = useState('assets/female.png');
  const [repoName, setRepoName] = useState('username/repository');
  const [currentRepoId, setCurrentRepoId] = useState(null);
  const [isExpeditionActive, setIsExpeditionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCommitIndex, setActiveCommitIndex] = useState(0);
  const [summaryCache, setSummaryCache] = useState({});

  const handleSaveSummary = (sha, text) => {
    if (sha && text) {
      setSummaryCache((prev) => ({ ...prev, [sha]: text }));
    }
  };

  const containerRef = useRef(null);
  const observerRef = useRef(null);

  const fetchRepositoryCommits = async (repoUrl) => {
    try {
      const valRes = await fetch('/api/repos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: repoUrl }),
      });

      if (!valRes.ok) {
        const errJson = await valRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to validate repository URL');
      }

      const cloneRes = await fetch('/api/repos/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: repoUrl }),
      });

      if (!cloneRes.ok) {
        const errJson = await cloneRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to prepare repository');
      }

      const cloneData = await cloneRes.json();
      const repoId = cloneData.data.repoId;
      setCurrentRepoId(repoId);

      const commitsRes = await fetch(`/api/repos/${repoId}/commits?limit=50`);
      if (commitsRes.ok) {
        const commitsData = await commitsRes.json();
        const fetched = commitsData.data?.commits || [];
        if (fetched.length > 0) {
          return fetched.map((c) => {
            const msg = c.message || 'Commit';
            const type = msg.startsWith('feat')
              ? 'FEATURE'
              : msg.startsWith('fix')
              ? 'FIX'
              : msg.startsWith('docs')
              ? 'DOCS'
              : msg.startsWith('refactor')
              ? 'REFACTOR'
              : msg.startsWith('chore')
              ? 'CHORE'
              : 'COMMIT';

            return {
              type,
              title: msg.split('\n')[0],
              hash: c.shortHash || c.hash.substring(0, 7),
              fullHash: c.hash,
              date: c.date ? new Date(c.date).toLocaleString() : 'Recent',
              description: msg,
              added: c.additions || 0,
              removed: c.deletions || 0,
              files: c.files && c.files.length > 0 ? c.files : ['Repository files'],
            };
          });
        }
      }
    } catch (err) {
      console.warn('Backend connection failed, falling back to demo mode:', err.message);
    }

    return MOCK_COMMITS;
  };

  const handleStartDescent = async (url) => {
    try {
      const urlObj = new URL(url);
      const isValid =
        urlObj.hostname === 'github.com' &&
        urlObj.pathname.split('/').filter(Boolean).length >= 2;
      if (!isValid) {
        throw new Error('Enter a complete github.com/owner/repository link.');
      }

      setIsLoading(true);
      setErrorMsg('PREPARING YOUR DESCENT…');

      const fetchedCommits = await fetchRepositoryCommits(url);
      setCommits(fetchedCommits);
      setRepoName(urlObj.pathname.replace(/^\/|\/$/g, ''));

      setIsLoading(false);
      setErrorMsg('');
      setIsExpeditionActive(true);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message.toUpperCase());
    }
  };

  const handleChangeRepo = () => {
    setIsExpeditionActive(false);
    setCurrentRepoId(null);
    setErrorMsg('');
  };

  // Setup IntersectionObserver for active commit bubble tracking
  useEffect(() => {
    if (!isExpeditionActive || commits.length === 0) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveCommitIndex(index);
            }
          }
        });
      },
      { rootMargin: '-38% 0px -38% 0px', threshold: 0.1 }
    );

    const bubbleElements = document.querySelectorAll('.framer-commit-bubble');
    bubbleElements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isExpeditionActive, commits]);

  const depthMeters = (activeCommitIndex + 1) * 40;
  const progressPercent = commits.length ? ((activeCommitIndex + 1) / commits.length) * 100 : 0;
  const oceanMinHeight = Math.max(5700, commits.length * 420);

  return (
    <>
      {!isExpeditionActive ? (
        <RepoGate
          onStartDescent={handleStartDescent}
          diverSrc={diverSrc}
          setDiverSrc={setDiverSrc}
          isLoading={isLoading}
          errorMsg={errorMsg}
        />
      ) : (
        <section className="vertical-expedition" id="expedition" ref={containerRef}>
          <div className="dive-header">
            <div>
              <small>NOW EXPLORING</small>
              <h2 id="repoName">{repoName}</h2>
            </div>
            <div>
              <b id="commitTotal">{commits.length}</b>
              <small>COMMITS FOUND</small>
            </div>
            <button id="changeRepo" onClick={handleChangeRepo}>
              CHANGE REPO
            </button>
          </div>

          <div className="ocean-descent" id="oceanDescent" style={{ minHeight: `${oceanMinHeight}px` }}>
            <div className="surface-glow" />
            <div className="depth-rail">
              <span id="depthProgress" style={{ height: `${progressPercent}%` }} />
            </div>

            <div className="creature-layer" aria-hidden="true">
              <img src="assets/creatures.png" className="creatures-one" alt="" />
              <img src="assets/creatures.png" className="creatures-two" alt="" />
              <img src="assets/creatures.png" className="creatures-three" alt="" />
            </div>

            <StickyDiver
              diverSrc={diverSrc}
              depthMeters={depthMeters}
              isPaused={true}
              activeHash={commits[activeCommitIndex]?.hash}
            />

            <div className="commit-bubbles" id="commitBubbles">
              {commits.map((commit, idx) => {
                const sha = commit.fullHash || commit.hash;
                return (
                  <CommitBubble
                    key={sha || idx}
                    commit={commit}
                    index={idx}
                    isActive={idx === activeCommitIndex}
                    currentRepoId={currentRepoId}
                    cachedSummary={summaryCache[sha]}
                    onSaveSummary={handleSaveSummary}
                  />
                );
              })}
            </div>

            <div className="descent-start">
              <span>↓</span>
              <p>SCROLL TO DIVE THROUGH EVERY COMMIT</p>
            </div>
          </div>

          <SeabedSummary commits={commits} currentRepoId={currentRepoId} />
        </section>
      )}
    </>
  );
}

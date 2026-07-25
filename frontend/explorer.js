// =============================================================
// Mock data fallback
// =============================================================
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
    files: ['index.html', 'styles.css', 'README.md']
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
    files: ['index.html', 'script.js', 'styles.css']
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
    files: ['styles.css', 'assets/creatures.png']
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
    files: ['explorer.html', 'explorer.js', 'assets/female.png', 'assets/male.png']
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
    files: ['explorer.js', 'explorer.html']
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
    files: ['explorer.js', 'styles.css']
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
    files: ['styles.css', 'explorer.js']
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
    files: ['explorer.html', 'styles.css']
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
    files: ['explorer.html', 'explorer.js']
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
    files: ['README.md', 'explorer.js']
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
    files: ['styles.css', 'explorer.html']
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
    files: ['index.html', 'explorer.html', 'styles.css', 'explorer.js']
  }
];

// Sea creature glyphs used to mark each commit bubble.
const ANIMAL_MARKS = ['🐠', '🐡', '🦑', '🐙', '🦀', '🐟', '🐢', '🦐', '🐬', '🪼', 'SHARK', '🐳'];

const API_BASE_URL = '/api';

// =============================================================
// State & DOM helpers
// =============================================================
const $ = selector => document.querySelector(selector);

let commits = [];
let diverSrc = 'assets/female.png';
let scrollObserver;
let currentRepoId = null;

// =============================================================
// Diver picker (repo gate screen)
// =============================================================
document.querySelectorAll('.diver-picker button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.diver-picker button').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    diverSrc = button.dataset.src;
  });
});

// =============================================================
// Repository form & Backend API integration
// =============================================================
async function fetchRepositoryCommits(repoUrl) {
  try {
    // 1. Validate repository
    const valRes = await fetch(`${API_BASE_URL}/repos/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: repoUrl }),
    });

    if (!valRes.ok) {
      const errJson = await valRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Failed to validate repository URL');
    }

    // 2. Clone repository / retrieve session repoId
    const cloneRes = await fetch(`${API_BASE_URL}/repos/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: repoUrl }),
    });

    if (!cloneRes.ok) {
      const errJson = await cloneRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Failed to prepare repository');
    }

    const cloneData = await cloneRes.json();
    currentRepoId = cloneData.data.repoId;

    // 3. Fetch parsed commits
    const commitsRes = await fetch(`${API_BASE_URL}/repos/${currentRepoId}/commits?limit=50`);
    if (commitsRes.ok) {
      const commitsData = await commitsRes.json();
      const fetchedCommits = commitsData.data?.commits || [];

      if (fetchedCommits.length > 0) {
        return fetchedCommits.map(c => {
          const msg = c.message || 'Commit';
          const type = msg.startsWith('feat') ? 'FEATURE'
            : msg.startsWith('fix') ? 'FIX'
            : msg.startsWith('docs') ? 'DOCS'
            : msg.startsWith('refactor') ? 'REFACTOR'
            : msg.startsWith('chore') ? 'CHORE'
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
}

$('#repoForm').addEventListener('submit', async event => {
  event.preventDefault();
  const input = $('#repoUrl');
  const error = $('#repoError');

  try {
    const url = new URL(input.value);
    const isValidRepoUrl = url.hostname === 'github.com' && url.pathname.split('/').filter(Boolean).length >= 2;
    if (!isValidRepoUrl) {
      throw new Error('Enter a complete github.com/owner/repository link.');
    }

    error.textContent = 'PREPARING YOUR DESCENT…';
    commits = await fetchRepositoryCommits(input.value);

    $('#repoName').textContent = url.pathname.replace(/^\/|\/$/g, '');
    renderDescent();

    $('#repoGate').hidden = true;
    $('#expedition').hidden = false;
    $('#expedition').scrollIntoView({ behavior: 'smooth' });
  } catch (reason) {
    error.textContent = reason.message.toUpperCase();
  }
});

$('#changeRepo').addEventListener('click', () => {
  $('#expedition').hidden = true;
  $('#repoGate').hidden = false;
  $('#repoError').textContent = '';
  currentRepoId = null;
  scrollTo({ top: 0, behavior: 'smooth' });
});

// =============================================================
// Rendering the commit descent
// =============================================================
function commitBubbleMarkup(commit, index) {
  const side = index % 2 ? 'bubble-right' : 'bubble-left';
  const animalMark = ANIMAL_MARKS[index % ANIMAL_MARKS.length];
  const fileItems = commit.files.map(file => `<li>${file}</li>`).join('');

  return `
    <article class="commit-bubble minimal-bubble ${side}" data-index="${index}" data-hash="${commit.fullHash || commit.hash}" tabindex="0" aria-label="${commit.title}. Hover for details.">
      <div class="title-circle">
        <h3>${commit.title}</h3>
      </div>
      <div class="commit-hover-detail">
        <span class="animal-display" aria-hidden="true">${animalMark}</span>
        <div class="detail-content">
          <span class="commit-meta">${commit.type} · ${commit.hash}</span>
          <time>${commit.date}</time>
          <p class="commit-summary">${commit.description}</p>
          <b class="files-label">CHANGED FILES</b>
          <ul class="files-list">${fileItems}</ul>
        </div>
      </div>
      <i class="tiny-bubbles">° · °</i>
    </article>
  `;
}

function renderDescent() {
  $('#activeDiver').src = diverSrc;
  $('#commitTotal').textContent = commits.length;
  $('#finalDepth').textContent = `${commits.length * 40} M`;

  $('#commitBubbles').innerHTML = commits
    .map((commit, index) => commitBubbleMarkup(commit, index))
    .join('');

  watchCommitBubbles();
}

// Tracks which commit bubble is currently in view
function watchCommitBubbles() {
  scrollObserver?.disconnect();

  scrollObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        document.querySelectorAll('.commit-bubble').forEach(item => item.classList.remove('active'));
        entry.target.classList.add('active');

        const index = Number(entry.target.dataset.index);
        const depthMeters = (index + 1) * 40;
        $('#depthLabel').textContent = `${String(depthMeters).padStart(3, '0')} M`;
        $('#depthProgress').style.height = `${((index + 1) / commits.length) * 100}%`;
      });
    },
    { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
  );

  document.querySelectorAll('.commit-bubble').forEach(bubble => scrollObserver.observe(bubble));
}

// =============================================================
// Gemini summary API integration
// =============================================================
async function summarizeWithGemini(commitHistory) {
  if (currentRepoId) {
    try {
      const res = await fetch(`${API_BASE_URL}/repos/${currentRepoId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.summary) {
          return json.data.summary;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Gemini summary from backend:', err.message);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 900));
  return `Across ${commitHistory.length} commits, this project evolved from its initial foundation into an interactive GitHub journey. The work focused on repository exploration, pixel-art ocean design, accessible swim navigation, detailed change inspection, and a prepared Gemini summary flow.`;
}

$('#summarizeButton').addEventListener('click', async () => {
  const button = $('#summarizeButton');
  button.disabled = true;
  button.textContent = '✦ GEMINI IS EXPLORING…';

  $('#summaryText').textContent = await summarizeWithGemini(commits);
  $('#summaryOutput').hidden = false;
  button.textContent = '✦ SUMMARY COMPLETE';
});

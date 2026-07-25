import React, { useState } from 'react';

/**
 * RepoGate Component
 * Initial repository configuration screen
 */
export default function RepoGate({ onStartDescent, diverSrc, setDiverSrc, isLoading, errorMsg }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetUrl = url.trim() || e.target.elements?.repoUrl?.value?.trim() || '';
    if (targetUrl) {
      onStartDescent(targetUrl);
    }
  };

  return (
    <section className="repo-gate" id="repoGate">
      <h1>ADD A REPOSITORY.</h1>
      <p className="repo-gate-intro">
        Paste a GitHub repository link to inspect commits and summarize changes.
      </p>

      <form id="repoForm" onSubmit={handleSubmit}>
        <label htmlFor="repoUrl">GITHUB REPOSITORY URL</label>
        <div className="repo-input">
          <span className="input-sonar-mark" aria-hidden="true">
            ◉
          </span>
          <input
            id="repoUrl"
            name="repoUrl"
            type="url"
            placeholder="https://github.com/username/repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            autoComplete="off"
          />
          <button type="submit" className="descent-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner">✦</span> LOADING…
              </span>
            ) : (
              <>EXPLORE REPOSITORY ↓</>
            )}
          </button>
        </div>
        <small id="repoError" role="alert">
          {errorMsg}
        </small>
      </form>

      <div className="diver-picker">
        <span className="picker-title">CHOOSE DIVER</span>
        <div className="picker-grid">
          <button
            type="button"
            className={`diver-card ${diverSrc === 'assets/female.png' ? 'active' : ''}`}
            onClick={() => setDiverSrc('assets/female.png')}
            aria-pressed={diverSrc === 'assets/female.png'}
          >
            <img src="assets/female.png" alt="Female diver avatar" />
            <span>FEMALE</span>
          </button>
          <button
            type="button"
            className={`diver-card ${diverSrc === 'assets/male.png' ? 'active' : ''}`}
            onClick={() => setDiverSrc('assets/male.png')}
            aria-pressed={diverSrc === 'assets/male.png'}
          >
            <img src="assets/male.png" alt="Male diver avatar" />
            <span>MALE</span>
          </button>
          <button
            type="button"
            className={`diver-card ${diverSrc === 'assets/nonspecified.png' ? 'active' : ''}`}
            onClick={() => setDiverSrc('assets/nonspecified.png')}
            aria-pressed={diverSrc === 'assets/nonspecified.png'}
          >
            <img src="assets/nonspecified.png" alt="Unspecified diver avatar" />
            <span>ANY</span>
          </button>
        </div>
      </div>
    </section>
  );
}

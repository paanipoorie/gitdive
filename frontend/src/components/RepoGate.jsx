import React, { useState } from 'react';

export default function RepoGate({ onStartDescent, diverSrc, setDiverSrc, isLoading, errorMsg }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onStartDescent(url.trim());
    }
  };

  return (
    <section className="repo-gate" id="repoGate">
      <p className="eyebrow">// SET YOUR COORDINATES</p>
      <h1>ADD A REPOSITORY.</h1>
      <p>Enter a GitHub repository link. Only commits available to the connected user will be shown.</p>

      <form id="repoForm" onSubmit={handleSubmit}>
        <label htmlFor="repoUrl">GITHUB REPOSITORY URL</label>
        <div className="repo-input">
          <span>◉</span>
          <input
            id="repoUrl"
            type="url"
            placeholder="https://github.com/username/repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'PREPARING…' : 'BEGIN DESCENT ↓'}
          </button>
        </div>
        <small id="repoError">{errorMsg}</small>
      </form>

      <div className="diver-picker">
        <span>CHOOSE DIVER</span>
        <button
          type="button"
          className={diverSrc === 'assets/female.png' ? 'active' : ''}
          onClick={() => setDiverSrc('assets/female.png')}
        >
          <img src="assets/female.png" alt="Female diver" />
          FEMALE
        </button>
        <button
          type="button"
          className={diverSrc === 'assets/male.png' ? 'active' : ''}
          onClick={() => setDiverSrc('assets/male.png')}
        >
          <img src="assets/male.png" alt="Male diver" />
          MALE
        </button>
        <button
          type="button"
          className={diverSrc === 'assets/nonspecified.png' ? 'active' : ''}
          onClick={() => setDiverSrc('assets/nonspecified.png')}
        >
          <img src="assets/nonspecified.png" alt="Unspecified diver" />
          ANY
        </button>
      </div>
    </section>
  );
}

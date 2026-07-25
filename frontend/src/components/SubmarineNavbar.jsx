import React from 'react';

/**
 * SubmarineNavbar Component
 * Minimal functional header:
 * - GitDive logo (left)
 * - Current repository name
 * - Total commit count
 * - Private/Public status indicator
 * - Change Repository action
 * - Home link
 */
export default function SubmarineNavbar({
  isExpeditionActive,
  repoName = 'username/repository',
  commitCount = 0,
  isPrivate = false,
  onChangeRepo,
}) {
  return (
    <header className="topbar explorer-nav submarine-control-panel" role="banner">
      <div className="nav-grid">
        {/* Left: Logo */}
        <div className="nav-left">
          <a className="logo" href="index.html" title="GitDive Home">
            <span className="logo-mark" aria-hidden="true">
              <span className="sonar-ping" />
              ⌄
            </span>
            <span>
              GIT<br />
              <b>DIVE</b>
            </span>
          </a>
        </div>

        {/* Center: Repository Metadata Bar */}
        {isExpeditionActive ? (
          <div className="nav-center-telemetry">
            <div className="telemetry-pill repo-pill" title={`Repository: ${repoName}`}>
              <span className="telemetry-label">REPOSITORY</span>
              <span className="telemetry-value repo-val">{repoName}</span>
            </div>

            <div className="telemetry-divider" aria-hidden="true" />

            <div className="telemetry-pill count-pill" title={`${commitCount} commits`}>
              <span className="telemetry-label">COMMITS</span>
              <span className="telemetry-value count-val">
                <b className="count-num">{commitCount}</b> COMMITS
              </span>
            </div>

            <div className="telemetry-divider" aria-hidden="true" />

            <div className="telemetry-pill status-pill">
              <span className="status-beacon active-beacon" />
              <span className="status-text">
                {isPrivate ? 'PRIVATE REPO' : 'PUBLIC REPO'}
              </span>
            </div>
          </div>
        ) : (
          <div className="nav-center-idle">
            <span className="status-beacon idle-beacon" />
            <span className="idle-text">READY TO EXPLORE REPOSITORY</span>
          </div>
        )}

        {/* Right: Actions */}
        <div className="nav-right">
          {isExpeditionActive && onChangeRepo && (
            <button
              type="button"
              className="nav-btn change-repo-btn"
              onClick={onChangeRepo}
              title="Change repository"
            >
              <span className="btn-icon">⇄</span>
              <span>CHANGE REPO</span>
            </button>
          )}

          <a className="nav-btn surface-btn" href="index.html" title="Return to home">
            <span className="btn-icon">▲</span>
            <span>HOME</span>
          </a>
        </div>
      </div>
    </header>
  );
}

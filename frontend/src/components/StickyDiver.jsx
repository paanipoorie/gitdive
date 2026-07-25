import React from 'react';
import { motion } from 'framer-motion';

export default function StickyDiver({ diverSrc, depthMeters, isPaused, activeHash }) {
  return (
    <div className={`sticky-diver ${isPaused ? 'diver-inspecting' : ''}`}>
      <span className="depth-label">
        {String(depthMeters).padStart(3, '0')} M
        {isPaused && <span className="inspecting-indicator"> • SCANNING</span>}
      </span>

      <motion.img
        id="activeDiver"
        src={diverSrc}
        alt="Your diver"
        animate={{
          y: isPaused ? [0, -5, 0] : [0, 14, 0],
          rotate: isPaused ? [0, 1, 0, -1, 0] : [0, 1, -1, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: isPaused ? 2.4 : 2.8,
          ease: 'easeInOut',
        }}
        style={{
          imageRendering: 'pixelated',
          filter: isPaused
            ? 'drop-shadow(0 0 15px rgba(88, 231, 224, 0.6)) drop-shadow(0 12px 10px #0009)'
            : 'drop-shadow(0 12px 10px #0009)',
        }}
      />

      <div className="bubble-trail">°<br />·<br />°</div>
      <div className="timeline-cable" />
    </div>
  );
}

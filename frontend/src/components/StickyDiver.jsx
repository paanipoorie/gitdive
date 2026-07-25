import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useVelocity, useSpring, useTransform } from 'framer-motion';

/**
 * StickyDiver Component
 * Responsive diver tracking sprite with timeline HUD readout
 */
export default function StickyDiver({ diverSrc, depthMeters = 0, isPaused = true, activeHash = '' }) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  const smoothVelocity = useSpring(scrollVelocity, {
    stiffness: 120,
    damping: 20,
  });

  const diverRotation = useTransform(smoothVelocity, [-1500, 0, 1500], [-10, 0, 18]);

  const [isSwimming, setIsSwimming] = useState(false);
  const swimTimeoutRef = useRef(null);

  useEffect(() => {
    const unsubscribe = scrollVelocity.on('change', (latest) => {
      if (Math.abs(latest) > 20) {
        setIsSwimming(true);
        if (swimTimeoutRef.current) clearTimeout(swimTimeoutRef.current);
        swimTimeoutRef.current = setTimeout(() => {
          setIsSwimming(false);
        }, 350);
      }
    });
    return () => {
      unsubscribe();
      if (swimTimeoutRef.current) clearTimeout(swimTimeoutRef.current);
    };
  }, [scrollVelocity]);

  return (
    <div className={`sticky-diver ${isPaused ? 'diver-inspecting' : ''} ${isSwimming ? 'is-swimming' : ''}`}>
      {/* Telemetry HUD Tooltip */}
      <div className="depth-label-hud">
        <span className="depth-number">{String(depthMeters).padStart(3, '0')}M</span>
        <span className="depth-subtext">
          {activeHash ? `COMMIT #${activeHash.substring(0, 7)}` : 'ACTIVE'}
        </span>
      </div>

      {/* Diver Helmet Headlamp Light Ray Spotlight */}
      <div className="diver-headlamp-beam" aria-hidden="true" />

      {/* Main Pixel Art Diver Sprite */}
      <motion.div
        className="diver-sprite-wrapper"
        style={{ rotate: diverRotation }}
        animate={{
          y: isSwimming ? [0, 8, -4, 0] : [0, -6, 0],
          x: isSwimming ? [-2, 4, -2] : [0, 2, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: isSwimming ? 1.2 : 2.8,
          ease: 'easeInOut',
        }}
      >
        <img
          id="activeDiver"
          src={diverSrc}
          alt="Underwater diver sprite"
          className="diver-img"
        />

        <div className="fin-water-swirl" aria-hidden="true" />
      </motion.div>

      {/* Regulator Bubble Stream */}
      <div className="diver-bubble-stream" aria-hidden="true">
        <motion.span
          className="regulator-bubble b-one"
          animate={{ y: [-5, -45], x: [0, 6, -3], opacity: [0.8, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, delay: 0 }}
        >
          °
        </motion.span>
        <motion.span
          className="regulator-bubble b-two"
          animate={{ y: [-5, -60], x: [0, -8, 4], opacity: [0.7, 0.9, 0] }}
          transition={{ repeat: Infinity, duration: 2.7, delay: 0.9 }}
        >
          ·
        </motion.span>
        <motion.span
          className="regulator-bubble b-three"
          animate={{ y: [-5, -50], x: [0, 5, -5], opacity: [0.8, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, delay: 1.6 }}
        >
          °
        </motion.span>
      </div>

      <div className="timeline-cable" />
    </div>
  );
}

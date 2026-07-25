import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * OceanFauna Component
 * Renders subtle ambient underwater creatures and particles:
 * - Bioluminescent plankton & micro-bubbles
 * - Drifting jellyfish
 * - Schools of tiny fish
 * - Manta ray silhouette gliding in deep waters
 */
export default function OceanFauna({ depthProgress = 0 }) {
  // Generate random deterministic particle positions for floating plankton
  const planktonParticles = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: `${(i * 37) % 94 + 3}%`,
      top: `${(i * 23) % 90 + 5}%`,
      size: (i % 3) + 2,
      duration: 6 + (i % 5) * 2,
      delay: (i % 4) * 1.2,
    }));
  }, []);

  return (
    <div className="ocean-fauna-layer" aria-hidden="true">
      {/* Plankton & Ambient Glow Particles */}
      <div className="plankton-container">
        {planktonParticles.map((p) => (
          <motion.span
            key={p.id}
            className="plankton-dot"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
            animate={{
              y: [-15, 15, -15],
              x: [-8, 8, -8],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              repeat: Infinity,
              duration: p.duration,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Upper Ocean (0m - 300m): School of tiny fish */}
      {depthProgress < 0.45 && (
        <motion.div
          className="fish-school"
          initial={{ x: '-10%', y: '150px', opacity: 0 }}
          animate={{
            x: ['-10%', '110%'],
            y: ['150px', '180px', '140px'],
            opacity: [0, 0.45, 0.45, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 26,
            ease: 'linear',
            repeatDelay: 12,
          }}
        >
          <span className="tiny-fish">🐟</span>
          <span className="tiny-fish" style={{ marginLeft: '-8px', marginTop: '10px' }}>
            🐟
          </span>
          <span className="tiny-fish" style={{ marginLeft: '-4px', marginTop: '-6px' }}>
            🐠
          </span>
        </motion.div>
      )}

      {/* Mid Ocean (200m - 800m): Drifting Jellyfish */}
      <motion.div
        className="jellyfish-creature j1"
        style={{ top: '1200px', right: '8%' }}
        animate={{
          y: [-25, 25, -25],
          opacity: [0.35, 0.65, 0.35],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
      >
        <span className="jelly-icon">🪼</span>
      </motion.div>

      <motion.div
        className="jellyfish-creature j2"
        style={{ top: '2800px', left: '6%' }}
        animate={{
          y: [-30, 20, -30],
          opacity: [0.25, 0.55, 0.25],
          scale: [1, 0.9, 1],
        }}
        transition={{ repeat: Infinity, duration: 9, delay: 2, ease: 'easeInOut' }}
      >
        <span className="jelly-icon">🪼</span>
      </motion.div>

      {/* Deep Ocean (600m+): Manta Ray Silhouette */}
      <motion.div
        className="manta-silhouette"
        style={{ top: '3900px' }}
        initial={{ x: '110vw' }}
        animate={{
          x: ['110vw', '-20vw'],
          y: [0, 40, -20, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 38,
          ease: 'easeInOut',
          repeatDelay: 18,
        }}
      >
        <svg width="180" height="90" viewBox="0 0 200 100" fill="none" opacity="0.18">
          <path
            d="M100 10 C140 20, 190 40, 200 60 C170 65, 120 70, 100 90 C80 70, 30 65, 0 60 C10 40, 60 20, 100 10 Z"
            fill="#58e7e0"
          />
        </svg>
      </motion.div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAnimation, AnimatePresence, motion } from 'framer-motion';
import './CogniCompanion.css';
import { ZONES } from '../ui/InteractiveZones';

/* ─── 3D Character integration ─── */
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import CogniCharacter from './CogniCharacter';
import { COGNI_POSES, normalizePose } from './cogniPoseConfig';

/* ═══════════════════════════════════════════════════╗
 *  Anchor positions (percentage of viewport)         ║
 *  The companion jumps between these as user scrolls ║
 *  ENHANCED with interactive zone reactions          ║
 * ═══════════════════════════════════════════════════*/
const SECTION_ANCHORS = [
  { id: 'hero', x: 76, y: 28, tip: '👋 Hi! I\'m Cogni!', pose: COGNI_POSES.WAVING, sectionId: 'section-hero' },
  { id: 'features', x: 16, y: 56, tip: '✨ Check out our dashboards!', pose: COGNI_POSES.POINTING, sectionId: 'section-features' },
  { id: 'cta', x: 76, y: 76, tip: '🚀 Ready to get started?', pose: COGNI_POSES.CELEBRATING, sectionId: 'section-cta' },
  { id: 'footer', x: 50, y: 88, tip: '💜 Let\'s stay connected!', pose: COGNI_POSES.INTERACTION_B, sectionId: 'section-footer' },
];

const COMPANION_SIZE = 310;

/* ─── Enhanced Speech Bubble with animations ─── */
function SpeechBubble({ text, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="cogni-speech-bubble"
        >
          <span>{text}</span>
          <div className="cogni-speech-arrow" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════╗
 *  CogniCompanion — floating interactive character   ║
 *  Uses sprite-based PNG poses with CSS/Framer       ║
 *  animations + cursor tracking + interactive zones  ║
 * ═══════════════════════════════════════════════════*/
export default function CogniCompanion({ focusTarget = null, activeZone = null }) {
  const controls = useAnimation();
  const [isRtl, setIsRtl] = useState(() => document?.documentElement?.dir === 'rtl');
  const [currentAnchor, setCurrentAnchor] = useState(0);
  const [currentPose, setCurrentPose] = useState(COGNI_POSES.WAVING);
  const [showTip, setShowTip] = useState(true);
  const [_isHovered, _setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [currentZone, setCurrentZone] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVelocity, setCursorVelocity] = useState({ x: 0, y: 0 });
  const [orbitTick, setOrbitTick] = useState(0);
  
  const containerRef = useRef(null);
  const tipTimer = useRef(null);
  const hasEnteredRef = useRef(false);
  const idleTimerRef = useRef(null);
  const zoneTimerRef = useRef(null);
  const roamTimerRef = useRef(null);
  const prevCursorRef = useRef({ x: 0, y: 0 });

  // Compute pixel position from viewport-percentage anchor
  const getAnchorPosition = useCallback((anchorIndex) => {
    const anchor = SECTION_ANCHORS[anchorIndex] || SECTION_ANCHORS[0];
    const anchorX = isRtl ? (100 - anchor.x) : anchor.x;
    return {
      x: (anchorX / 100) * window.innerWidth - COMPANION_SIZE / 2,
      y: (anchor.y / 100) * window.innerHeight - COMPANION_SIZE / 2,
    };
  }, [isRtl]);

  // ─── Handle zone changes ───
  const handleZoneChange = useCallback((zone) => {
    if (!zone || isJumping) return;

    setCurrentZone(zone);

    // Clear existing reaction timer
    if (zoneTimerRef.current) clearTimeout(zoneTimerRef.current);

    // Get the reaction pose/tip from zone
    const zoneInfo = ZONES.find((z) => z.id === zone.id);
    if (zoneInfo) {
      setCurrentPose(normalizePose(zoneInfo.reaction || COGNI_POSES.WAVING));
      setShowTip(true);

      // Auto-hide tip after 2 seconds
      zoneTimerRef.current = setTimeout(() => {
        setShowTip(false);
      }, 2000);
    }
  }, [isJumping]);

  useEffect(() => {
    if (!activeZone) return;
    handleZoneChange(activeZone);
  }, [activeZone, handleZoneChange]);

  const focusTip = useMemo(() => {
    if (!focusTarget?.label) return '';

    const label = focusTarget.label;
    if (/(get started|start free|join|submit|continue|watch demo|book|sign up)/i.test(label)) {
      return `🚀 ${label}`;
    }

    if (/(search|filter|input|form|field|settings|menu|login|sign in)/i.test(label)) {
      return `🧭 ${label}`;
    }

    return `👀 ${label}`;
  }, [focusTarget]);

  // ─── Track Cursor for 3D Character ───
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize cursor for the 3D scene focus
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      setCursorVelocity({
        x: x - prevCursorRef.current.x,
        y: y - prevCursorRef.current.y,
      });

      setCursorPos({ x, y });
      prevCursorRef.current = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!focusTarget?.rect || isJumping) return undefined;

    const orbitTimer = window.setInterval(() => {
      setOrbitTick((v) => v + 1);
    }, 900);

    return () => window.clearInterval(orbitTimer);
  }, [focusTarget, isJumping]);

  useEffect(() => {
    if (!focusTarget?.rect || isJumping) return;

    const { rect, label, kind } = focusTarget;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pad = 72;
    const safeMargin = 12;
    const targetBuffer = 28;

    const bufferedRect = {
      left: rect.left - targetBuffer,
      right: rect.right + targetBuffer,
      top: rect.top - targetBuffer,
      bottom: rect.bottom + targetBuffer,
    };

    const candidatePositions = [
      {
        x: rect.right + pad,
        y: rect.top + rect.height / 2 - COMPANION_SIZE / 2,
      },
      {
        x: rect.left - COMPANION_SIZE - pad,
        y: rect.top + rect.height / 2 - COMPANION_SIZE / 2,
      },
      {
        x: rect.left + rect.width / 2 - COMPANION_SIZE / 2,
        y: rect.bottom + pad,
      },
      {
        x: rect.left + rect.width / 2 - COMPANION_SIZE / 2,
        y: rect.top - COMPANION_SIZE - pad,
      },
      {
        x: rect.right + pad,
        y: rect.bottom + pad,
      },
      {
        x: rect.left - COMPANION_SIZE - pad,
        y: rect.bottom + pad,
      },
      {
        x: rect.right + pad,
        y: rect.top - COMPANION_SIZE - pad,
      },
      {
        x: rect.left - COMPANION_SIZE - pad,
        y: rect.top - COMPANION_SIZE - pad,
      },
    ];

    const orderedCandidates = isRtl
      ? [
          candidatePositions[1],
          candidatePositions[0],
          candidatePositions[5],
          candidatePositions[4],
          candidatePositions[2],
          candidatePositions[3],
          candidatePositions[7],
          candidatePositions[6],
        ]
      : [
          candidatePositions[0],
          candidatePositions[1],
          candidatePositions[4],
          candidatePositions[5],
          candidatePositions[2],
          candidatePositions[3],
          candidatePositions[6],
          candidatePositions[7],
        ];
    const orbitShift = orderedCandidates.length > 0 ? orbitTick % orderedCandidates.length : 0;
    const orbitOrderedCandidates = [
      ...orderedCandidates.slice(orbitShift),
      ...orderedCandidates.slice(0, orbitShift),
    ];

    const clampPos = (p) => ({
      x: Math.max(safeMargin, Math.min(p.x, viewportWidth - COMPANION_SIZE - safeMargin)),
      y: Math.max(safeMargin, Math.min(p.y, viewportHeight - COMPANION_SIZE - safeMargin)),
    });

    const overlapsTarget = (p) => !(
      p.x + COMPANION_SIZE < bufferedRect.left ||
      p.x > bufferedRect.right ||
      p.y + COMPANION_SIZE < bufferedRect.top ||
      p.y > bufferedRect.bottom
    );

    let chosen = clampPos(orbitOrderedCandidates[0]);
    for (const candidate of orbitOrderedCandidates) {
      const clamped = clampPos(candidate);
      if (!overlapsTarget(clamped)) {
        chosen = clamped;
        break;
      }
    }

    if (overlapsTarget(chosen)) {
      const targetCenterX = rect.left + rect.width / 2;
      const targetCenterY = rect.top + rect.height / 2;
      const targetLeftHalf = targetCenterX < viewportWidth / 2;
      const targetTopHalf = targetCenterY < viewportHeight / 2;
      const emergency = clampPos({
        x: targetLeftHalf ? viewportWidth - COMPANION_SIZE - safeMargin : safeMargin,
        y: targetTopHalf ? viewportHeight - COMPANION_SIZE - safeMargin : safeMargin,
      });
      chosen = emergency;
    }

    const lowerLabel = `${label} ${kind}`.toLowerCase();
    let pose = COGNI_POSES.POINTING;
    if (/(start|join|get started|watch demo|continue|submit|book|save|next)/i.test(lowerLabel)) {
      pose = COGNI_POSES.CELEBRATING;
    } else if (/(search|filter|input|field|menu|settings|login|sign in|form)/i.test(lowerLabel)) {
      pose = COGNI_POSES.THINKING;
    }

    setCurrentPose(pose);
    setShowTip(true);
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => setShowTip(false), 2200);

    controls.start({
      x: chosen.x,
      y: chosen.y,
      scale: 1.04,
      transition: {
        type: 'spring',
        stiffness: 135,
        damping: 14,
        mass: 1.15,
      },
    });
  }, [controls, focusTarget, isJumping, isRtl, orbitTick]);

  // ─── Entry animation ───
  useEffect(() => {
    hasEnteredRef.current = true;
    const pos = getAnchorPosition(0);
    controls.set({
      x: pos.x,
      y: pos.y,
      scale: 1,
      opacity: 1,
    });

    // Auto-hide tip
    tipTimer.current = setTimeout(() => setShowTip(false), 5000);

    return () => {
      if (tipTimer.current) clearTimeout(tipTimer.current);
    };
  }, [controls, getAnchorPosition]);

  useEffect(() => {
    const html = document?.documentElement;
    if (!html) return undefined;
    const observer = new MutationObserver(() => {
      setIsRtl(html.dir === 'rtl');
    });
    observer.observe(html, { attributes: true, attributeFilter: ['dir'] });
    return () => observer.disconnect();
  }, []);

  // ─── Idle animations: cycle through poses occasionally ───
  useEffect(() => {
    const startIdleCycle = () => {
      idleTimerRef.current = setInterval(() => {
        if (isJumping) return;
        // Random idle pose swap
        const idlePoses = [COGNI_POSES.IDLE, COGNI_POSES.WAVING, COGNI_POSES.THINKING, COGNI_POSES.CURIOUS];
        const randomPose = idlePoses[Math.floor(Math.random() * idlePoses.length)];
        setCurrentPose(randomPose);
      }, 6000);
    };

    startIdleCycle();
    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [isJumping]);

  // ─── Scroll-based section detection (real section geometry) ───
  useEffect(() => {
    const resolveAnchorFromViewport = () => {
      let nextAnchor = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      const viewportCenter = window.innerHeight * 0.42;

      SECTION_ANCHORS.forEach((anchor, index) => {
        const sectionNode = document.getElementById(anchor.sectionId);
        if (!sectionNode) return;
        const rect = sectionNode.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          nextAnchor = index;
        }
      });
      return nextAnchor;
    };

    const handleScroll = () => {
      const newAnchor = resolveAnchorFromViewport();

      if (newAnchor !== currentAnchor && hasEnteredRef.current) {
        setCurrentAnchor(newAnchor);
        jumpToAnchor(newAnchor);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [currentAnchor]);

  // ─── Jump animation between sections ───
  const jumpToAnchor = useCallback(
    (anchorIndex) => {
      const pos = getAnchorPosition(anchorIndex);
      const anchor = SECTION_ANCHORS[anchorIndex];
      setIsJumping(true);

      // Show tip
      setShowTip(true);
      if (tipTimer.current) clearTimeout(tipTimer.current);
      tipTimer.current = setTimeout(() => setShowTip(false), 3500);

      // Phase 1: Squash down (anticipation)
      controls.start({
        scaleX: 1.2,
        scaleY: 0.8,
        transition: { duration: 0.1, ease: 'easeOut' },
      }).then(() => {
        // Phase 2: Stretch + fly to new position
        setCurrentPose(COGNI_POSES.CELEBRATING);
        return controls.start({
          x: pos.x,
          y: pos.y - 50,
          scaleX: 0.85,
          scaleY: 1.2,
          transition: {
            x: { type: 'spring', stiffness: 70, damping: 14 },
            y: { type: 'spring', stiffness: 70, damping: 14 },
            scaleX: { duration: 0.15 },
            scaleY: { duration: 0.15 },
          },
        });
      }).then(() => {
        // Phase 3: Landing squash
        return controls.start({
          y: pos.y,
          scaleX: 1.1,
          scaleY: 0.9,
          transition: { duration: 0.12, ease: 'easeOut' },
        });
      }).then(() => {
        // Phase 4: Settle to rest
        setCurrentPose(anchor.pose);
        return controls.start({
          scaleX: 1,
          scaleY: 1,
          transition: { type: 'spring', stiffness: 300, damping: 12 },
        });
      }).then(() => {
        setIsJumping(false);
      });
    },
    [controls, getAnchorPosition]
  );

  // ─── Autonomous roaming when no focused element ───
  useEffect(() => {
    if (focusTarget?.rect || isJumping) return undefined;

    if (roamTimerRef.current) clearInterval(roamTimerRef.current);
    roamTimerRef.current = setInterval(() => {
      setCurrentAnchor((prev) => {
        const next = (prev + 1) % SECTION_ANCHORS.length;
        jumpToAnchor(next);
        return next;
      });
    }, 4200);

    return () => {
      if (roamTimerRef.current) clearInterval(roamTimerRef.current);
    };
  }, [focusTarget, isJumping, jumpToAnchor]);

  // ─── Click handler ───
  const _handleClick = useCallback(() => {
    setClickCount((c) => c + 1);
    setCurrentPose(COGNI_POSES.DANCING);

    // Bounce up
    const pos = getAnchorPosition(currentAnchor);
    controls.start({
      y: pos.y - 40,
      rotate: [0, -10, 10, -5, 5, 0],
      transition: {
        y: { type: 'spring', stiffness: 400, damping: 8 },
        rotate: { duration: 0.6 },
      },
    }).then(() => {
      controls.start({
        y: pos.y,
        transition: { type: 'spring', stiffness: 250, damping: 12 },
      });
    });

    // Show fun tip
    setShowTip(true);
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => {
      setShowTip(false);
      setCurrentPose(SECTION_ANCHORS[currentAnchor]?.pose || COGNI_POSES.IDLE);
    }, 2500);
  }, [controls, currentAnchor, getAnchorPosition]);

  const clickTips = useMemo(() => [
    '😄 That tickles!',
    '🧠 Big brain energy!',
    '✨ Let\'s explore together!',
    '🎉 Wheeee!',
    '💜 You\'re awesome!',
    '🤖 Beep boop beep!',
    '🌟 I love helping!',
    '🎵 La la la~',
  ], []);

  const currentTip = useMemo(() => {
    if (focusTarget && showTip && focusTip) return focusTip;
    if (currentZone && showTip) return currentZone.tip || '';
    if (clickCount > 0 && showTip) return clickTips[(clickCount - 1) % clickTips.length];
    return SECTION_ANCHORS[currentAnchor]?.tip || '';
  }, [clickCount, currentAnchor, clickTips, currentZone, focusTarget, focusTip, showTip]);
  const isElementEngaged = Boolean(focusTarget?.rect);
  const initialPosition = useMemo(() => {
    const anchorX = isRtl ? 0.24 : 0.76;
    // Guard window access for SSR/hydration safety
    if (typeof window === 'undefined') {
      return { x: 0, y: 0 };
    }
    return {
      x: (window.innerWidth * anchorX) - (COMPANION_SIZE / 2),
      y: (window.innerHeight * 0.28) - (COMPANION_SIZE / 2),
    };
  }, [isRtl]);
  // ─── Window resize ───
  useEffect(() => {
    const handleResize = () => {
      if (hasEnteredRef.current) {
        const pos = getAnchorPosition(currentAnchor);
        controls.set({ x: pos.x, y: pos.y });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [controls, currentAnchor, getAnchorPosition]);

  return (
    <motion.div
      ref={containerRef}
      className="cogni-companion-container"
      initial={{ scale: 1, opacity: 1, x: initialPosition.x, y: initialPosition.y }}
      animate={controls}
      style={{
        position: 'fixed',
        width: COMPANION_SIZE,
        height: COMPANION_SIZE,
        zIndex: isElementEngaged ? 42 : 22,
        cursor: 'default',
        pointerEvents: 'none',
      }}
    >
      {/* Glow ring behind character */}
      <div className="cogni-motion-halo" />
      <div
        className="cogni-glow-ring"
        style={{
          opacity: isElementEngaged ? 0.62 : 0.3,
          transform: `scale(${isElementEngaged ? 1.12 : 1})`,
        }}
      />
      {isElementEngaged && <div className="cogni-engage-dot" />}

      {/* Speech bubble — positioned above */}
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 8,
        whiteSpace: 'nowrap',
        zIndex: 50,
      }}>
        <SpeechBubble text={currentTip} visible={showTip} />
      </div>

      {/* 3D Character Canvas */}
      <div className="cogni-media-stage">
        <Canvas
          className="cogni-media-frame"
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 4.5]} fov={50} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 15, 8]} intensity={2.5} />
            <Environment preset="city" />
            
            <CogniCharacter 
              animationState={currentPose} 
              cursorPos={cursorPos}
              cursorVelocity={cursorVelocity}
              onClick={() => setCurrentPose(COGNI_POSES.JUMPING)}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Click ripple */}
      {clickCount > 0 && (
        <div className="cogni-click-ripple" key={clickCount} />
      )}
    </motion.div>
  );
}

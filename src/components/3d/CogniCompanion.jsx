import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { useAnimation, AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './CogniCompanion.css';
import { ZONES } from '../ui/InteractiveZones';

/* ─── 3D Character integration ─── */
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, useTexture } from '@react-three/drei';
import { Suspense } from 'react';
import CogniCharacter from './CogniCharacter';
import { COGNI_POSES, COGNI_POSE_TEXTURES, normalizePose } from './cogniPoseConfig';
import initialPoseSrc from '../../assets/cogni/cogni-initialpose.png';

/* Kick off texture downloads immediately at module-evaluation time so they are
 * either already cached or well underway before CogniCharacter mounts. */
if (typeof window !== 'undefined') {
  Object.values(COGNI_POSE_TEXTURES).forEach((path) => useTexture.preload(path));
}

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

// Responsive companion size based on viewport width
const getCompanionSize = () => {
  if (typeof window === 'undefined') return 310;
  const vw = window.innerWidth;
  if (vw < 380) return 0;    // Hidden on very tiny screens (handled by CSS)
  if (vw < 520) return 130;  // Small on mobile
  if (vw < 768) return 200;  // Smaller on tablets
  if (vw < 1024) return 250; // Medium on small laptops
  return 310;                 // Full size on desktop
};

const COMPANION_SIZE = 310; // Default for SSR

/* ─── Enhanced Speech Bubble with animations ─── */
function SpeechBubble({ text, visible, isRtl }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="cogni-speech-bubble"
          dir={isRtl ? 'rtl' : 'ltr'}
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
  const { t, i18n } = useTranslation();
  const [isRtl, setIsRtl] = useState(() => document?.documentElement?.dir === 'rtl');
  const [currentAnchor, setCurrentAnchor] = useState(0);
  const [currentPose, setCurrentPose] = useState(COGNI_POSES.WAVING);
  const [showTip, setShowTip] = useState(true);
  const [_isHovered, _setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [is3dReady, setIs3dReady] = useState(false);
  const [currentZone, setCurrentZone] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVelocity, setCursorVelocity] = useState({ x: 0, y: 0 });
  const [orbitTick, setOrbitTick] = useState(0);
  const [companionSize, setCompanionSize] = useState(() => getCompanionSize());
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef(null);
  const tipTimer = useRef(null);
  const hasEnteredRef = useRef(false);
  const zoneTimerRef = useRef(null);
  const prevCursorRef = useRef({ x: 0, y: 0 });
  const userDragged = useRef(false);
  const isDraggingRef = useRef(false);
  const dragOrigin = useRef({ pointerX: 0, pointerY: 0, elemX: 0, elemY: 0 });
  const currentPosRef = useRef(null);

  // Compute pixel position from viewport-percentage anchor
  const getAnchorPosition = useCallback((anchorIndex) => {
    const anchor = SECTION_ANCHORS[anchorIndex] || SECTION_ANCHORS[0];
    const safeMargin = 10; // Minimum distance from viewport edge
    const size = companionSize;
    
    // Calculate X position with proper RTL handling
    let x;
    if (isRtl) {
      // For RTL: mirror the position from the right edge
      const mirroredX = 100 - anchor.x;
      x = (mirroredX / 100) * window.innerWidth - size / 2;
    } else {
      // For LTR: normal positioning from left
      x = (anchor.x / 100) * window.innerWidth - size / 2;
    }
    
    const y = (anchor.y / 100) * window.innerHeight - size / 2;
    
    // Clamp position to ensure companion stays within viewport bounds
    return {
      x: Math.max(safeMargin, Math.min(x, window.innerWidth - size - safeMargin)),
      y: Math.max(safeMargin, Math.min(y, window.innerHeight - size - safeMargin)),
    };
  }, [isRtl, companionSize]);

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
      return t('cogniCompanion.focusTipAction', { label });
    }

    if (/(search|filter|input|form|field|settings|menu|login|sign in)/i.test(label)) {
      return t('cogniCompanion.focusTipNav', { label });
    }

    return t('cogniCompanion.focusTipGeneric', { label });
  }, [focusTarget, t]);

  const sectionTips = useMemo(() => [
    t('cogniCompanion.tipHero'),
    t('cogniCompanion.tipFeatures'),
    t('cogniCompanion.tipCta'),
    t('cogniCompanion.tipFooter'),
  ], [t]);

  // ─── Track Cursor for 3D Character ───
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
    if (!focusTarget?.rect || isJumping || userDragged.current) return undefined;

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

    const size = companionSize;
    const candidatePositions = [
      {
        x: rect.right + pad,
        y: rect.top + rect.height / 2 - size / 2,
      },
      {
        x: rect.left - size - pad,
        y: rect.top + rect.height / 2 - size / 2,
      },
      {
        x: rect.left + rect.width / 2 - size / 2,
        y: rect.bottom + pad,
      },
      {
        x: rect.left + rect.width / 2 - size / 2,
        y: rect.top - size - pad,
      },
      {
        x: rect.right + pad,
        y: rect.bottom + pad,
      },
      {
        x: rect.left - size - pad,
        y: rect.bottom + pad,
      },
      {
        x: rect.right + pad,
        y: rect.top - size - pad,
      },
      {
        x: rect.left - size - pad,
        y: rect.top - size - pad,
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
      x: Math.max(safeMargin, Math.min(p.x, viewportWidth - size - safeMargin)),
      y: Math.max(safeMargin, Math.min(p.y, viewportHeight - size - safeMargin)),
    });

    const overlapsTarget = (p) => !(
      p.x + size < bufferedRect.left ||
      p.x > bufferedRect.right ||
      p.y + size < bufferedRect.top ||
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
        x: targetLeftHalf ? viewportWidth - size - safeMargin : safeMargin,
        y: targetTopHalf ? viewportHeight - size - safeMargin : safeMargin,
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

    currentPosRef.current = chosen;
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
  }, [controls, focusTarget, isJumping, isRtl, orbitTick, companionSize]);

  // ─── Entry animation ───
  useEffect(() => {
    hasEnteredRef.current = true;
    const pos = getAnchorPosition(0);
    currentPosRef.current = pos;
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

  // Re-show tip whenever language changes so translated text is visible
  useEffect(() => {
    if (tipTimer.current) clearTimeout(tipTimer.current);
    setShowTip(true);
    tipTimer.current = setTimeout(() => setShowTip(false), 4000);
  }, [i18n.language]);


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
      if (userDragged.current) return;
      const pos = getAnchorPosition(anchorIndex);
      currentPosRef.current = pos;
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

  const initialPosition = useMemo(() => {
    // Guard window access for SSR/hydration safety
    if (typeof window === 'undefined') {
      return { x: 0, y: 0 };
    }
    const anchor = SECTION_ANCHORS[0];
    const safeMargin = 10;
    const size = companionSize;
    
    // Calculate X position with proper RTL handling
    let x;
    if (isRtl) {
      const mirroredX = 100 - anchor.x;
      x = (mirroredX / 100) * window.innerWidth - size / 2;
    } else {
      x = (anchor.x / 100) * window.innerWidth - size / 2;
    }
    
    const y = (anchor.y / 100) * window.innerHeight - size / 2;
    
    // Clamp to viewport bounds
    return {
      x: Math.max(safeMargin, Math.min(x, window.innerWidth - size - safeMargin)),
      y: Math.max(safeMargin, Math.min(y, window.innerHeight - size - safeMargin)),
    };
  }, [isRtl, companionSize]);

  // ─── Drag handlers ───
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragOrigin.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      elemX: currentPosRef.current?.x ?? initialPosition.x,
      elemY: currentPosRef.current?.y ?? initialPosition.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [initialPosition]);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragOrigin.current.pointerX;
    const dy = e.clientY - dragOrigin.current.pointerY;
    const newX = Math.max(0, Math.min(dragOrigin.current.elemX + dx, window.innerWidth - companionSize));
    const newY = Math.max(0, Math.min(dragOrigin.current.elemY + dy, window.innerHeight - companionSize));
    currentPosRef.current = { x: newX, y: newY };
    controls.set({ x: newX, y: newY });
  }, [controls, companionSize]);

  const handlePointerUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    const dx = e.clientX - dragOrigin.current.pointerX;
    const dy = e.clientY - dragOrigin.current.pointerY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      userDragged.current = true;
    }
  }, []);

  const handlePointerCancel = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const clickTips = useMemo(() => [
    t('cogniCompanion.clickTip0'),
    t('cogniCompanion.clickTip1'),
    t('cogniCompanion.clickTip2'),
    t('cogniCompanion.clickTip3'),
    t('cogniCompanion.clickTip4'),
    t('cogniCompanion.clickTip5'),
    t('cogniCompanion.clickTip6'),
    t('cogniCompanion.clickTip7'),
  ], [t]);

  const currentTip = useMemo(() => {
    if (focusTarget && showTip && focusTip) return focusTip;
    if (currentZone && showTip) return currentZone.tipKey ? t(currentZone.tipKey) : '';
    if (clickCount > 0 && showTip) return clickTips[(clickCount - 1) % clickTips.length];
    return sectionTips[currentAnchor] || '';
  }, [clickCount, currentAnchor, clickTips, currentZone, focusTarget, focusTip, sectionTips, showTip, t]);
  const isElementEngaged = Boolean(focusTarget?.rect);
  // ─── Window resize ───
  useEffect(() => {
    const handleResize = () => {
      const newSize = getCompanionSize();
      setCompanionSize(newSize);
      if (hasEnteredRef.current && !userDragged.current) {
        const pos = getAnchorPosition(currentAnchor);
        currentPosRef.current = pos;
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: companionSize,
        height: companionSize,
        zIndex: isElementEngaged ? 42 : 22,
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: companionSize === 0 ? 'none' : 'auto',
        touchAction: 'none',
        userSelect: 'none',
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
        zIndex: 50,
        direction: isRtl ? 'rtl' : 'ltr',
      }}>
        <SpeechBubble text={currentTip} visible={showTip} isRtl={isRtl} />
      </div>

      {/* 3D Character Canvas — placeholder shown until textures are downloaded */}
      <div className="cogni-media-stage">
        {!is3dReady && (
          <img
            src={initialPoseSrc}
            className="cogni-loading-placeholder"
            aria-hidden="true"
            alt=""
          />
        )}
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
              onReady={() => setIs3dReady(true)}
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

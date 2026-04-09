# 🎯 Testing & Quick Start Guide - Cognicare Landing Page Redesign

## ✨ What's New - Feature Showcase

### 🔄 7+ Animation States
Move your cursor around the page and watch Cogni react to different zones:

1. **Header Zone** → `excited` - Rapid bouncing animation
2. **Features Zone** → `thinking` - Head tilt with antenna wobble  
3. **CTA Zone** → `celebrating` - Full celebration with jump
4. **Footer Zone** → `waving` - Wave-like particle motion
5. **Click Anywhere** → `jumping` - Multi-phase jump with squash/stretch
6. **Continuous Idle** → `curious` animations with head tilts

### ✨ Advanced Cursor Effects
- **Magnetic Particles**: All particles are attracted toward your cursor
- **Energy Waves**: Pulsing rings appear when you move fast
- **Multi-Shape Particles**: Circles, diamonds, and stars
- **Glow Core**: Bright center with expanding halo (40-70px radius)
- **3 Shape Variety**: Keeps visual interest high

### 🎬 Interactive Zones
The page is divided into 4 invisible interactive regions:
- **0-15%** down: Header zone (excited Cogni)
- **25-60%** down: Features zone (thinking Cogni)
- **65-90%** down: CTA zone (celebrating Cogni)
- **90-100%** down: Footer zone (waving Cogni)

*Try scrolling and hovering over different sections!*

### 💥 Click Effects
Click anywhere on the page (except buttons/links) to trigger:
- Particle burst in 12-20 colorful particles
- Radial spread animation
- Glow halos on each particle

---

## 🚀 Quick Start (Local Testing)

### 1. **Navigate to the project**
```bash
cd /Users/mac/pim/cognicareweb
```

### 2. **Start the dev server**
```bash
npm run dev
```

### 3. **Open in browser**
```
http://localhost:5173
```

### 4. **Test the features**
- Move your mouse around → See cursor trail + Cogni reactions
- Scroll the page → Zone changes trigger different poses
- Hover over sections → Speech bubbles appear
- Click anywhere → Particle burst effect
- Wait idle → Cogni breathes and occasionally looks around

---

## 🎮 Interactive Testing Scenarios

### Scenario 1: Cursor Exploration
1. Move mouse slowly across the page
2. Watch particles trail behind your cursor
3. Notice the magnetic pull as particles curve toward cursor
4. Move faster → More particles spawn, energy rings appear

### Scenario 2: Zone Reactions
1. Scroll to the **Header** (top 15%)
2. Cogni should show **excited** pose with tip "👋 Welcome back!"
3. Scroll to **Features** section
4. Cogni switches to **thinking** pose
5. Scroll to **CTA** section  
6. Cogni celebr **celebrating** pose "🚀 Ready to join?"

### Scenario 3: Click Interaction
1. Click on empty area of page
2. Observe particle burst radiating from click point
3. Each particle has glow halo and fade animation
4. Cogni also reacts with jump animation if clickable zone active

### Scenario 4: Energy System
1. Interact heavily (lots of clicks, fast mouse movement)
2. Cogni's animations become more intense
3. Energy level naturally decays over ~6 seconds
4. Watch animations calm down as energy decreases

---

## 🔍 Debugging & Inspection

### Enable Zone Debug Overlay
Edit `src/components/ui/InteractiveZones.jsx`:
```javascript
const DEBUG = true; // Change from false to true
```
Then you'll see colored boxes showing zone boundaries.

### Check Console Logs
Open DevTools (F12) and look for zone change events in console.

### Performance Monitoring
- Open DevTools → Performance tab
- Record for 5 seconds of interaction
- Check FPS (target: 60 FPS)
- Monitor memory usage

### Particle Count Verification
- Open DevTools → Console
- Try: `document.querySelectorAll('canvas').length` 
- Should show 1 canvas (CursorEffect) + others for 3D scene

---

## 📊 Expected Visual Behaviors

### Cursor Effect
```
Slow movement    → Few particles, slow spawn rate
Fast movement    → Many particles, rapid spawn
Very fast        → Max particles (120), energy waves
Stationary       → Particles drift away with wobble
```

### Cogni Character
```
Idle             → Subtle breathing, occasional blink
Energy High      → Fast animations, intense distortion
Energy Low       → Slow movements, minimal effects
Near cursor      → Intensified reactions, wider pupils
```

### Zones
```
Zone 1 (Header)      → "excited" + tip after 2s auto-hide
Zone 2 (Features)    → "thinking" + tip after 2s auto-hide  
Zone 3 (CTA)         → "celebrating" + tip after 2s auto-hide
Zone 4 (Footer)      → "waving" + tip after 2s auto-hide
```

---

## 🎯 Verification Checklist

- [ ] **Cursor Trail Works**
  - Move mouse, see particle trail
  - Particles fade out smoothly
  - Different shapes visible

- [ ] **Zone Detection Works**
  - Scroll to different sections
  - Cogni pose changes
  - Tips appear and disappear

- [ ] **Click Effects Work**
  - Click on page
  - Particles burst out
  - Cogni jumps

- [ ] **Energy System Works**
  - Click multiple times
  - Animations intensify
  - Gradually calm down

- [ ] **Performance Acceptable**
  - No lag when moving mouse
  - FPS stays ~60
  - No memory leaks after 2 minutes

- [ ] **Mobile Responsive**
  - Open on mobile device
  - Zones still work (touch instead of hover)
  - Cursor effects adapt to screen size

---

## 🛠️ Troubleshooting

### Issue: No cursor effects visible
**Solution**: Check if CursorEffect component is imported in LandingPage.jsx

### Issue: Cogni not reacting to zones
**Solution**: 
1. Check InteractiveZones component is imported
2. Verify onZoneChange callback is passed
3. Check browser console for errors

### Issue: Cogni is not visible
**Solution**:
1. Confirm route is `"/"` and renders `src/pages/home/LandingPage.jsx`.
2. Verify `src/components/3d/CogniCompanion.jsx` is mounted in the page tree.
3. Ensure Cogni assets exist under `src/assets/cogni_v2/`:
   - `image_0.png` ... `image_4.png`
   - `ChatGPT Image Apr 5, 2026, 03_29_42 PM.png`
   - `ChatGPT Image Apr 5, 2026, 03_35_17 PM.png`
4. Verify fallback sprite layer exists in `CogniCompanion`:
   - `<img className="cogni-fallback-sprite" ... />`
5. Check responsive behavior:
   - Companion intentionally hides only below `520px` width.
6. Check z-index layering:
   - Companion container should render above landing overlays (`z-index: 60`).

### Issue: Performance is poor
**Solution**:
1. Reduce particle limit in CursorEffect.jsx (line ~40)
2. Close other browser tabs
3. Check GPU driver is updated

### Issue: Particles not magnetic to cursor
**Solution**: This is expected behavior - they drift after cursor passes. The effect is strongest near cursor position.

---

## 📈 Performance Metrics (Expected)

### Memory Usage
- Initial load: ~45 MB
- After interaction: ~50-55 MB (particles)
- After cleanup: Returns to ~50 MB

### CPU Usage
- Idle: ~2-5%
- Cursor animation: ~15-25%
- Multiple zones active: ~25-35%

### Frame Rate
- Consistent 60 FPS on modern browsers
- Drops to 30-45 FPS on older devices
- Mobile: 30-60 FPS depending on device

---

## 🎨 Visual Customization

### Want to change particle colors?
Edit `CursorEffect.jsx` line ~30:
```javascript
const COLORS = [
  { r: 147, g: 112, b: 219 }, // purple
  // Add or modify colors here
];
```

### Want to change zone boundaries?
Edit `InteractiveZones.jsx` line ~20:
```javascript
const ZONES = [
  {
    id: 'header',
    bounds: { x: 0, y: 0, width: 1, height: 0.15 }, // ← adjust height
    ...
  },
];
```

### Want different Cogni animations?
Check `CogniCharacter.jsx` line ~200+ for animation state logic.

---

## 📞 Support & Issues

### Common Questions

**Q: Can I disable particle effects?**  
A: Yes, remove `<CursorEffect />` from LandingPage.jsx

**Q: Can I add more zones?**  
A: Yes, add entries to ZONES array in InteractiveZones.jsx

**Q: Can Cogni follow my cursor directly?**  
A: Currently follows subtly (30% of offset). Edit position calc in CogniCharacter.jsx if needed.

**Q: Will this work on mobile?**  
A: Yes! Zones work with touch, cursor effects adapt to touch input.

---

## 🚀 Deployment Notes

### Build Command
```bash
npm run build
```

### Expected Output
```
LandingPage chunk: 34.50 kB (gzipped: 10.87 kB)
✓ built in 3.82s
```

### Pre-deployment Checklist
- [ ] Build succeeds (no errors)
- [ ] All animations play smoothly
- [ ] No console errors
- [ ] Mobile view tested
- [ ] Performance acceptable
- [ ] Zone detection working

---

## 📚 Related Files

- Component Implementation: `src/components/3d/CogniCharacter.jsx`
- Cursor Effects: `src/components/ui/CursorEffect.jsx`
- Zone System: `src/components/ui/InteractiveZones.jsx`
- Click Effects: `src/components/ui/ParticleBurst.jsx`
- Landing Page: `src/pages/home/LandingPage.jsx`
- Full Documentation: `architecture/LANDING_PAGE_REDESIGN.md`

---

**Happy Testing! 🎉**

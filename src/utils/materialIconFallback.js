const ICON_FALLBACKS = {
  admin_panel_settings: '🛡',
  arrow_back: '←',
  arrow_forward: '→',
  check: '✓',
  check_circle: '✓',
  close: '×',
  corporate_fare: '🏢',
  dark_mode: '🌙',
  download: '↓',
  error: '!',
  expand_more: '▾',
  grid_view: '▦',
  language: '🌐',
  light_mode: '☀',
  menu: '☰',
  phone_iphone: '📱',
  play_circle: '▶',
  psychology: '🧠',
  schedule: '⏱',
};

function applyFallbackIcons(root = document) {
  const nodes = root.querySelectorAll?.('.material-symbols-outlined');
  if (!nodes || nodes.length === 0) return;

  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.dataset.iconFallbackApplied === '1') return;

    const iconName = String(node.textContent || '').trim();
    const fallback = ICON_FALLBACKS[iconName];
    if (!fallback) return;

    node.dataset.iconFallbackApplied = '1';
    node.dataset.materialIconName = iconName;
    node.textContent = fallback;
    node.classList.add('material-symbol-fallback');
  });
}

export async function bootstrapMaterialIconFallback() {
  if (typeof document === 'undefined') return;

  let hasMaterialSymbolFont = false;
  try {
    if (document.fonts?.load) {
      await Promise.race([
        document.fonts.load('24px "Material Symbols Outlined"'),
        new Promise((resolve) => setTimeout(resolve, 1600)),
      ]);
    }
    hasMaterialSymbolFont = Boolean(
      document.fonts?.check?.('24px "Material Symbols Outlined"'),
    );
  } catch {
    hasMaterialSymbolFont = false;
  }

  if (hasMaterialSymbolFont) return;

  document.documentElement.classList.add('material-icons-fallback-active');
  applyFallbackIcons(document);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.('.material-symbols-outlined')) {
          applyFallbackIcons(node.parentElement || document);
          return;
        }
        applyFallbackIcons(node);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

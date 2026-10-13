// Climbing Toward Consequence — a small "build N" badge for the editors and tools, read from the service worker's VERSION so that it is always the one the game shows (no second number to bump).
(function () {
'use strict';
const b = document.createElement('div'); b.id = 'buildBadge'; b.textContent = 'build …';
b.style.cssText = 'position:fixed;left:8px;bottom:6px;z-index:9999;font:11px Georgia,serif;color:#e6c46a;background:rgba(10,12,16,0.7);border:1px solid #4a4d58;border-radius:6px;padding:2px 8px;pointer-events:none;opacity:.85';
document.addEventListener('DOMContentLoaded', () => document.body.appendChild(b));
fetch('sw.js', { cache: 'no-store' }).then(r => r.text()).then(t => { const m = /consequence-v\d+-(\d+)/.exec(t); b.textContent = m ? 'v0.4 · build ' + m[1] : 'build ?'; }).catch(() => { b.textContent = 'build ?'; });
})();

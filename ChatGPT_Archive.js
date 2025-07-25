// ==UserScript==
// @name         ChatGPT – Archive ALL (UI driven)
// @namespace    https://openai.com/
// @version      1.0
// @description  One-click bulk-archive of every visible ChatGPT conversation by pushing the real UI buttons. 2025-07-25
// @author       you
// @match        https://chat.openai.com/*
// @grant        none
// ==/UserScript==

(() => {
  /* ───────── helpers ───────── */
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // wait until fn() returns a truthy value or timeout (ms) is reached
  function waitFor(fn, timeout = 5000, interval = 50) {
    return new Promise((resolve, reject) => {
      const t0 = Date.now();
      (function loop() {
        const res = fn();
        if (res) return resolve(res);
        if (Date.now() - t0 > timeout) return reject('waitFor timeout');
        setTimeout(loop, interval);
      })();
    });
  }

  /* ───────── UI injection ───────── */
  function addArchiveAllBtn() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    if (document.querySelector('#archiveAllBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'archiveAllBtn';
    btn.textContent = 'Archive All';
    btn.style.cssText = `
      position:fixed;
      top:70px;
      right:20px;
      background:#10a37f;
      color:#fff;
      border:none;
      border-radius:4px;
      padding:6px 12px;
      cursor:pointer;
      font-size:14px;
      z-index:9999;`;

    btn.onclick = async () => {
      if (!confirm('Archive EVERY visible chat?')) return;
      btn.disabled = true; btn.textContent = 'Working…';

      const rows = [...nav.querySelectorAll('a[href^="/c/"]')];
      let done = 0;

      for (const row of rows) {
        try {
          // 1) open “…” menu
          const menuBtn = row.querySelector('button[aria-haspopup="menu"]');
          if (!menuBtn) continue;
          menuBtn.click();

          // 2) click "Archive" inside that menu
          const archiveItem = await waitFor(() =>
            [...document.querySelectorAll('[role="menu"] *')]
              .find(el => /archive/i.test(el.textContent)), 3000);

          archiveItem.click();

          // 3) confirm, if a modal appears
          try {
            const confirmBtn = await waitFor(() =>
              [...document.querySelectorAll('button')]
                .find(b => /archive|confirm/i.test(b.textContent)), 1000);
            confirmBtn.click();
          } catch { /* no confirm dialog – fine */ }

          // 4) give the UI a moment to remove the chat
          await sleep(400);
          done++;
          btn.textContent = `Archived ${done}/${rows.length}`;
        } catch (err) {
          console.error('Could not archive a chat:', err);
        }
      }

      btn.textContent = 'All done ✔';
      setTimeout(() => { btn.textContent = 'Archive All'; btn.disabled = false; }, 3000);
    };

    document.body.appendChild(btn);
  }

  /* ───────── boot ───────── */
  // sidebar appears after app framework has mounted → watch DOM
  const obs = new MutationObserver(addArchiveAllBtn);
  obs.observe(document.body, { childList: true, subtree: true });
  // try immediately in case the sidebar is already loaded
  addArchiveAllBtn();
})();

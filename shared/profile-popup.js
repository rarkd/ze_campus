/**
 * shared/profile-popup.js
 * Bottom Sheet Popup — Profile Self & Profile Teman
 *
 * API publik:
 *   ProfilePopup.openSelf()    → buka popup profil sendiri
 *   ProfilePopup.openFriend()  → buka popup profil teman
 *   ProfilePopup.close()       → tutup popup
 *
 * Gesture:
 *   - Saat peek (open): swipe ke atas → expand full, swipe ke bawah → tutup
 *   - Saat full: swipe ke bawah dari posisi scroll paling atas → collapse ke peek
 *   - Background (main-scroll) dikunci saat popup terbuka
 */

'use strict';

var ProfilePopup = (function () {

  var isFull      = false;
  var isOpen      = false;
  var currentMode = null;

  var overlay, sheet;

  /* Touch tracking */
  var touch = { startY: 0, startScrollTop: 0, tracking: false };
  var THRESHOLD = 55; /* minimum px geser untuk snap */

  /* ─────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────── */
  function init() {
    overlay = document.getElementById('profileOverlay');
    sheet   = document.getElementById('profileSheet');
    if (!overlay || !sheet) return;

    overlay.addEventListener('click', close);
    sheet.addEventListener('click', function (e) { e.stopPropagation(); });

    /* ─── Attach gesture ke SELURUH sheet ─── */
    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: false });
    sheet.addEventListener('touchend',   onTouchEnd,   { passive: true });
  }

  /* ─────────────────────────────────────────────
     TOUCH HANDLERS
  ───────────────────────────────────────────── */
  function onTouchStart(e) {
    touch.startY         = e.touches[0].clientY;
    touch.startScrollTop = sheet.scrollTop;
    touch.tracking       = true;
  }

  function onTouchMove(e) {
    if (!touch.tracking) return;
    var deltaY = e.touches[0].clientY - touch.startY;

    if (!isFull) {
      /* ── Peek state: cegah scroll internal sheet ── */
      e.preventDefault();
    } else {
      /* ── Full state ──
         - Geser ke bawah HANYA kalau sheet sudah di posisi atas (scrollTop ≈ 0)
           → cegah native scroll agar gesture collapse bisa berjalan
         - Kalau masih ada konten di atas → biarkan scroll normal
      */
      if (deltaY > 0 && sheet.scrollTop <= 0) {
        e.preventDefault();
      }
    }
  }

  function onTouchEnd(e) {
    if (!touch.tracking) return;
    touch.tracking = false;

    var deltaY = e.changedTouches[0].clientY - touch.startY;

    if (!isFull) {
      /* Peek state */
      if (deltaY < -THRESHOLD) {
        _setFull();            /* geser ke atas → full */
      } else if (deltaY > THRESHOLD) {
        close();               /* geser ke bawah → tutup */
      }
    } else {
      /* Full state — collapse hanya kalau sheet ada di posisi paling atas */
      if (deltaY > THRESHOLD && touch.startScrollTop <= 0) {
        _setPeek();            /* geser ke bawah dari atas → peek */
      }
    }
  }

  /* ─────────────────────────────────────────────
     STATE HELPERS
  ───────────────────────────────────────────── */
  function _setFull() {
    isFull = true;
    sheet.classList.add('full');
    sheet.classList.remove('open');
    /* overflow-y dikendalikan CSS class .full */
  }

  function _setPeek() {
    isFull = false;
    sheet.classList.remove('full');
    sheet.classList.add('open');
    sheet.scrollTop = 0;
    /* overflow kembali ke hidden via CSS */
  }

  /* ─────────────────────────────────────────────
     BUKA POPUP
  ───────────────────────────────────────────── */
  function openSelf() {
    currentMode = 'self';
    _show();
    _renderSelf();
  }

  function openFriend() {
    currentMode = 'friend';
    _show();
    _renderFriend();
  }

  function _show() {
    isOpen = true;
    isFull = false;
    document.body.classList.add('popup-open');
    overlay.classList.add('visible');
    sheet.classList.add('open');
    sheet.classList.remove('full');
    sheet.scrollTop = 0;
  }

  /* ─────────────────────────────────────────────
     TUTUP
  ───────────────────────────────────────────── */
  function close() {
    isOpen      = false;
    isFull      = false;
    currentMode = null;
    document.body.classList.remove('popup-open');
    overlay.classList.remove('visible');
    sheet.classList.remove('open', 'full');
  }

  /* ─────────────────────────────────────────────
     RENDER — SELF
  ───────────────────────────────────────────── */
  function _renderSelf() {
    var el = document.getElementById('sheetDynamic');
    if (!el) return;
    el.innerHTML =
      '<div class="sheet-actions">' +
        '<button class="sheet-btn">Market</button>' +
        '<button class="sheet-btn">Edit Profile</button>' +
        '<button class="sheet-btn sheet-btn--icon">&#x2026;</button>' +
      '</div>' +

      '<p class="sheet-section-title">Inventory</p>' +
      '<div class="sheet-tabs">' +
        '<button class="sheet-tab active">Frame</button>' +
        '<button class="sheet-tab">Border</button>' +
        '<button class="sheet-tab">Name</button>' +
      '</div>' +
      '<div class="sheet-item-grid">' +
        _card(true) + _card(true) + _card(true) + _card(true) +
      '</div>' +

      '<p class="sheet-bio-title">Bio</p>' +
      '<p class="sheet-bio-text">Bio Deskription</p>' +

      '<p class="sheet-since-title">Member Since</p>' +
      '<p class="sheet-since-text">Feb 27, 2020</p>';

    _bindTabs(el);
  }

  /* ─────────────────────────────────────────────
     RENDER — FRIEND
  ───────────────────────────────────────────── */
  function _renderFriend() {
    var el = document.getElementById('sheetDynamic');
    if (!el) return;
    el.innerHTML =
      '<div class="sheet-actions">' +
        '<button class="sheet-btn">Message</button>' +
        '<button class="sheet-btn">Add Friend</button>' +
        '<button class="sheet-btn sheet-btn--icon">&#x2026;</button>' +
      '</div>' +

      '<p class="sheet-section-title">Currently Wearing</p>' +
      '<div class="sheet-item-grid">' +
        _card(false) + _card(false) + _card(false) + _card(false) +
      '</div>' +

      '<p class="sheet-bio-title">Bio</p>' +
      '<p class="sheet-bio-text">Bio Deskription</p>' +

      '<p class="sheet-since-title">Member Since</p>' +
      '<p class="sheet-since-text">Feb 27, 2020</p>';
  }

  /* ─────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────── */
  function _card(withUse) {
    return (
      '<div class="sheet-item">' +
        '<div class="sheet-item__thumb"></div>' +
        '<span class="sheet-item__desc">Bio Deskription</span>' +
        (withUse ? '<button class="sheet-item__use">use</button>' : '') +
      '</div>'
    );
  }

  function _bindTabs(container) {
    var tabs = container.querySelectorAll('.sheet-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
      });
    });
  }

  /* ─────────────────────────────────────────────
     AUTO-INIT
  ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { openSelf: openSelf, openFriend: openFriend, close: close };

})();

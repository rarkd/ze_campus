/**
 * carts/carts.js — Ze Campus Carts Page Logic
 *
 * Navbar hide-on-scroll, transparan → biru saat scroll,
 * setTopInset (notch), Profile popup, bottom nav active.
 * Sama persis dengan home.js agar tidak ada bug perbedaan.
 */

'use strict';

/* ============================================================
   1. NAVBAR HIDE ON SCROLL
============================================================ */
(function initNavbarHide() {
  var navTop    = document.getElementById('navbarTop');
  var navBottom = document.getElementById('navbarBottom');
  var scroll    = document.getElementById('mainScroll');
  if (!navTop || !navBottom || !scroll) return;

  var lastY     = 0;
  var ticking   = false;
  var THRESHOLD = 8;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  function update() {
    var currentY = scroll.scrollTop;
    var delta    = currentY - lastY;

    if (Math.abs(delta) < THRESHOLD) { ticking = false; return; }

    if (delta > 0 && currentY > 60) {
      navTop.classList.add('hidden');
      navBottom.classList.add('hidden');
    } else {
      navTop.classList.remove('hidden');
      navBottom.classList.remove('hidden');
    }

    navTop.classList.toggle('scrolled', currentY > 10);

    lastY   = currentY;
    ticking = false;
  }

  scroll.addEventListener('scroll', onScroll, { passive: true });
})();


/* ============================================================
   2. NOTCH / KAMERA DEPAN
   Dipanggil dari Kotlin (MainActivity.kt) setelah halaman siap.
   Native mengirim PHYSICAL pixel → dikonversi ke CSS pixel.
============================================================ */
function setTopInset(px) {
  var ratio = window.devicePixelRatio || 1;
  var cssPx = Math.round(px / ratio);

  document.documentElement.style.setProperty('--safe-top', cssPx + 'px');

  var mainScroll = document.getElementById('mainScroll');
  if (mainScroll) {
    mainScroll.style.paddingTop = (56 + cssPx) + 'px';
  }
}


/* ============================================================
   3. BOTTOM NAV — active state + navigasi
============================================================ */
(function initBottomNav() {
  var items = document.querySelectorAll('.bottom-item');
  items.forEach(function (btn) {
    btn.addEventListener('click', function () {
      items.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  // Tombol Home → kembali ke home
  var homeBtn = document.querySelector('.bottom-item[aria-label="Home"]');
  if (homeBtn) {
    homeBtn.addEventListener('click', function () {
      history.back();
    });
  }

    // Tombol Profile → popup profile
  var profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', function () {
      ProfilePopup.openSelf();
    });
  }
})();


/* ============================================================
   5. KLIK CARD KONTEN → popup play content
============================================================ */
(function initCardClick() {
  var mainScroll = document.getElementById('mainScroll');
  if (!mainScroll) return;

  mainScroll.addEventListener('click', function (e) {
    var card = e.target.closest('.card-item');
    if (!card) return;

    /* Ambil data dari card (gunakan placeholder, nanti diganti data asli) */
    var nameEl = card.querySelector('.card-name');
    var title  = nameEl ? nameEl.textContent : 'Name';

    ContentPopup.open({
      title:       title,
      subtitle:    'Teks',
      thumb:       '../img/banner.png',
      description: 'Teks',
      like:        '90%',
      info: [
        { key: 'Teks', val: 'Teks' },
        { key: 'Teks', val: 'Teks' },
        { key: 'Teks', val: 'Teks' },
        { key: 'Teks', val: 'Teks' },
        { key: 'Teks', val: 'Teks' }
      ]
    });
  });
})();

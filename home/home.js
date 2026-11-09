/**
 * home/home.js — Ze Campus Home Page Logic
 *
 * 1. Navbar hide-on-scroll (atas hide ke atas, bawah hide ke bawah)
 * 2. Navbar atas: transparan → biru saat scroll
 * 3. Recommended For You: infinite scroll per 8 item (IntersectionObserver)
 * 4. setTopInset(px): dipanggil dari native Kotlin untuk menyesuaikan notch
 */

'use strict';

/* ============================================================
   1. NAVBAR HIDE ON SCROLL
============================================================ */
(function initNavbarHide() {
  var navTop    = document.getElementById('navbarTop');
  var navBottom = document.getElementById('navbarBottom');
  var scroll    = document.getElementById('mainScroll');

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
   2. RECOMMENDED FOR YOU — Infinite Scroll per 8 item
============================================================ */
(function initRecommend() {
  var grid     = document.getElementById('recommendGrid');
  var sentinel = document.getElementById('recommendSentinel');
  var loading  = false;

  function loadBatch() {
    if (loading) return;
    loading = true;

    setTimeout(function () {
      var fragment = document.createDocumentFragment();
      for (var i = 0; i < 8; i++) {
        var item = document.createElement('div');
        item.className = 'card-item';
        item.innerHTML =
          '<div class="card-thumb">' +
            '<img src="../img/banner.png" alt="Recommend" />' +
          '</div>' +
          '<p class="card-name">Name</p>' +
          '<p class="card-stats">' +
            '<span class="stat-like">&#128077; 90%</span>' +
            '<span class="stat-play">&#9654; 1.2k</span>' +
          '</p>';
        fragment.appendChild(item);
      }
      grid.appendChild(fragment);
      loading = false;
    }, 200);
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) loadBatch();
      });
    }, {
      root: document.getElementById('mainScroll'),
      rootMargin: '0px',
      threshold: 0.1
    });
    observer.observe(sentinel);
  } else {
    loadBatch();
  }
})();


/* ============================================================
   3. NOTCH / KAMERA DEPAN
   Dipanggil dari Kotlin (MainActivity.kt) setelah halaman siap.
   Native mengirim PHYSICAL pixel → dikonversi ke CSS pixel.
============================================================ */
function setTopInset(px) {
  var ratio = window.devicePixelRatio || 1;
  var cssPx = Math.round(px / ratio);

  document.documentElement.style.setProperty('--safe-top', cssPx + 'px');

  // Update padding-top main-scroll secara eksplisit sebagai fallback
  var ms = document.getElementById('mainScroll');
  if (ms) ms.style.paddingTop = (56 + cssPx) + 'px';
}


/* ============================================================
   4. BOTTOM NAV: active state + navigasi halaman
============================================================ */
(function initBottomNav() {
  var items = document.querySelectorAll('.bottom-item');

  items.forEach(function (btn) {
    btn.addEventListener('click', function () {
      items.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  // Tombol Profile → popup profile diri sendiri
  var profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', function () {
      ProfilePopup.openSelf();
    });
  }

  // Tombol Carts → navigasi ke halaman Carts
  var cartsBtn = document.getElementById('cartsBtn');
  if (cartsBtn) {
    cartsBtn.addEventListener('click', function () {
      window.location.href = '../carts/carts.html';
    });
  }
})();


/* ============================================================
   5. KLIK AVATAR TEMAN → popup profile teman
============================================================ */
(function initFriendAvatars() {
  var friendsScroll = document.getElementById('friendsScroll');
  if (!friendsScroll) return;

  friendsScroll.addEventListener('click', function (e) {
    var item = e.target.closest('.friend-item');
    // Abaikan tombol "Add Friend" (item pertama / item--add)
    if (!item) return;
    var addBtn = item.querySelector('.friend-avatar--add');
    if (addBtn) return; // ini tombol Add Friend, skip

    ProfilePopup.openFriend();
  });
})();


/* ============================================================
   6. KLIK CARD KONTEN → popup play content
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

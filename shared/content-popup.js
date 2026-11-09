/**
 * shared/content-popup.js
 * Bottom Sheet Popup — Play Content
 *
 * API publik:
 *   ContentPopup.open(data)  → buka popup
 *   ContentPopup.close()     → tutup popup
 *
 * Fitur:
 *   - Bottom sheet gesture (peek ↔ full)
 *   - Carousel thumbnail swipeable
 *   - Play navbar terpisah dari layer sheet
 */

'use strict';

var ContentPopup = (function () {

  var isOpen = false;
  var isFull = false;

  var overlay, sheet, navbar;

  /* Sheet touch (untuk collapse/expand) */
  var sheetTouch = { startY: 0, startScrollTop: 0, tracking: false };
  var THRESHOLD = 55;

  /* Carousel state */
  var carousel = {
    track:     null,
    dots:      [],
    slides:    3,
    current:   0,
    startX:    0,
    currentX:  0,
    dragging:  false,
    width:     0
  };

  /* ─────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────── */
  function init() {
    overlay = document.getElementById('contentOverlay');
    sheet   = document.getElementById('contentSheet');
    navbar  = document.getElementById('contentNavbar');
    if (!overlay || !sheet || !navbar) return;

    /* Overlay → tutup (click + touchend agar responsif di mobile) */
    overlay.addEventListener('click',    close);
    overlay.addEventListener('touchend', function (e) {
      e.preventDefault();
      close();
    });

    /* Cegah klik sheet & navbar menutup popup */
    sheet.addEventListener('click',  function (e) { e.stopPropagation(); });
    navbar.addEventListener('click', function (e) { e.stopPropagation(); });

    /* Sheet gesture (expand / collapse) — semua area sheet termasuk carousel */
    sheet.addEventListener('touchstart', onSheetTouchStart, { passive: true });
    sheet.addEventListener('touchmove',  onSheetTouchMove,  { passive: false });
    sheet.addEventListener('touchend',   onSheetTouchEnd,   { passive: true });

    /* Tombol Play -> Buka PDF Popup */
    var playBtn = navbar.querySelector('.content-footer__play');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (typeof PdfPopup !== 'undefined') {
          PdfPopup.open();
        }
      });
    }

    /* Tombol back Android → tutup popup via History API */
    window.addEventListener('popstate', function () {
      /* Biarkan PdfPopup menutup dirinya sendiri jika sedang terbuka */
      if (typeof PdfPopup !== 'undefined' && PdfPopup.isOpen()) {
        return;
      }
      if (isOpen) close();
    });
  }

  /* ─────────────────────────────────────────────
     SHEET GESTURES — direction-aware
     - Swipe horizontal di carousel → biarkan carousel handle
     - Swipe vertikal di mana saja  → collapse / expand sheet
  ───────────────────────────────────────────── */
  function onSheetTouchStart(e) {
    sheetTouch.startY         = e.touches[0].clientY;
    sheetTouch.startX         = e.touches[0].clientX;
    sheetTouch.startScrollTop = sheet.scrollTop;
    sheetTouch.tracking       = true;
    sheetTouch.direction      = null; /* belum tahu arah */
  }

  function onSheetTouchMove(e) {
    if (!sheetTouch.tracking) return;
    var deltaY = e.touches[0].clientY - sheetTouch.startY;
    var deltaX = e.touches[0].clientX - sheetTouch.startX;

    /* Tentukan arah gesture pada gerakan pertama yang signifikan */
    if (!sheetTouch.direction && (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6)) {
      sheetTouch.direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }

    /* Horizontal → serahkan ke carousel, jangan intercept */
    if (sheetTouch.direction === 'horizontal') return;

    /* Vertikal → handle sheet gesture, cegah scroll/gesture lain */
    if (!isFull) {
      e.preventDefault();
    } else {
      if (deltaY > 0 && sheet.scrollTop <= 0) e.preventDefault();
    }
  }

  function onSheetTouchEnd(e) {
    if (!sheetTouch.tracking) return;
    sheetTouch.tracking = false;

    /* Abaikan jika ini gesture horizontal (sudah dihandle carousel) */
    if (sheetTouch.direction === 'horizontal') return;

    var deltaY = e.changedTouches[0].clientY - sheetTouch.startY;
    if (!isFull) {
      if (deltaY < -THRESHOLD)     _setFull();
      else if (deltaY > THRESHOLD) close();
    } else {
      if (deltaY > THRESHOLD && sheetTouch.startScrollTop <= 0) _setPeek();
    }
  }

  /* ─────────────────────────────────────────────
     CAROUSEL GESTURES (swipe horizontal)
  ───────────────────────────────────────────── */
  function _initCarousel(container) {
    carousel.track   = container.querySelector('.content-carousel__track');
    carousel.dots    = Array.prototype.slice.call(container.querySelectorAll('.content-sheet__dot'));
    carousel.current = 0;
    carousel.dragging = false;

    if (!carousel.track) return;

    /* Ambil lebar saat ini */
    carousel.width = carousel.track.parentElement.offsetWidth || window.innerWidth;

    /* Reset posisi */
    _setCarouselPos(0, false);

    var trackEl = carousel.track;

    trackEl.addEventListener('touchstart', function (e) {
      carousel.startX   = e.touches[0].clientX;
      carousel.currentX = e.touches[0].clientX;
      carousel.dragging = true;
      /* Nonaktifkan transisi selama drag */
      trackEl.style.transition = 'none';
    }, { passive: true });

    trackEl.addEventListener('touchmove', function (e) {
      if (!carousel.dragging) return;
      carousel.currentX  = e.touches[0].clientX;
      var dragDelta      = carousel.currentX - carousel.startX;
      var baseOffset     = -carousel.current * carousel.width;
      trackEl.style.transform = 'translateX(' + (baseOffset + dragDelta) + 'px)';
      /* Cegah sheet collapse saat geser horizontal */
      e.stopPropagation();
    }, { passive: true });

    trackEl.addEventListener('touchend', function (e) {
      if (!carousel.dragging) return;
      carousel.dragging = false;
      trackEl.style.transition = '';

      var deltaX = e.changedTouches[0].clientX - carousel.startX;
      if (deltaX < -50 && carousel.current < carousel.slides - 1) {
        carousel.current++;
      } else if (deltaX > 50 && carousel.current > 0) {
        carousel.current--;
      }
      _setCarouselPos(carousel.current, true);
    }, { passive: true });
  }

  function _setCarouselPos(index, animate) {
    if (!carousel.track) return;
    if (animate) {
      carousel.track.style.transition = 'transform 0.3s cubic-bezier(.4,0,.2,1)';
    }
    carousel.track.style.transform = 'translateX(' + (-index * 100) + '%)';
    /* Update dots */
    carousel.dots.forEach(function (dot, i) {
      dot.classList.toggle('content-sheet__dot--active',   i === index);
      dot.classList.toggle('content-sheet__dot--inactive', i !== index);
    });
  }

  /* ─────────────────────────────────────────────
     STATE
  ───────────────────────────────────────────── */
  function _setFull() {
    isFull = true;
    sheet.classList.add('full');
    sheet.classList.remove('open');
  }

  function _setPeek() {
    isFull = false;
    sheet.classList.remove('full');
    sheet.classList.add('open');
    sheet.scrollTop = 0;
  }

  /* ─────────────────────────────────────────────
     BUKA
  ───────────────────────────────────────────── */
  function open(data) {
    data = data || {};
    isOpen = true;
    isFull = false;

    _render(data);

    /* Push state agar tombol back Android intercept ke close() */
    history.pushState({ contentPopup: true }, '');

    document.body.classList.add('content-popup-open');
    overlay.classList.add('visible');
    navbar.classList.add('visible');
    sheet.classList.add('open');
    sheet.classList.remove('full');
    sheet.scrollTop = 0;
  }

  /* ─────────────────────────────────────────────
     TUTUP
  ───────────────────────────────────────────── */
  function close() {
    isOpen = false;
    isFull = false;
    document.body.classList.remove('content-popup-open');
    overlay.classList.remove('visible');
    navbar.classList.remove('visible');
    sheet.classList.remove('open', 'full');
  }

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  function _render(data) {
    var title    = data.title       || 'Teks';
    var subtitle = data.subtitle    || 'Teks';
    var thumb    = data.thumb       || '';
    var desc     = data.description || 'Teks';
    var info     = data.info || [
      { key: 'Teks', val: 'Teks' },
      { key: 'Teks', val: 'Teks' },
      { key: 'Teks', val: 'Teks' },
      { key: 'Teks', val: 'Teks' },
      { key: 'Teks', val: 'Teks' }
    ];
    var likePercent = data.like || '1%';

    /* ── 3 slide carousel (gunakan thumbnail yang sama sebagai placeholder) ── */
    var slideHtml = [thumb, thumb, thumb].map(function (src) {
      return (
        '<div class="content-carousel__slide">' +
          (src ? '<img src="' + src + '" alt="Slide" />' : '') +
        '</div>'
      );
    }).join('');

    /* ── Info rows ── */
    var infoRowsHtml = info.map(function (row) {
      return (
        '<div class="content-sheet__info-row">' +
          '<span class="content-sheet__info-key">' + row.key + '</span>' +
          '<span class="content-sheet__info-val">'  + row.val + '</span>' +
        '</div>'
      );
    }).join('');

    /* ── Render body ── */
    var body = sheet.querySelector('.content-sheet__body');
    if (body) {
      body.innerHTML =
        '<p class="content-sheet__title">'    + title    + '</p>' +
        '<p class="content-sheet__subtitle">' + subtitle + '</p>' +

        /* Thumbnail + carousel */
        '<div class="content-sheet__thumb">' +
          '<div class="content-carousel">' +
            '<div class="content-carousel__track">' +
              slideHtml +
            '</div>' +
          '</div>' +
          '<div class="content-sheet__dots">' +
            '<div class="content-sheet__dot content-sheet__dot--active"></div>' +
            '<div class="content-sheet__dot content-sheet__dot--inactive"></div>' +
            '<div class="content-sheet__dot content-sheet__dot--inactive"></div>' +
          '</div>' +
        '</div>' +

        '<p class="content-sheet__desc-title">Description</p>' +
        '<p class="content-sheet__desc-text">' + desc + '</p>' +

        '<div class="content-sheet__info">' +
          '<p class="content-sheet__info-title">Information</p>' +
          infoRowsHtml +
        '</div>';

      /* Init carousel setelah elemen di DOM */
      _initCarousel(body);
    }

    /* Update like % di navbar */
    var likeEl = navbar.querySelector('.content-footer__like-pct');
    if (likeEl) likeEl.textContent = likePercent;
  }

  /* ─────────────────────────────────────────────
     AUTO-INIT
  ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { open: open, close: close };

})();

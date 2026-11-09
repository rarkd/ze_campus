/**
 * shared/pdf-popup.js
 * Full-screen Popup — Play Content PDF
 */

'use strict';

var PdfPopup = (function () {
  var _isOpen = false;
  var popupEl;

  function init() {
    popupEl = document.getElementById('pdfPopup');
    if (!popupEl) return;

    var closeBtn = popupEl.querySelector('.pdf-popup__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }

    // Tombol Back Android mencegat state ini
    window.addEventListener('popstate', function () {
      if (_isOpen) {
        close();
      }
    });
  }

  function open(data) {
    data = data || {};
    _isOpen = true;

    var title = data.title || 'Teks';
    var subtitle = data.subtitle || 'Teks';
    var pagesCount = data.pages || 5;

    var titleEl = popupEl.querySelector('.pdf-popup__title');
    if (titleEl) titleEl.textContent = title;

    var subEl = popupEl.querySelector('.pdf-popup__subtitle');
    if (subEl) subEl.textContent = subtitle;

    // Render placeholder halaman PDF
    var bodyEl = popupEl.querySelector('.pdf-popup__body');
    if (bodyEl) {
      var html = '';
      for (var i = 0; i < pagesCount; i++) {
        html += '<div class="pdf-popup__page"></div>';
      }
      bodyEl.innerHTML = html;
      bodyEl.scrollTop = 0;
    }

    /* Push state untuk tombol Back Android */
    history.pushState({ pdfPopup: true }, '');

    document.body.classList.add('pdf-popup-open');
    popupEl.classList.add('open');
  }

  function close() {
    _isOpen = false;
    if (popupEl) {
      popupEl.classList.remove('open');
    }
    document.body.classList.remove('pdf-popup-open');
  }

  function isOpen() {
    return _isOpen;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { open: open, close: close, isOpen: isOpen };
})();

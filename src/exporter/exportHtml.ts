import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GOOGLE_FONTS_URL } from '../data/themes';
import { LandingPage } from '../renderer/LandingPage';
import landingCssRaw from '../renderer/landing.css?raw';
import type { LandingPageSpec } from '../types/spec';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildStandaloneScript(clientSlug?: string): string {
  const safeSlug = JSON.stringify(clientSlug || 'default');
  return `
(function () {
  var CLIENT_SLUG = ${safeSlug};
  var menuBtn = document.querySelector('[data-lp-menu-toggle="true"]');
  var mobileMenu = document.querySelector('[data-lp-mobile-menu="true"]');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  document.querySelectorAll('[data-lp-faq-trigger="true"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('[data-lp-faq-item="true"]');
      if (!item) return;
      var willOpen = !item.classList.contains('is-open');
      document.querySelectorAll('[data-lp-faq-item="true"]').forEach(function (other) {
        other.classList.remove('is-open');
      });
      if (willOpen) {
        item.classList.add('is-open');
      }
    });
  });

  function tryPostOrder(payload) {
    if (!window.fetch) return;
    try {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  }

  document.querySelectorAll('[data-lp-contact-form="true"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      tryPostOrder({
        kind: 'lead',
        clientSlug: CLIENT_SLUG,
        name: String(fd.get('name') || ''),
        phone: String(fd.get('phone') || ''),
        email: String(fd.get('email') || ''),
        message: String(fd.get('message') || '')
      });
      var successBox = form.querySelector('[data-lp-contact-success="true"]');
      if (successBox) {
        successBox.removeAttribute('hidden');
      }
      form.reset();
    });
  });

  var modal = document.getElementById('lp-export-order-modal');
  var modalBody = document.getElementById('lp-export-order-body');
  var modalTitle = document.getElementById('lp-export-order-title');

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parsePrice(str) {
    var digits = String(str || '').replace(/[^\\d]/g, '');
    var n = parseInt(digits, 10);
    return isNaN(n) ? 0 : n;
  }

  function formatTotal(unitStr, qty, currency) {
    var unit = parsePrice(unitStr);
    if (!unit) return unitStr || 'Liên hệ';
    var total = unit * Math.max(1, qty);
    var formatted = new Intl.NumberFormat('vi-VN').format(total);
    return (currency === '$' || currency === 'USD') ? (currency + formatted) : (formatted + (currency || 'đ'));
  }

  function closeOrderModal() {
    if (modal) modal.setAttribute('hidden', '');
  }

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal || (e.target && e.target.closest && e.target.closest('[data-lp-modal-close="true"]'))) {
        closeOrderModal();
      }
    });
  }

  document.querySelectorAll('[data-lp-order-btn="true"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!modal || !modalBody || !modalTitle) return;
      var productId = btn.getAttribute('data-lp-order-id') || '';
      var name = btn.getAttribute('data-lp-order-name') || 'Sản phẩm';
      var price = btn.getAttribute('data-lp-order-price') || '';
      var image = btn.getAttribute('data-lp-order-image') || '';
      var currency = btn.getAttribute('data-lp-order-currency') || 'đ';
      var channelHref = btn.getAttribute('data-lp-order-href') || '';
      var qty = 1;

      modalTitle.textContent = 'Đặt mua sản phẩm';
      modalBody.innerHTML =
        '<form id="lp-export-order-form">' +
          '<div class="lp-order-summary">' +
            (image ? '<img class="lp-order-thumb" src="' + esc(image) + '" alt="' + esc(name) + '"/>' : '') +
            '<div style="flex:1">' +
              '<div style="font-weight:700;margin-bottom:2px">' + esc(name) + '</div>' +
              '<div style="color:var(--lp-primary);font-weight:700">' + esc(price) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="lp-qty-row">' +
            '<div>' +
              '<div style="font-weight:600;font-size:0.92rem">Số lượng</div>' +
              '<div style="font-size:0.84rem;color:var(--lp-muted)">Tạm tính: <strong id="lp-export-total" style="color:var(--lp-primary)">' + esc(formatTotal(price, qty, currency)) + '</strong></div>' +
            '</div>' +
            '<div class="lp-qty-controls">' +
              '<button type="button" id="lp-qty-dec" class="lp-qty-btn">−</button>' +
              '<span id="lp-qty-val" style="min-width:24px;text-align:center;font-weight:700">1</span>' +
              '<button type="button" id="lp-qty-inc" class="lp-qty-btn">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="lp-form-grid">' +
            '<div><label class="lp-field-label">Họ và tên *</label><input id="lp-ord-name" class="lp-input" required placeholder="Nguyễn Minh Anh"/></div>' +
            '<div class="lp-grid-2" style="gap:12px">' +
              '<div><label class="lp-field-label">Số điện thoại / Zalo *</label><input id="lp-ord-phone" class="lp-input" required placeholder="0909 xxx xxx"/></div>' +
              '<div><label class="lp-field-label">Email nhận sản phẩm</label><input id="lp-ord-email" type="email" class="lp-input" placeholder="email@domain.com"/></div>' +
            '</div>' +
            '<div><label class="lp-field-label">Ghi chú đơn hàng</label><textarea id="lp-ord-note" rows="2" class="lp-textarea" placeholder="Địa chỉ hoặc yêu cầu riêng..."></textarea></div>' +
            '<button type="submit" id="lp-ord-submit" class="lp-btn lp-btn-primary lp-btn-full">Xác nhận đặt mua (' + esc(formatTotal(price, qty, currency)) + ')</button>' +
          '</div>' +
        '</form>';

      modal.removeAttribute('hidden');

      var qtyVal = document.getElementById('lp-qty-val');
      var totalEl = document.getElementById('lp-export-total');
      var submitBtn = document.getElementById('lp-ord-submit');

      function updateQty(next) {
        qty = Math.max(1, Math.min(99, next));
        var formatted = formatTotal(price, qty, currency);
        if (qtyVal) qtyVal.textContent = String(qty);
        if (totalEl) totalEl.textContent = formatted;
        if (submitBtn) submitBtn.textContent = 'Xác nhận đặt mua (' + formatted + ')';
      }

      var decBtn = document.getElementById('lp-qty-dec');
      var incBtn = document.getElementById('lp-qty-inc');
      if (decBtn) decBtn.addEventListener('click', function () { updateQty(qty - 1); });
      if (incBtn) incBtn.addEventListener('click', function () { updateQty(qty + 1); });

      var orderForm = document.getElementById('lp-export-order-form');
      if (orderForm) {
        orderForm.addEventListener('submit', function (e) {
          e.preventDefault();
          var custName = (document.getElementById('lp-ord-name') || {}).value || '';
          var custPhone = (document.getElementById('lp-ord-phone') || {}).value || '';
          var custEmail = (document.getElementById('lp-ord-email') || {}).value || '';
          var custNote = (document.getElementById('lp-ord-note') || {}).value || '';
          var formatted = formatTotal(price, qty, currency);

          tryPostOrder({
            kind: 'order',
            clientSlug: CLIENT_SLUG,
            productId: productId,
            productName: name,
            unitPrice: price,
            quantity: qty,
            totalDisplay: formatted,
            customerName: custName,
            phone: custPhone,
            email: custEmail,
            note: custNote
          });

          modalTitle.textContent = 'Đặt hàng thành công!';
          modalBody.innerHTML =
            '<div class="lp-form-success" style="margin-bottom:16px">' +
              '<div style="font-weight:700;margin-bottom:6px">Cảm ơn ' + esc(custName) + '! Đơn hàng của bạn đã được ghi nhận.</div>' +
              '<div style="font-size:0.9rem">Sản phẩm: <strong>' + esc(name) + '</strong> (x' + qty + ')<br/>Tổng tạm tính: <strong>' + esc(formatted) + '</strong><br/>Liên hệ: <strong>' + esc(custPhone) + '</strong></div>' +
            '</div>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
              (channelHref && channelHref !== '#' ? '<a class="lp-btn lp-btn-primary" href="' + esc(channelHref) + '" target="_blank" rel="noopener noreferrer">Nhắn xác nhận ngay</a>' : '') +
              '<button type="button" class="lp-btn lp-btn-secondary" data-lp-modal-close="true">Quay lại trang web</button>' +
            '</div>';
        });
      }
    });
  });
})();
`;
}

export function buildStandaloneHtml(spec: LandingPageSpec, clientSlug?: string): string {
  const renderedBody = renderToStaticMarkup(
    createElement(LandingPage, { spec, isExport: true, clientSlug })
  );
  const safeTitle = escapeHtml(spec.meta.title || 'Landing Page');
  const safeDescription = escapeHtml(spec.meta.description || '');
  const faviconEmoji = escapeHtml(spec.meta.favicon || '✨');
  const safeCustomCss = (spec.meta.customCss || '').replace(/<\/style>/gi, '');
  const safeScript = buildStandaloneScript(clientSlug).replace(/<\/script>/gi, '<\\/script>');

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <link
      rel="icon"
      href="data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${faviconEmoji}</text></svg>`
      )}"
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="${GOOGLE_FONTS_URL}" rel="stylesheet" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        scroll-behavior: smooth;
      }
      ${landingCssRaw}
      ${safeCustomCss}
    </style>
  </head>
  <body>
    ${renderedBody}
    <script>${safeScript}</script>
  </body>
</html>`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function publishSiteToServer(
  spec: LandingPageSpec,
  html: string,
  slug?: string
): Promise<{ ok: boolean; siteUrl?: string; clientUrl?: string; error?: string }> {
  try {
    const response = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spec, html, slug }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      siteUrl?: string;
      clientUrl?: string;
      error?: string;
    };
    if (!response.ok || !data.ok) {
      return { ok: false, error: data.error || 'Không thể xuất bản lên server.' };
    }
    return {
      ok: true,
      siteUrl: data.siteUrl || '/site.html',
      clientUrl: data.clientUrl,
    };
  } catch {
    return {
      ok: false,
      error: 'Chế độ tĩnh không hỗ trợ API xuất bản, bạn có thể tải file index.html.',
    };
  }
}

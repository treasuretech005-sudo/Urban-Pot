/* =============================================
   URBAN POT — script.js  v3
   ============================================= */

const SUPABASE_URL = 'https://dmobxrgjmutnyhhttqia.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aoHCiJ3DVxi1_5nxBvO0rQ_kfLn3O-y';

/* ─── NIGERIA TIME (UTC+1 fixed) ────────────── */
function getLagosTime() {
  return new Date(Date.now() + new Date().getTimezoneOffset() * 60000 + 3600000);
}
function isKitchenOpen() {
  const t = getLagosTime(), m = t.getHours() * 60 + t.getMinutes();
  return m >= 540 && m < 960; // 09:00–16:00
}
function getCurrentDay() {
  return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][getLagosTime().getDay()];
}
function initKitchenStatus() {
  document.querySelectorAll('#kitchenStatus').forEach(el => {
    const dot = el.querySelector('.status-dot'), text = el.querySelector('.status-text');
    if (!dot || !text) return;
    if (isKitchenOpen()) { dot.classList.add('open');   text.textContent = 'Kitchen is Open'; }
    else                 { dot.classList.add('closed'); text.textContent = 'Kitchen is Closed'; }
  });
}

/* ─── DYNAMIC DELIVERY FEE ──────────────────── */
function calcDeliveryFee(subtotal) {
  if (subtotal > 200000) return 30000;
  if (subtotal > 150000) return 15000;
  if (subtotal > 100000) return 10000;
  if (subtotal >  50000) return  7000;
  if (subtotal >  25000) return  5000;
  return 3500;
}
function fmtN(n) { return '\u20A6' + Number(n).toLocaleString('en-NG'); }

/* ─── DEDUPLICATE by name ────────────────────── */
function dedupeByName(arr) {
  const seen = new Set(), out = [];
  arr.forEach(f => { if (!seen.has(f.name)) { seen.add(f.name); out.push(f); } });
  return out;
}

/* ─── NAVBAR ─────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');

  if (navbar) window.addEventListener('scroll', () =>
    navbar.classList.toggle('scrolled', window.scrollY > 40), { passive:true });

  if (!toggle || !links) return;

  let navOverlay = document.getElementById('navOverlay');
  if (!navOverlay) {
    navOverlay = document.createElement('div');
    navOverlay.id = 'navOverlay';
    navOverlay.style.cssText = 'position:fixed;inset:0;z-index:97;background:rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity .3s ease';
    document.body.appendChild(navOverlay);
  }

  function openNav() {
    links.classList.add('open');
    navOverlay.style.opacity = '1'; navOverlay.style.pointerEvents = 'all';
    toggle.setAttribute('aria-expanded','true');
    const [s0,s1,s2] = toggle.querySelectorAll('span');
    if(s0) s0.style.transform = 'rotate(45deg) translate(5px,5px)';
    if(s1) s1.style.opacity   = '0';
    if(s2) s2.style.transform = 'rotate(-45deg) translate(5px,-5px)';
  }
  function closeNav() {
    links.classList.remove('open');
    navOverlay.style.opacity = '0'; navOverlay.style.pointerEvents = 'none';
    toggle.setAttribute('aria-expanded','false');
    const [s0,s1,s2] = toggle.querySelectorAll('span');
    if(s0) s0.style.transform=''; if(s1) s1.style.opacity=''; if(s2) s2.style.transform='';
  }

  toggle.addEventListener('click', () => links.classList.contains('open') ? closeNav() : openNav());
  navOverlay.addEventListener('click', closeNav);
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
}

/* ─── CART ───────────────────────────────────── */
let cart = [];

function loadCart() {
  try { cart = JSON.parse(localStorage.getItem('urbanpot_cart') || '[]'); } catch { cart = []; }
  renderCart(); updateCartCount();
}
function saveCart() { localStorage.setItem('urbanpot_cart', JSON.stringify(cart)); }

function updateCartCount() {
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = cart.length;
    el.classList.toggle('visible', cart.length > 0);
  });
}

function addToCartDirect(item) {
  cart.push(item); saveCart(); renderCart(); updateCartCount();
  showToast(`${item.name} added to cart`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart(); renderCart(); updateCartCount();
}

function buildCartItemHTML(item) {
  const proteinTags = Array.isArray(item.proteins) && item.proteins.length
    ? item.proteins.map(p => `<span class="ci-meta-tag">${p.type} ×${p.qty}</span>`).join('') : '';
  const otherTags = [
    item.size   ? `<span class="ci-meta-tag">${item.size}</span>`          : null,
    item.liters ? `<span class="ci-meta-tag">${item.liters}L</span>`       : null,
    item.swallow ? `<span class="ci-meta-tag">${item.swallow}</span>`      : null,
    item.plates > 1 ? `<span class="ci-meta-tag">×${item.plates} plates</span>` : null,
  ].filter(Boolean).join('');

  const pd = typeof item.price === 'number' ? fmtN(item.price) : '<em style="opacity:.5">Unavailable</em>';
  return `
    <div class="cart-item">
      <div class="cart-item-img-wrap">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" class="cart-item-img" loading="lazy"/>` : '<div class="cart-item-img-placeholder"></div>'}
      </div>
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        ${otherTags   ? `<div class="cart-item-meta">${otherTags}</div>`   : ''}
        ${proteinTags ? `<div class="cart-item-meta">${proteinTags}</div>` : ''}
        <div class="cart-item-price">${pd}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">&times;</button>
    </div>`;
}

function renderCart() {
  const itemsEl    = document.getElementById('cartItems');
  const emptyEl    = document.getElementById('cartEmpty');
  const footerEl   = document.getElementById('cartFooter');
  const subtotalEl = document.getElementById('cartSubtotal');
  const deliveryEl = document.getElementById('cartDelivery');
  const totalEl    = document.getElementById('cartTotal');

  if (!itemsEl) return;
  if (!cart.length) {
    itemsEl.innerHTML = '';
    if (emptyEl)  emptyEl.style.display  = 'flex';
    if (footerEl) footerEl.style.display = 'none';
    return;
  }
  if (emptyEl)  emptyEl.style.display  = 'none';
  if (footerEl) footerEl.style.display = 'block';

  const sub = cart.reduce((s,i) => s + (typeof i.price==='number' ? i.price : 0), 0);
  const del = calcDeliveryFee(sub);
  if (subtotalEl) subtotalEl.textContent = fmtN(sub);
  if (deliveryEl) deliveryEl.textContent = fmtN(del);
  if (totalEl)    totalEl.textContent    = fmtN(sub + del);
  itemsEl.innerHTML = cart.map(buildCartItemHTML).join('');
}

function openCart()  {
  document.getElementById('cartPanel')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartPanel')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('active');
  document.body.style.overflow = '';
}
function initCart() {
  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('checkoutBtn')?.addEventListener('click', () => { closeCart(); openCheckout(); });
}

/* ─── CHECKOUT ───────────────────────────────── */
function openCheckout() {
  const ov = document.getElementById('checkoutOverlay');
  if (!ov) return;
  ov.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  renderCheckoutSummary();
}
function closeCheckout() {
  const ov = document.getElementById('checkoutOverlay');
  if (ov) ov.style.display = 'none';
  document.body.style.overflow = '';
}
function renderCheckoutSummary() {
  const listEl     = document.getElementById('orderSummaryList');
  const subtotalEl = document.getElementById('co-subtotal');
  const deliveryEl = document.getElementById('co-delivery');
  const totalEl    = document.getElementById('co-total');
  if (!listEl) return;

  const sub = cart.reduce((s,i) => s+(typeof i.price==='number'?i.price:0), 0);
  const del = calcDeliveryFee(sub);
  if (subtotalEl) subtotalEl.textContent = fmtN(sub);
  if (deliveryEl) deliveryEl.textContent = fmtN(del);
  if (totalEl)    totalEl.textContent    = fmtN(sub + del);

  listEl.innerHTML = cart.map(item => {
    const proStr = Array.isArray(item.proteins) && item.proteins.length
      ? item.proteins.map(p=>`${p.type} ×${p.qty}`).join(', ') : '';
    const meta = [item.size||null, item.liters?`${item.liters}L`:null,
      item.swallow||null, proStr||null].filter(Boolean).join(' · ');
    const pd = typeof item.price==='number' ? fmtN(item.price) : 'Unavailable';
    return `<div class="summary-row"><span>${item.name}${meta?' · '+meta:''}</span><span>${pd}</span></div>`;
  }).join('');
}
function initCheckout() {
  document.getElementById('checkoutClose')?.addEventListener('click', closeCheckout);
  document.getElementById('payNowBtn')?.addEventListener('click', handlePaystack);
  document.getElementById('checkoutOverlay')?.addEventListener('click', e => {
    if (e.target===document.getElementById('checkoutOverlay')) closeCheckout();
  });
}
function handlePaystack() {
  const name    = document.getElementById('custName')?.value?.trim();
  const email   = document.getElementById('custEmail')?.value?.trim();
  const phone   = document.getElementById('custPhone')?.value?.trim();
  const address = document.getElementById('custAddress')?.value?.trim();
  if (!name||!email||!phone||!address) { showToast('Please fill in all fields','error'); return; }

  const sub = cart.reduce((s,i)=>s+(typeof i.price==='number'?i.price:0),0);
  const del = calcDeliveryFee(sub);
  const ref = `URBANPOT-${Date.now()}`;

  const h = window.PaystackPop?.setup?.({
    key:'pk_live_xxxxxxxxxxxxxxxx', email,
    amount:(sub+del)*100, currency:'NGN', ref,
    metadata:{name,phone,address},
    callback: r => showPaymentSuccess(r.reference),
    onClose: () => showToast('Payment cancelled','error'),
  });
  h ? h.openIframe() : showPaymentSuccess(ref);
}
function showPaymentSuccess(reference) {
  document.getElementById('checkoutStep1').style.display  = 'none';
  document.getElementById('checkoutSuccess').style.display = 'flex';
  document.getElementById('payRef').textContent = `Reference: ${reference}`;
  const waBtn = document.getElementById('whatsappBtn');
  if (!waBtn) return;
  const nb = waBtn.cloneNode(true); waBtn.replaceWith(nb);
  nb.addEventListener('click', () => {
    const lines = cart.map(i => {
      const pro = Array.isArray(i.proteins)&&i.proteins.length
        ? i.proteins.map(p=>`${p.type} ×${p.qty}`).join(', ') : '';
      return `• ${i.name}${i.liters?' '+i.liters+'L':''}${pro?' ('+pro+')':''}`;
    });
    const sub = cart.reduce((s,i)=>s+(typeof i.price==='number'?i.price:0),0);
    const del = calcDeliveryFee(sub);
    const msg = encodeURIComponent(
      `Hello Urban Pot!\n\nPayment confirmed.\nRef: ${reference}\n\nOrder:\n${lines.join('\n')}\n\nDelivery: \u20A6${del.toLocaleString()}\nTotal: \u20A6${(sub+del).toLocaleString()}\n\nPlease confirm.`
    );
    window.open(`https://wa.me/2347048266116?text=${msg}`,'_blank');
    cart=[]; saveCart(); renderCart(); updateCartCount(); closeCheckout();
  });
}

/* ─── LAZY LOAD ──────────────────────────────── */
function initLazyLoad() {
  const imgs = document.querySelectorAll('img.lazy:not(.loaded)');
  if (!imgs.length) return;
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const img = e.target;
        img.src = img.dataset.src;
        img.onload = img.onerror = () => img.classList.add('loaded');
        obs.unobserve(img);
      });
    }, { rootMargin:'250px' });
    imgs.forEach(img => obs.observe(img));
  } else {
    imgs.forEach(img => { img.src = img.dataset.src; img.classList.add('loaded'); });
  }
}

/* ─── TOAST ──────────────────────────────────── */
function showToast(msg, type='success') {
  if (!document.getElementById('toastStyles')) {
    const s = document.createElement('style'); s.id='toastStyles';
    s.textContent = `
      @keyframes toastIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
      @keyframes toastOut { from{opacity:1} to{opacity:0;transform:translateY(14px)} }
      #toastContainer{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:9999;
        display:flex;flex-direction:column;gap:10px;align-items:center;pointer-events:none}
    `;
    document.head.appendChild(s);
  }
  let box = document.getElementById('toastContainer');
  if (!box) { box=document.createElement('div'); box.id='toastContainer'; document.body.appendChild(box); }
  const t = document.createElement('div');
  t.style.cssText = `background:${type==='error'?'rgba(255,82,82,.95)':'rgba(244,162,97,.95)'};
    color:${type==='error'?'#fff':'#4a0000'};padding:12px 26px;border-radius:100px;
    font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,.3);animation:toastIn .3s ease;white-space:nowrap`;
  t.textContent = msg; box.appendChild(t);
  setTimeout(() => { t.style.animation='toastOut .3s ease forwards'; setTimeout(()=>t.remove(),320); }, 2800);
}

/* ─── SCROLL ANIMATIONS ──────────────────────── */
function initScrollAnimations() {
  const s = document.createElement('style');
  s.textContent = `.anim-up{opacity:0;transform:translateY(28px);transition:opacity .55s ease,transform .55s ease}
    .anim-up.visible{opacity:1;transform:translateY(0)}`;
  document.head.appendChild(s);
  const targets = document.querySelectorAll('.day-card,.bs-card,.category-card,.menu-item,.about-text,.about-image-wrap,.dz-zone');
  targets.forEach(el => el.classList.add('anim-up'));
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach((e,i) => {
        if (e.isIntersecting) { setTimeout(()=>e.target.classList.add('visible'),i*55); obs.unobserve(e.target); }
      });
    },{ threshold:.08 });
    targets.forEach(el => obs.observe(el));
  } else { targets.forEach(el => el.classList.add('visible')); }
}

/* ─── INIT ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initKitchenStatus();
  loadCart();
  initCart();
  initCheckout();
  initLazyLoad();
  initScrollAnimations();
  initKeepAlive();
  if (!document.getElementById('paystackScript')) {
    const ps = document.createElement('script');
    ps.id='paystackScript'; ps.src='https://js.paystack.co/v1/inline.js';
    document.head.appendChild(ps);
  }
});

/* ─── SUPABASE KEEP-ALIVE ────────────────────────
   Silently pings Supabase every 4 minutes so the
   free project never gets paused due to inactivity.
   Fetches a single row with minimal data — no UI
   impact, no performance cost.
   ─────────────────────────────────────────────── */
function initKeepAlive() {
  const INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

  function ping() {
    fetch(
      SUPABASE_URL + '/rest/v1/foods?select=id&limit=1',
      {
        headers: {
          apikey:        SUPABASE_KEY,
          Authorization: 'Bearer ' + SUPABASE_KEY
        }
      }
    ).catch(() => {}); // silently ignore any errors
  }

  // First ping after 1 minute (let page load fully first)
  setTimeout(() => {
    ping();
    // Then ping every 4 minutes after that
    setInterval(ping, INTERVAL_MS);
  }, 60 * 1000);
}

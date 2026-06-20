/* ============================================================
   THE CAKE STUDIO — Shared JavaScript
   Mobile nav · scroll reveal · FAQ accordion ·
   Order modal · WhatsApp message builder
   ============================================================ */

// Plain "click to chat" preset link (used by floating button / contact CTAs)
const WA_LINK = 'https://wa.me/message/6TMTI4ZZF26OK1';
// Phone-number link — reliably supports a pre-filled ?text= order message
const WA_PHONE = 'https://wa.me/56926937751';

// Tortas need a minimum 72-hour (3-day) lead time.
const TORTA_LEAD_DAYS = 3;
// Fallback name match (used if a product has no data-category="tortas").
const TORTA_NAMES = [
  'chocoquesillo (sin gluten)', 'torta rose', 'cheesecake de frambuesa',
  'torta brownie cotillón', 'torta ilove', 'torta isaias',
  'torta maceta', 'torta nona'
];
function isTortaProduct(name) {
  if (!name) return false;
  const n = name.toLowerCase();
  return TORTA_NAMES.some(t => n.startsWith(t));
}
// ISO date (YYYY-MM-DD) for today + n days.
function isoPlusDays(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  initFaq();
  initModal();
  initInlineForm();
});

/* ---------- Mobile navigation ---------- */
function initNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    nav.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => { links.classList.remove('open'); nav.classList.remove('open'); })
  );
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(e => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}

/* ---------- FAQ accordion ---------- */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });
}

/* ============================================================
   ORDER MODAL
   ============================================================ */
function initModal() {
  const overlay = document.getElementById('orderModal');
  if (!overlay) return;

  const form = overlay.querySelector('#modalForm');
  const productField = overlay.querySelector('#m_product');
  const closeEls = overlay.querySelectorAll('[data-close]');

  // Open from any element with data-product
  document.querySelectorAll('[data-product]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const product = btn.getAttribute('data-product');
      productField.value = product;
      const isTorta = btn.dataset.category === 'tortas' || isTortaProduct(product);
      applyLeadTime(form, isTorta);
      openModal(overlay);
    });
  });

  closeEls.forEach(el => el.addEventListener('click', () => closeModal(overlay)));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(overlay); });

  wireDeliveryToggle(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = collectForm(form);
    if (!data) return;
    window.open(buildWaUrl(data), '_blank');
    closeModal(overlay);
  });
}

function openModal(overlay) {
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal(overlay) {
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

/* ---------- Inline form (como-pedir) ---------- */
function initInlineForm() {
  const form = document.getElementById('inlineForm');
  if (!form) return;
  wireDeliveryToggle(form);
  applyLeadTime(form, false);
  // Re-evaluate the 72h rule whenever the product changes.
  const select = form.querySelector('select[name="producto"]');
  if (select) select.addEventListener('change', () => {
    const opt = select.options[select.selectedIndex];
    const isTorta = (opt && opt.dataset.category === 'tortas') || isTortaProduct(select.value);
    applyLeadTime(form, isTorta);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = collectForm(form);
    if (!data) return;
    window.open(buildWaUrl(data), '_blank');
  });
}

/* ---------- Lead-time rule (tortas = min 72 h) ---------- */
function applyLeadTime(form, isTorta) {
  form.dataset.torta = isTorta ? '1' : '0';
  const dateEl = form.querySelector('input[type=date]');
  if (dateEl) {
    const min = isoPlusDays(isTorta ? TORTA_LEAD_DAYS : 0);
    dateEl.min = min;
    // Clear an already-chosen date that no longer meets the minimum.
    if (dateEl.value && dateEl.value < min) dateEl.value = '';
  }
  const note = form.querySelector('[data-lead-note]');
  if (note) note.classList.toggle('field-hidden', !isTorta);
}

/* ---------- Delivery / pickup radio behaviour ---------- */
function wireDeliveryToggle(form) {
  const radios = form.querySelectorAll('input[name="entrega"]');
  const comunaWrap = form.querySelector('.comuna-wrap');
  const comunaInput = comunaWrap ? comunaWrap.querySelector('input') : null;
  radios.forEach(r => r.addEventListener('change', () => {
    // visual selection
    form.querySelectorAll('.radio-chip').forEach(c => c.classList.remove('sel'));
    const chip = r.closest('.radio-chip');
    if (chip) chip.classList.add('sel');
    // delivery field
    if (comunaWrap) {
      const isDelivery = r.value === 'Delivery';
      comunaWrap.classList.toggle('field-hidden', !isDelivery);
      if (comunaInput) comunaInput.required = isDelivery;
    }
  }));
}

/* ---------- Collect & validate ---------- */
function collectForm(form) {
  const get = (n) => { const el = form.querySelector(`[name="${n}"]`); return el ? el.value.trim() : ''; };
  const producto = get('producto');
  const cantidad = get('cantidad') || '1';
  const fecha = get('fecha');
  const nombre = get('nombre');
  const nota = get('nota');
  const entregaEl = form.querySelector('input[name="entrega"]:checked');

  if (!producto) { alert('Por favor elige un producto.'); return null; }
  if (!nombre) { alert('Por favor escribe tu nombre.'); form.querySelector('[name="nombre"]').focus(); return null; }
  if (!fecha) { alert('Por favor elige una fecha.'); form.querySelector('[name="fecha"]').focus(); return null; }

  // Tortas require a minimum 72-hour lead time.
  const isTorta = form.dataset.torta === '1' || isTortaProduct(producto);
  if (isTorta) {
    const minISO = isoPlusDays(TORTA_LEAD_DAYS);
    if (fecha < minISO) {
      alert(`Las tortas requieren un mínimo de 72 horas de anticipación. Por favor elige una fecha posterior a ${formatDate(minISO)}.`);
      form.querySelector('[name="fecha"]').focus();
      return null;
    }
  }

  if (!entregaEl) { alert('Por favor elige cómo recibir tu pedido.'); return null; }

  let entrega = entregaEl.value;
  if (entrega === 'Delivery') {
    const comuna = get('comuna');
    if (!comuna) { alert('Por favor indica la comuna para el delivery.'); return null; }
    entrega = `Delivery a ${comuna}`;
  } else {
    entrega = 'Retiro en local';
  }
  return { producto, cantidad, fecha: formatDate(fecha), entrega, nombre, nota: nota || 'Sin notas especiales' };
}

/* ---------- Build WhatsApp deep link ---------- */
function buildWaUrl(d) {
  const msg =
`Hola! Quiero hacer un pedido 🎂

👤 Nombre: ${d.nombre}
🛍️ Pedido: ${d.producto} x${d.cantidad}
📅 Fecha: ${d.fecha}
🚗 Entrega: ${d.entrega}
📝 Nota al chef: ${d.nota}

¡Quedo atento/a a los detalles de pago! 😊`;
  return `${WA_PHONE}?text=${encodeURIComponent(msg)}`;
}

function formatDate(iso) {
  if (!iso) return iso;
  const [y, m, day] = iso.split('-');
  return `${day}/${m}/${y}`;
}

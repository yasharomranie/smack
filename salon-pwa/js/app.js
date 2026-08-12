/* ==========================================================================
   Salon "Banoo Gol" — app logic
   Fully client-side (no backend): bookings persist in localStorage, so the
   flow works offline once the PWA shell is cached. Swap `saveBookingRemote`
   for a real API call when a backend exists — the rest of the flow doesn't
   need to change.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const STORE_KEY = 'salon_bookings_v1';
  const OPEN_HOUR = 10;
  const CLOSE_HOUR = 20;
  const SLOT_STEP = 30; // minutes
  const CLOSED_WEEKDAYS = [5]; // Friday (Date#getDay(): Sun=0 ... Fri=5)
  const MIN_LEAD_MINUTES = 90; // can't book sooner than 90 min from now

  const SERVICES = [
    { id: 'cut', name: 'کوتاهی و شینیون', duration: 45, price: 350000, icon: 'scissors' },
    { id: 'color', name: 'رنگ و مش مو', duration: 150, price: 1850000, icon: 'droplet' },
    { id: 'keratin', name: 'کراتینه و بوتاکس مو', duration: 180, price: 2600000, icon: 'sparkle' },
    { id: 'makeup', name: 'میکاپ عروس و مجلسی', duration: 120, price: 3200000, icon: 'crown' },
    { id: 'facial', name: 'پاکسازی و اسپا صورت', duration: 60, price: 950000, icon: 'leaf' },
    { id: 'nails', name: 'مانیکور و پدیکور', duration: 60, price: 650000, icon: 'hand' },
  ];

  const SALON = {
    name: 'سالن زیبایی بانو گل',
    phone: '09120000000',
    address: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲',
  };

  /* ---------------------------------------------------------------------- */
  /* Utilities                                                              */
  /* ---------------------------------------------------------------------- */
  const faDateFmt = (date, opts) =>
    new Intl.DateTimeFormat('fa-IR-u-ca-persian', opts).format(date);

  const faNum = (n) => Number(n).toLocaleString('fa-IR');

  const isoDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const minutesToLabel = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    const d = new Date();
    d.setHours(Number(h), Number(m), 0, 0);
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveBookingRemote(booking) {
    // Local-only persistence today. Point this at a real endpoint later:
    // return fetch('/api/bookings', { method: 'POST', body: JSON.stringify(booking) });
    const all = getBookings();
    all.push(booking);
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
    return Promise.resolve(booking);
  }

  function removeBooking(id) {
    const all = getBookings().filter((b) => b.id !== id);
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  }

  function genCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = 'BG-';
    for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  /* ---------------------------------------------------------------------- */
  /* Header + mobile nav                                                    */
  /* ---------------------------------------------------------------------- */
  function initHeader() {
    const header = $('.site-header');
    const toggle = $('.nav-toggle');
    const links = $('.nav-links');
    if (!header) return;

    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (toggle && links) {
      const fab = $('.booking-fab');
      const setOpen = (open) => {
        links.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
        // The FAB is fixed at body level (outside the header's stacking
        // context) so it would otherwise float on top of the open menu.
        if (fab) fab.style.visibility = open ? 'hidden' : '';
      };

      toggle.addEventListener('click', () => setOpen(!links.classList.contains('is-open')));
      $$('.nav-links a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && links.classList.contains('is-open')) {
          setOpen(false);
          toggle.focus();
        }
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Reveal on scroll                                                       */
  /* ---------------------------------------------------------------------- */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((el, i) => {
      el.style.setProperty('--i', String(i % 8));
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Services grid                                                          */
  /* ---------------------------------------------------------------------- */
  const ICONS = {
    scissors: '<path d="M9.5 9.5 20 20M14.5 9.5 4 20M8 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM10 12l7-7"/>',
    droplet: '<path d="M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12Z"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8Z"/>',
    leaf: '<path d="M20 4S8 4 6 12s3 8 3 8 8-1 10-9c1-3 1-7 1-7ZM6 20 20 6"/>',
    hand: '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v6M11 12.5V4.5a1.5 1.5 0 0 1 3 0v8M14 12.5v-6a1.5 1.5 0 0 1 3 0V13M17 8.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-2a7 7 0 0 1-6-3.4L3 15"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  };
  function iconSvg(name, cls) {
    return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  function renderServices() {
    const grid = $('#servicesGrid');
    if (!grid) return;
    grid.innerHTML = SERVICES.map(
      (s) => `
      <article class="service-card reveal">
        <div class="service-icon">${iconSvg(s.icon)}</div>
        <h3>${s.name}</h3>
        <p>${serviceBlurb(s.id)}</p>
        <div class="service-meta">
          <span class="service-duration">${iconSvg('calendar')}${faNum(s.duration)} دقیقه</span>
          <span class="service-price">${faNum(s.price)} تومان</span>
        </div>
        <button type="button" class="service-select-btn" data-service="${s.id}">
          انتخاب و رزرو نوبت
        </button>
      </article>`
    ).join('');

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-service]');
      if (!btn) return;
      selectService(btn.dataset.service, { scroll: true });
    });
  }

  function serviceBlurb(id) {
    const map = {
      cut: 'کوتاهی حرفه‌ای متناسب با فرم صورت، همراه با شینیون روز.',
      color: 'رنگ مو، های‌لایت و مش با محصولات بدون آمونیاک.',
      keratin: 'صافی و احیای موهای آسیب‌دیده با ماندگاری بالا.',
      makeup: 'میکاپ ماندگار عروس و مجلسی با تست رایگان.',
      facial: 'پاکسازی عمقی پوست و اسپای آرامش‌بخش صورت.',
      nails: 'مانیکور، پدیکور و طراحی ناخن با محصولات اورجینال.',
    };
    return map[id] || '';
  }

  /* ---------------------------------------------------------------------- */
  /* Booking flow                                                           */
  /* ---------------------------------------------------------------------- */
  const state = {
    step: 1,
    serviceId: null,
    date: null, // ISO
    time: null, // minutes from midnight
  };

  function selectService(id, opts) {
    state.serviceId = id;
    $$('.service-select-btn').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.service === id)
    );
    $$('#serviceChips .chip').forEach((c) =>
      c.setAttribute('aria-pressed', String(c.dataset.service === id))
    );
    renderDateStrip();
    goToStep(2);
    if (opts && opts.scroll) {
      $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderServiceChips() {
    const wrap = $('#serviceChips');
    if (!wrap) return;
    wrap.innerHTML = SERVICES.map(
      (s) => `<button type="button" class="chip" data-service="${s.id}" aria-pressed="false">${s.name}</button>`
    ).join('');
    wrap.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      selectService(chip.dataset.service, { scroll: false });
    });
  }

  function nextOpenDays(count) {
    const days = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    let i = 0;
    while (days.length < count && i < count + 14) {
      const cand = new Date(d);
      cand.setDate(d.getDate() + i);
      days.push(cand);
      i++;
    }
    return days;
  }

  function renderDateStrip() {
    const strip = $('#dateStrip');
    if (!strip) return;
    const days = nextOpenDays(21);
    strip.innerHTML = days
      .map((day) => {
        const closed = CLOSED_WEEKDAYS.includes(day.getDay());
        const iso = isoDate(day);
        const dow = faDateFmt(day, { weekday: 'short' });
        const dom = faDateFmt(day, { day: 'numeric' });
        const mon = faDateFmt(day, { month: 'short' });
        return `<button type="button" class="date-chip" data-date="${iso}"
            aria-pressed="false" ${closed ? 'aria-disabled="true" disabled title="تعطیل"' : ''}>
          <span class="dow">${dow}</span>
          <span class="dom">${dom}</span>
          <span class="mon">${mon}</span>
        </button>`;
      })
      .join('');

    strip.onclick = (e) => {
      const btn = e.target.closest('.date-chip');
      if (!btn || btn.disabled) return;
      state.date = btn.dataset.date;
      state.time = null;
      $$('.date-chip', strip).forEach((c) => c.setAttribute('aria-pressed', String(c === btn)));
      renderTimeSlots();
    };
  }

  function renderTimeSlots() {
    const grid = $('#timeGrid');
    const help = $('#timeHelp');
    if (!grid) return;
    if (!state.date || !state.serviceId) {
      grid.innerHTML = '';
      if (help) help.textContent = 'ابتدا خدمت و تاریخ را انتخاب کنید.';
      return;
    }

    const service = SERVICES.find((s) => s.id === state.serviceId);
    const bookings = getBookings().filter((b) => b.date === state.date);
    const now = new Date();
    const isToday = state.date === isoDate(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + MIN_LEAD_MINUTES;

    const slots = [];
    for (let m = OPEN_HOUR * 60; m + service.duration <= CLOSE_HOUR * 60; m += SLOT_STEP) {
      slots.push(m);
    }

    if (!slots.length) {
      grid.innerHTML = '';
      if (help) help.textContent = 'برای این خدمت در این روز ظرفیتی باقی نمانده است.';
      return;
    }

    grid.innerHTML = slots
      .map((start) => {
        const end = start + service.duration;
        const overlap = bookings.some((b) => {
          const bService = SERVICES.find((s) => s.id === b.service);
          const bStart = b.timeMinutes;
          const bEnd = bStart + (bService ? bService.duration : 30);
          return start < bEnd && bStart < end;
        });
        const tooSoon = isToday && start < nowMinutes;
        const disabled = overlap || tooSoon;
        return `<button type="button" class="chip" data-time="${start}" aria-pressed="false"
            ${disabled ? 'aria-disabled="true" disabled' : ''}>${minutesToLabel(start)}</button>`;
      })
      .join('');

    if (help) help.textContent = 'ساعت‌های خاکستری قبلاً رزرو شده یا گذشته‌اند.';

    grid.onclick = (e) => {
      const btn = e.target.closest('.chip');
      if (!btn || btn.disabled) return;
      state.time = Number(btn.dataset.time);
      $$('.chip', grid).forEach((c) => c.setAttribute('aria-pressed', String(c === btn)));
    };
  }

  function goToStep(step) {
    state.step = step;
    $$('.booking-step').forEach((el) => {
      el.hidden = Number(el.dataset.step) !== step;
    });
    $$('.step-indicator li').forEach((li) => {
      const n = Number(li.dataset.step);
      li.classList.toggle('is-active', n === step);
      li.classList.toggle('is-done', n < step);
    });
  }

  function validateStep3() {
    let ok = true;
    const name = $('#customerName');
    const phone = $('#customerPhone');

    const nameRow = name.closest('.form-row');
    const phoneRow = phone.closest('.form-row');

    if (name.value.trim().length < 3) {
      nameRow.classList.add('has-error');
      ok = false;
    } else {
      nameRow.classList.remove('has-error');
    }

    const phoneClean = phone.value.trim();
    if (!/^09\d{9}$/.test(phoneClean)) {
      phoneRow.classList.add('has-error');
      ok = false;
    } else {
      phoneRow.classList.remove('has-error');
    }

    return ok;
  }

  function updateSummary() {
    const summary = $('#bookingSummary');
    if (!summary || !state.serviceId || !state.date || state.time === null) return;
    const service = SERVICES.find((s) => s.id === state.serviceId);
    const dateObj = new Date(state.date + 'T00:00:00');
    summary.innerHTML = `
      <div class="row"><span>خدمت</span><strong>${service.name}</strong></div>
      <div class="row"><span>تاریخ</span><strong>${faDateFmt(dateObj, { weekday: 'long', day: 'numeric', month: 'long' })}</strong></div>
      <div class="row"><span>ساعت</span><strong>${minutesToLabel(state.time)}</strong></div>
      <div class="row"><span>هزینه تقریبی</span><strong>${faNum(service.price)} تومان</strong></div>
    `;
  }

  function buildIcsAndDownload(booking, service) {
    const [y, m, d] = booking.date.split('-').map(Number);
    const startH = Math.floor(booking.timeMinutes / 60);
    const startM = booking.timeMinutes % 60;
    const start = new Date(y, m - 1, d, startH, startM);
    const end = new Date(start.getTime() + service.duration * 60000);
    const fmt = (dt) =>
      dt.getFullYear().toString() +
      String(dt.getMonth() + 1).padStart(2, '0') +
      String(dt.getDate()).padStart(2, '0') +
      'T' +
      String(dt.getHours()).padStart(2, '0') +
      String(dt.getMinutes()).padStart(2, '0') +
      '00';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Banoo Gol Salon//Booking//FA',
      'BEGIN:VEVENT',
      `UID:${booking.id}@banoogol.local`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:نوبت ${service.name} - سالن بانو گل`,
      `DESCRIPTION:کد رزرو ${booking.code}`,
      `LOCATION:${SALON.address}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${booking.code}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function renderConfirmation(booking, service) {
    const dateObj = new Date(booking.date + 'T00:00:00');
    const step4 = $('.booking-step[data-step="4"]');
    step4.innerHTML = `
      <div class="confirmation">
        <div class="check-badge">${iconSvg('check')}</div>
        <h3>نوبت شما ثبت شد!</h3>
        <p>${service.name} — ${faDateFmt(dateObj, { weekday: 'long', day: 'numeric', month: 'long' })} ساعت ${minutesToLabel(booking.timeMinutes)}</p>
        <span class="code">${booking.code}</span>
        <p class="hint">این کد را برای پیگیری نوبت نزد خود نگه دارید.</p>
        <div class="confirmation-actions">
          <button type="button" class="btn btn-gold" id="addToCalendarBtn">افزودن به تقویم</button>
          <a class="btn btn-outline" id="whatsappShare" target="_blank" rel="noopener">اطلاع در واتساپ</a>
          <button type="button" class="btn btn-outline" id="newBookingBtn">رزرو نوبت دیگر</button>
        </div>
      </div>
    `;
    $('#addToCalendarBtn', step4).addEventListener('click', () => buildIcsAndDownload(booking, service));
    const waText = encodeURIComponent(
      `نوبت من در ${SALON.name}\nخدمت: ${service.name}\nتاریخ: ${faDateFmt(dateObj, { day: 'numeric', month: 'long' })}\nساعت: ${minutesToLabel(booking.timeMinutes)}\nکد رزرو: ${booking.code}`
    );
    $('#whatsappShare', step4).href = `https://api.whatsapp.com/send?text=${waText}`;
    $('#newBookingBtn', step4).addEventListener('click', resetBookingFlow);
    goToStep(4);
    renderMyBookings();
  }

  function resetBookingFlow() {
    state.serviceId = null;
    state.date = null;
    state.time = null;
    $$('.service-select-btn').forEach((b) => b.classList.remove('is-active'));
    $$('#serviceChips .chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    $('#bookingForm').reset();
    renderDateStrip();
    renderTimeSlots();
    goToStep(1);
    $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderMyBookings() {
    const wrap = $('#myBookings');
    if (!wrap) return;
    const bookings = getBookings().sort((a, b) => (a.date + a.timeMinutes) > (b.date + b.timeMinutes) ? 1 : -1);
    if (!bookings.length) {
      wrap.innerHTML = '<p class="empty-state">هنوز نوبتی رزرو نکرده‌اید.</p>';
      return;
    }
    wrap.innerHTML = bookings
      .map((b) => {
        const service = SERVICES.find((s) => s.id === b.service);
        const dateObj = new Date(b.date + 'T00:00:00');
        return `
        <div class="booking-item" data-id="${b.id}">
          <div>
            <div class="bi-service">${service ? service.name : b.service}</div>
            <div class="bi-meta">${faDateFmt(dateObj, { day: 'numeric', month: 'long' })} — ساعت ${minutesToLabel(b.timeMinutes)} — کد ${b.code}</div>
          </div>
          <button type="button" class="booking-cancel" data-cancel="${b.id}">لغو نوبت</button>
        </div>`;
      })
      .join('');

    wrap.onclick = (e) => {
      const btn = e.target.closest('[data-cancel]');
      if (!btn) return;
      removeBooking(btn.dataset.cancel);
      renderMyBookings();
      renderTimeSlots();
      showToast('نوبت با موفقیت لغو شد.', 'success');
    };
  }

  function initBookingForm() {
    const form = $('#bookingForm');
    if (!form) return;

    $('#toStep2').addEventListener('click', () => {
      if (!state.serviceId) {
        showToast('لطفاً یک خدمت را انتخاب کنید.', 'error');
        return;
      }
      goToStep(2);
    });
    $('#backToStep1').addEventListener('click', () => goToStep(1));
    $('#toStep3').addEventListener('click', () => {
      if (!state.date || state.time === null) {
        showToast('لطفاً تاریخ و ساعت را انتخاب کنید.', 'error');
        return;
      }
      updateSummary();
      goToStep(3);
    });
    $('#backToStep2').addEventListener('click', () => goToStep(2));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateStep3()) {
        showToast('لطفاً اطلاعات فرم را بررسی کنید.', 'error');
        return;
      }
      const service = SERVICES.find((s) => s.id === state.serviceId);
      const booking = {
        id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
        code: genCode(),
        service: state.serviceId,
        date: state.date,
        timeMinutes: state.time,
        name: $('#customerName').value.trim(),
        phone: $('#customerPhone').value.trim(),
        notes: $('#customerNotes').value.trim(),
        createdAt: new Date().toISOString(),
      };
      saveBookingRemote(booking).then(() => {
        renderConfirmation(booking, service);
      });
    });

    renderServiceChips();
    renderDateStrip();
    goToStep(1);
    renderMyBookings();
  }

  /* ---------------------------------------------------------------------- */
  /* Testimonials                                                           */
  /* ---------------------------------------------------------------------- */
  function initTestimonialNav() {
    const track = $('#testimonialTrack');
    const prev = $('#testimonialPrev');
    const next = $('#testimonialNext');
    if (!track || !prev || !next) return;
    const scrollByCard = (dir) => {
      const card = track.querySelector('.testimonial-card');
      const amount = card ? card.getBoundingClientRect().width + 24 : 300;
      track.scrollBy({ left: dir * amount, behavior: 'smooth' });
    };
    prev.addEventListener('click', () => scrollByCard(1));
    next.addEventListener('click', () => scrollByCard(-1));
  }

  /* ---------------------------------------------------------------------- */
  /* Toasts                                                                 */
  /* ---------------------------------------------------------------------- */
  let toastTimer = null;
  function showToast(message, type) {
    const toast = $('#statusToast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'status-toast is-visible' + (type ? ` is-${type}` : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  function initConnectivity() {
    window.addEventListener('offline', () =>
      showToast('حالت آفلاین: مرور سایت و رزرو نوبت همچنان کار می‌کند.', 'error')
    );
    window.addEventListener('online', () => showToast('اتصال اینترنت برقرار شد.', 'success'));
  }

  /* ---------------------------------------------------------------------- */
  /* PWA install prompt                                                     */
  /* ---------------------------------------------------------------------- */
  function initInstall() {
    const banner = $('#installBanner');
    if (!banner) return;
    const closeBtn = $('#installClose');
    const installBtn = $('#installAction');
    let deferredPrompt = null;

    const dismissedAt = Number(localStorage.getItem('installDismissedAt') || 0);
    const dismissedRecently = Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 7;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isStandalone) return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (!dismissedRecently) banner.classList.add('is-visible');
    });

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS && !dismissedRecently) {
      $('.ib-text span', banner).textContent =
        'دکمه اشتراک‌گذاری سافاری را بزنید و «افزودن به صفحه اصلی» را انتخاب کنید.';
      installBtn.hidden = true;
      banner.classList.add('is-visible');
    }

    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.classList.remove('is-visible');
    });

    closeBtn.addEventListener('click', () => {
      banner.classList.remove('is-visible');
      localStorage.setItem('installDismissedAt', String(Date.now()));
    });

    window.addEventListener('appinstalled', () => {
      banner.classList.remove('is-visible');
      showToast('اپلیکیشن با موفقیت نصب شد!', 'success');
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Service worker                                                         */
  /* ---------------------------------------------------------------------- */
  function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {
        /* offline-first is a progressive enhancement — ignore registration failures */
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Boot                                                                   */
  /* ---------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    $('#year') && ($('#year').textContent = faNum(new Date().getFullYear()));
    initHeader();
    renderServices();
    initBookingForm();
    initTestimonialNav();
    initReveal();
    initConnectivity();
    initInstall();
    initServiceWorker();

    // Deep-link shortcut: manifest "رزرو نوبت" shortcut appends ?action=book
    if (new URLSearchParams(location.search).get('action') === 'book') {
      $('#booking') && $('#booking').scrollIntoView({ block: 'start' });
    }
  });
})();

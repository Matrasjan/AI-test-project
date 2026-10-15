/*
 * Общая логика для трёх концепций «ЭксТехСервис».
 * Визуально концепции независимы — этот файл отвечает только за поведение:
 *   • подстановка контактов из shared/config.js (или аккуратные заглушки);
 *   • демонстрационная форма «Запросить предварительный расчёт» с валидацией;
 *   • предзаполнение формы из карточек услуг (data-prefill);
 *   • мобильное меню, уведомления (toast), появление блоков при скролле.
 */
(function () {
  'use strict';

  var cfg = window.ETS_CONFIG || {};
  var PLACEHOLDER = 'уточняется у клиента';

  /* ---------- Toast ---------- */
  var toastEl;
  var toastTimer;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'ets-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-shown');
    }, 4200);
  }

  var toastStyle = document.createElement('style');
  toastStyle.textContent =
    '.ets-toast{position:fixed;left:50%;bottom:24px;z-index:1000;max-width:min(92vw,440px);' +
    'padding:14px 18px;border-radius:var(--toast-radius,10px);background:var(--toast-bg,#111);' +
    'color:var(--toast-fg,#fff);font:inherit;font-size:15px;line-height:1.4;' +
    'box-shadow:0 12px 32px rgba(0,0,0,.25);transform:translate(-50%,140%);opacity:0;' +
    'transition:transform .35s ease,opacity .35s ease;pointer-events:none}' +
    '.ets-toast.is-shown{transform:translate(-50%,0);opacity:1}' +
    '[hidden]{display:none!important}' +
    '[data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}' +
    '[data-reveal].is-visible{opacity:1;transform:none}' +
    '@media (prefers-reduced-motion:reduce){[data-reveal]{opacity:1;transform:none;transition:none}}';
  document.head.appendChild(toastStyle);

  /* ---------- Контакты ---------- */
  function scrollToForm() {
    var target = document.querySelector('[data-ets-form]');
    if (!target) return;
    var anchor = target.closest('section') || target;
    anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var contactMap = {
    phone: {
      value: cfg.phoneDisplay || cfg.phone,
      href: cfg.phone ? 'tel:' + cfg.phone.replace(/[^\d+]/g, '') : '',
      missing: 'Номер телефона уточняется у клиента. Пока оставьте заявку — форма ниже.'
    },
    email: {
      value: cfg.email,
      href: cfg.email ? 'mailto:' + cfg.email : '',
      missing: 'Адрес почты уточняется у клиента. Пока оставьте заявку — форма ниже.'
    },
    max: {
      value: cfg.max ? 'Написать в MAX' : '',
      href: cfg.max || '',
      missing: 'Ссылка на MAX уточняется у клиента. Пока оставьте заявку — форма ниже.'
    }
  };

  // Текстовые значения: <span data-contact-value="phone"></span>
  document.querySelectorAll('[data-contact-value]').forEach(function (el) {
    var key = el.getAttribute('data-contact-value');
    if (key === 'address') { el.textContent = cfg.city + ', ' + cfg.address; return; }
    if (key === 'schedule') { el.textContent = cfg.schedule; return; }
    var c = contactMap[key];
    if (!c) return;
    if (c.value) {
      el.textContent = c.value;
    } else {
      el.textContent = el.getAttribute('data-placeholder') || PLACEHOLDER;
      el.classList.add('is-placeholder');
    }
  });

  // Ссылки/кнопки: <a data-contact="phone">Позвонить</a>
  document.querySelectorAll('[data-contact]').forEach(function (el) {
    var c = contactMap[el.getAttribute('data-contact')];
    if (!c) return;
    if (c.href) {
      el.setAttribute('href', c.href);
      if (el.getAttribute('data-contact') === 'max') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      }
    } else {
      el.setAttribute('href', '#request');
      el.setAttribute('data-placeholder-link', '');
      el.addEventListener('click', function (e) {
        e.preventDefault();
        toast(c.missing);
        scrollToForm();
      });
    }
  });

  // Ссылка на карту
  document.querySelectorAll('[data-map-link]').forEach(function (el) {
    el.setAttribute('href', 'https://yandex.ru/maps/?text=' +
      encodeURIComponent(cfg.city + ', ' + cfg.address));
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
  });

  /* ---------- Мобильное меню ---------- */
  document.querySelectorAll('[data-nav-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = document.documentElement.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.querySelectorAll('[data-nav] a').forEach(function (a) {
    a.addEventListener('click', function () {
      document.documentElement.classList.remove('nav-open');
      document.querySelectorAll('[data-nav-toggle]').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
      });
    });
  });

  /* ---------- Предзаполнение формы ---------- */
  document.querySelectorAll('[data-prefill]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var form = document.querySelector('[data-ets-form]');
      if (!form) return;
      e.preventDefault();
      var value = el.getAttribute('data-prefill');
      var select = form.querySelector('[name="equipment"]');
      if (select) {
        var match = Array.prototype.find.call(select.options, function (o) {
          return o.value === value;
        });
        if (match) select.value = value;
      }
      var note = el.getAttribute('data-prefill-note');
      var msg = form.querySelector('[name="message"]');
      if (note && msg && !msg.value) msg.value = note;
      scrollToForm();
      setTimeout(function () {
        var first = form.querySelector('[name="name"]');
        if (first) first.focus({ preventScroll: true });
      }, 500);
    });
  });

  /* ---------- Форма ---------- */
  function formatPhone(raw) {
    var d = raw.replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  var rules = {
    name: function (v) {
      if (!v.trim()) return 'Укажите, как к вам обращаться';
      if (v.trim().length < 2) return 'Слишком короткое имя';
      return '';
    },
    phone: function (v) {
      var digits = v.replace(/\D/g, '');
      if (!digits) return 'Укажите телефон для связи';
      if (digits.length !== 11) return 'Номер должен содержать 11 цифр: +7 (XXX) XXX-XX-XX';
      return '';
    },
    email: function (v) {
      if (!v.trim()) return '';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Проверьте адрес почты';
    },
    equipment: function (v) {
      return v ? '' : 'Выберите технику или узел';
    },
    message: function (v) {
      if (!v.trim()) return 'Опишите неисправность хотя бы в двух словах';
      if (v.trim().length < 5) return 'Добавьте пару деталей — так расчёт будет точнее';
      return '';
    },
    consent: function (v, el) {
      return el.checked ? '' : 'Нужно согласие на обработку данных';
    }
  };

  function fieldWrap(el) {
    return el.closest('[data-field]') || el.parentElement;
  }

  function showError(el, text) {
    var wrap = fieldWrap(el);
    var err = wrap.querySelector('.field-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error';
      err.id = (el.id || el.name) + '-error';
      wrap.appendChild(err);
    }
    err.textContent = text;
    wrap.classList.toggle('has-error', !!text);
    if (text) {
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', err.id);
    } else {
      el.removeAttribute('aria-invalid');
    }
  }

  function validateField(el) {
    var rule = rules[el.getAttribute('data-validate')];
    if (!rule) return true;
    var msg = rule(el.value || '', el);
    showError(el, msg);
    return !msg;
  }

  document.querySelectorAll('[data-ets-form]').forEach(function (form) {
    form.setAttribute('novalidate', '');
    var fields = form.querySelectorAll('[data-validate]');
    var success = form.parentElement.querySelector('[data-form-success]');

    fields.forEach(function (el) {
      if (el.getAttribute('data-validate') === 'phone') {
        el.addEventListener('input', function () {
          el.value = formatPhone(el.value);
        });
        el.addEventListener('focus', function () {
          if (!el.value) el.value = '+7 (';
        });
        el.addEventListener('blur', function () {
          if (el.value.replace(/\D/g, '').length <= 1) el.value = '';
        });
      }
      // После первого касания (или попытки отправки) ошибки обновляются прямо при вводе,
      // чтобы сообщение исчезало сразу и вёрстка не «прыгала» в момент следующего клика.
      el.addEventListener('blur', function () { el.dataset.touched = '1'; validateField(el); });
      el.addEventListener('change', function () { el.dataset.touched = '1'; validateField(el); });
      el.addEventListener('input', function () { if (el.dataset.touched) validateField(el); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      fields.forEach(function (el) {
        el.dataset.touched = '1';
        if (!validateField(el) && !firstInvalid) firstInvalid = el;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        toast('Проверьте выделенные поля формы');
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.setAttribute('data-loading', ''); }

      // Демонстрация: реальная отправка в MAX/почту появится после получения доступов.
      setTimeout(function () {
        if (btn) { btn.disabled = false; btn.removeAttribute('data-loading'); }
        var data = new FormData(form);
        if (success) {
          var nameEl = success.querySelector('[data-success-name]');
          if (nameEl) nameEl.textContent = (data.get('name') || '').toString().trim();
          var eqEl = success.querySelector('[data-success-equipment]');
          if (eqEl) eqEl.textContent = (data.get('equipment') || '').toString();
          form.hidden = true;
          success.hidden = false;
          success.focus();
        } else {
          toast('Заявка сформирована (демо-режим, отправка не настроена)');
        }
        form.reset();
        fields.forEach(function (el) { showError(el, ''); delete el.dataset.touched; });
      }, 700);
    });

    if (success) {
      var again = success.querySelector('[data-form-again]');
      if (again) {
        again.addEventListener('click', function () {
          success.hidden = true;
          form.hidden = false;
          var first = form.querySelector('[name="name"]');
          if (first) first.focus();
        });
      }
    }
  });

  /* ---------- Появление при скролле ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Год в подвале ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  window.ETS = { toast: toast, scrollToForm: scrollToForm };
})();

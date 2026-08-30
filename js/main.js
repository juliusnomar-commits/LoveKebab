/**
 * Love Kebab — main.js
 *
 * Engineering rule: every continuous scroll-position-dependent effect
 * (nav chrome, hero image parallax) runs from ONE shared requestAnimationFrame
 * loop that reads window.scrollY once per frame. One-shot reveals use a
 * separate lightweight IntersectionObserver.
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------ helpers */
  var clamp01 = function (v) { return Math.max(0, Math.min(1, v)); };
  var smooth = function (t) { return t * t * (3 - 2 * t); };
  // eased progress of p across the [a, b] segment
  var seg = function (p, a, b) { return smooth(clamp01((p - a) / (b - a))); };

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var prefersReducedMotion = motionQuery.matches;

  /* ------------------------------------------------------------------ i18n
     Default language is German — English is opt-in via the nav toggle and
     remembered per-visitor in localStorage. */
  var LANG_STORAGE_KEY = 'pumakalla-lang';
  var HAIRSP = ' ';
  var ARROW = '→';

  var translations = {
    'skip': { de: 'Zum Inhalt springen', en: 'Skip to content' },
    'nav.ariaLabel': { de: 'Hauptnavigation', en: 'Main navigation' },
    'nav.home': { de: 'Startseite', en: 'Home' },
    'nav.menu': { de: 'Speisekarte', en: 'Menu' },
    'nav.about': { de: 'Über uns', en: 'About' },
    'nav.contact': { de: 'Kontakt', en: 'Contact' },
    'nav.logoAria': { de: 'Love Kebab — Startseite', en: 'Love Kebab — Home' },
    'nav.callAria': { de: 'Anrufen', en: 'Call' },
    'nav.call': { de: 'Anrufen', en: 'Call' },
    'nav.whatsappAria': { de: 'WhatsApp schreiben', en: 'Message on WhatsApp' },
    'nav.menuOpen': { de: 'Menü öffnen', en: 'Open menu' },
    'nav.menuClose': { de: 'Menü schließen', en: 'Close menu' },

    'hero.sectionAria': { de: 'Willkommen bei Love Kebab', en: 'Welcome to Love Kebab' },
    'hero.kicker': { de: 'Döner · Wings · Parmesan Fries · Dürüm', en: 'Döner · Wings · Parmesan Fries · Dürüm' },
    'hero.word0': { de: 'Mit', en: 'Made' },
    'hero.word1': { de: 'Liebe', en: 'with' },
    'hero.word2': { de: 'gemacht.', en: 'love.' },
    'hero.trust1': { de: '100' + HAIRSP + '% frisches Fleisch', en: '100' + HAIRSP + '% Fresh Meat' },

    'place.name': { de: 'Essen-Rüttenscheid', en: 'Essen-Rüttenscheid' },

    'marquee.love': { de: 'Döner mit Liebe', en: 'Döner with Love' },
    'marquee.fresh': { de: '100' + HAIRSP + '% frisch', en: '100' + HAIRSP + '% Fresh' },

    'story.eyebrow': { de: 'Unsere Geschichte', en: 'Our Story' },
    'story.title': { de: 'Frisch gemacht, wie es sein sollte.', en: 'Fresh food, the way it should be.' },
    'story.body1': {
      de: 'Bei Love Kebab treffen frische Zutaten auf jahrelange Erfahrung. Mitten in Rüttenscheid bereiten wir alles frisch zu — von Wings über Parmesan Fries bis Dürüm, ehrlich und mit Liebe gemacht.',
      en: 'At Love Kebab, fresh ingredients meet years of experience. Right here in Rüttenscheid, we prepare everything fresh — from wings to parmesan fries to dürüm, honest and made with love.'
    },
    'story.stat1': { de: 'Gerichte auf der Karte', en: 'dishes on the menu' },
    'story.stat2': { de: 'Frisch', en: 'Fresh' },
    'story.stat3': { de: 'Jahre in Rüttenscheid', en: 'years in Rüttenscheid' },
    'story.photoLabel': { de: 'Foto: Ladeninnenraum', en: 'Photo: Store interior' },
    'story.photoSub': { de: 'Fotos folgen in Kürze', en: 'Photos coming soon' },
    'story.tag': { de: 'Bald verfügbar', en: 'Coming soon' },

    'menu.eyebrow': { de: 'Unsere Klassiker', en: 'Our Classics' },
    'menu.title': { de: 'Frisch für dich<br>zubereitet.', en: 'Freshly made<br>for you.' },
    'menu.photoDoner': { de: 'Foto: Döner Kebab', en: 'Photo: Döner Kebab' },
    'menu.descDoner': { de: 'Der Klassiker im frischen Fladenbrot — direkt vom Spieß.', en: 'The classic in fresh flatbread — straight from the spit.' },
    'menu.descDoenerBowl': { de: 'Gemischter Salat, Pommes und Sauce.', en: 'Mixed salad, fries and sauce.' },
    'menu.photoDurum': { de: 'Foto: Dürüm', en: 'Photo: Dürüm' },
    'menu.descDurum': { de: 'Im warmen, dünnen Fladenbrot gerollt — perfekt für unterwegs.', en: 'Rolled in warm, thin flatbread — perfect on the go.' },
    'menu.photoWings': { de: 'Foto: Wings', en: 'Photo: Wings' },
    'menu.descWings': { de: 'Mariniert in unserer eigenen Gewürzmischung — frisch frittiert.', en: 'Tossed in our own signature marinade — fried fresh to order.' },
    'menu.photoParmFries': { de: 'Foto: Parmesan Fries', en: 'Photo: Parmesan Fries' },
    'menu.parmFriesName': { de: 'Parmesan Fries', en: 'Parmesan Fries' },
    'menu.descParmFries': { de: 'Handgeschnitten, mit Parmesan und frischen Kräutern.', en: 'Hand-cut, tossed with parmesan and fresh herbs.' },
    'menu.fullMenuCta': { de: 'Vollständige Speisekarte ansehen' + HAIRSP + ARROW, en: 'View Full Menu' + HAIRSP + ARROW },

    'values.eyebrow': { de: 'Warum Love Kebab', en: 'Why Love Kebab' },
    'values.title': { de: 'Qualität, die man<br>schmeckt.', en: 'Quality you can<br>taste.' },
    'values.sauceTitle': { de: 'Hausgemachte Soßen', en: 'Homemade Sauces' },
    'values.sauceTag': { de: 'Love Saucen', en: 'Love Sauces' },
    'values.sauceCardTitle': { de: 'Frisch angerührt.', en: 'Mixed fresh.' },
    'values.sauceItem1': { de: 'Scharfsauce', en: 'Scharfsauce' },
    'values.sauceItem2': { de: 'Knoblauch', en: 'Knoblauch' },
    'values.sauceItem3': { de: 'Sweet Chilli', en: 'Sweet Chilli' },
    'values.sauceItem4': { de: 'Honey Cocktailsauce', en: 'Honey Cocktailsauce' },
    'values.sauceItem5': { de: 'Joppiesauce', en: 'Joppiesauce' },
    'values.sauceItem6': { de: 'Joghurtsauce', en: 'Joghurtsauce' },
    'values.friesTag': { de: 'Love Friet', en: 'Love Friet' },
    'values.friesTitle': { de: 'Frisch geschnitten.', en: 'Cut fresh.' },
    'values.friesItem1': { de: 'Pommes Frites (Large)', en: 'Pommes Frites (Large)' },
    'values.friesItem2': { de: 'Pommes Frites mit Parmesan & Trüffelmayo', en: 'Pommes Frites mit Parmesan & Trüffelmayo' },
    'values.friesItem3': { de: 'Pommes Frites mit Majo, Currysauce & Röstzwiebeln', en: 'Pommes Frites mit Majo, Currysauce & Röstzwiebeln' },
    'values.wingsTag': { de: 'Love Wings', en: 'Love Wings' },
    'values.wingsTitle': { de: 'Frisch frittiert.', en: 'Fried fresh.' },
    'values.wingsItem1': { de: 'Classic Flavour', en: 'Classic Flavour' },
    'values.wingsItem2': { de: 'Parmesan Wings Flavour', en: 'Parmesan Wings Flavour' },
    'values.prev': { de: 'Zurück', en: 'Previous' },
    'values.next': { de: 'Weiter', en: 'Next' },
    'menu.prev': { de: 'Zurück', en: 'Previous' },
    'menu.next': { de: 'Weiter', en: 'Next' },

    'contact.eyebrow': { de: 'Standort', en: 'Location' },
    'contact.title': { de: 'Besuch uns in Rüttenscheid.', en: 'Visit us in Rüttenscheid.' },
    'contact.whatsapp': { de: 'WhatsApp schreiben', en: 'Message on WhatsApp' },
    'contact.hoursTitle': { de: 'Öffnungszeiten', en: 'Opening Hours' },
    'contact.hoursNote': { de: 'Öffnungszeiten können an Feiertagen abweichen.', en: 'Hours may vary on public holidays.' },
    'contact.mapTitle': { de: 'Love Kebab Standort auf Google Maps', en: 'Love Kebab Location on Google Maps' },
    'hours.closed': { de: 'Geschlossen', en: 'Closed' },

    'days.mon': { de: 'Montag', en: 'Monday' },
    'days.tue': { de: 'Dienstag', en: 'Tuesday' },
    'days.wed': { de: 'Mittwoch', en: 'Wednesday' },
    'days.thu': { de: 'Donnerstag', en: 'Thursday' },
    'days.fri': { de: 'Freitag', en: 'Friday' },
    'days.sat': { de: 'Samstag', en: 'Saturday' },
    'days.sun': { de: 'Sonntag', en: 'Sunday' },

    'footer.rights': { de: 'Alle Rechte vorbehalten.', en: 'All rights reserved.' },
    'footer.imprint': { de: 'Impressum', en: 'Imprint' },
    'footer.privacy': { de: 'Datenschutz', en: 'Privacy Policy' },
    'footer.credit': { de: 'Website von', en: 'Website by' },

    'meta.title': { de: 'Love Kebab — Döner mit Liebe | Essen-Rüttenscheid', en: 'Love Kebab — Döner with Love | Essen-Rüttenscheid' },
    'meta.description': {
      de: 'Love Kebab — Döner mit Liebe in Essen-Rüttenscheid. 100 % frisches Fleisch, hausgemachte Soßen, echtes Street-Food-Gefühl.',
      en: 'Love Kebab — Döner with Love in Essen-Rüttenscheid. 100% fresh meat, homemade sauces, real street-food vibes.'
    },

    /* ---------------------------------------------------- order + reviews */
    'nav.order': { de: 'Bestellen', en: 'Order Now' },

    /* ------------------------------------------------------- menu.html page */
    'menu.pageTitle': { de: 'Speisekarte — Love Kebab', en: 'Menu — Love Kebab' },
    'menu.pageDescription': {
      de: 'Die vollständige Speisekarte von Love Kebab in Essen-Rüttenscheid: Wraps, Taschen & Wrap Gerichte, Wings, Bowl, Love Friet, Teller, Lahmacun & Currywurst, Extra Topping, Saucen & Dips und Dessert.',
      en: 'The full Love Kebab menu in Essen-Rüttenscheid: wraps, pocket & wrap dishes, wings, bowls, Love Friet, Teller, Lahmacun & currywurst, extra toppings, sauces & dips and dessert.'
    },
    'menu.heroTitle': { de: 'Speisekarte', en: 'Menu' },
    'menu.heroSub': { de: '(Alle Gerichte enthalten Geflügelfleisch)', en: '(All dishes are made with poultry / chicken meat)' },

    'menu.jump.wraps': { de: 'Wraps', en: 'Wraps' },
    'menu.jump.taschenWrapGerichte': { de: 'Taschen & Wrap Gerichte', en: 'Taschen & Wrap Gerichte' },
    'menu.jump.wings': { de: 'Wings', en: 'Wings' },
    'menu.jump.bowl': { de: 'Bowl', en: 'Bowl' },
    'menu.jump.fries': { de: 'Love Friet', en: 'Love Friet' },
    'menu.jump.teller': { de: 'Teller / Lahmacun / Currywurst', en: 'Teller / Lahmacun / Currywurst' },
    'menu.jump.extraTopping': { de: 'Extra Topping', en: 'Extra Topping' },
    'menu.jump.sauces': { de: 'Saucen & Dips', en: 'Sauces & Dips' },
    'menu.jump.dessert': { de: 'Dessert', en: 'Dessert' },

    'menu.cat.wrapsEyebrow': { de: 'Frisch vom Spieß', en: 'Fresh off the spit' },
    'menu.cat.wrapsTitle': { de: 'Wraps', en: 'Wraps' },
    'menu.cat.taschenWrapGerichteEyebrow': { de: 'Frisch gefüllt', en: 'Freshly filled' },
    'menu.cat.taschenWrapGerichteTitle': { de: 'Taschen und Wrap Gerichte', en: 'Taschen und Wrap Gerichte' },
    'menu.cat.wingsEyebrow': { de: 'Frisch frittiert, 6er', en: 'Freshly fried, 6 pcs' },
    'menu.cat.wingsTitle': { de: 'Chicken Wings', en: 'Chicken Wings' },
    'menu.cat.bowlEyebrow': { de: 'Frisch angerichtet', en: 'Freshly assembled' },
    'menu.cat.bowlTitle': { de: 'Bowl', en: 'Bowl' },
    'menu.cat.bowlSublistHeading': { de: 'Bowl-Saucen:', en: 'Bowl sauces:' },
    'menu.cat.friesEyebrow': { de: 'Love Friet', en: 'Love Friet' },
    'menu.cat.friesTitle': { de: 'Love Friet', en: 'Love Friet' },
    'menu.cat.friesSublistHeading': { de: 'Wähle dein Topping:', en: 'Choose your topping:' },
    'menu.cat.tellerEyebrow': { de: 'Für den großen Hunger', en: 'For the properly hungry' },
    'menu.cat.tellerTitle': { de: 'Teller / Lahmacun / Currywurst', en: 'Teller / Lahmacun / Currywurst' },
    'menu.cat.extraToppingEyebrow': { de: 'Extra Topping', en: 'Extra Topping' },
    'menu.cat.extraToppingTitle': { de: 'Extra Topping', en: 'Extra Topping' },
    'menu.cat.saucesEyebrow': { de: 'Saucen & Dips', en: 'Sauces & Dips' },
    'menu.cat.saucesTitle': { de: 'Saucen & Dips', en: 'Sauces & Dips' },
    'menu.cat.dessertEyebrow': { de: 'Zum Abschluss', en: 'To finish' },
    'menu.cat.dessertTitle': { de: 'Dessert', en: 'Dessert' },

    /* menu.item.*.desc entries removed — full priced menu (menu.html) is now
       rendered entirely from content/menu.json, see renderMenu() below. */
    'menu.askInStore': { de: 'Bitte im Laden fragen', en: 'Ask in store' },

    /* homepage-only names not previously wired to i18n */
    'menu.wingsName': { de: 'Wings', en: 'Wings' },
    'menu.doenerBowlName': { de: 'Döner Bowl', en: 'Döner Bowl' },
    'menu.duerumName': { de: 'Dürüm', en: 'Dürüm' },

    'contact.addressLine1': { de: 'Rüttenscheider Straße 133', en: 'Rüttenscheider Straße 133' },
    'contact.addressLine2': { de: '45130 Essen', en: '45130 Essen' },
    'contact.phoneDisplay': { de: '+49 201 799 175 72', en: '+49 201 799 175 72' },

    'hours.mon': { de: '11:00' + HAIRSP + '–' + HAIRSP + '22:00', en: '11:00' + HAIRSP + '–' + HAIRSP + '22:00' },
    'hours.tue': { de: '11:00' + HAIRSP + '–' + HAIRSP + '22:00', en: '11:00' + HAIRSP + '–' + HAIRSP + '22:00' },
    'hours.wed': { de: '11:00' + HAIRSP + '–' + HAIRSP + '22:00', en: '11:00' + HAIRSP + '–' + HAIRSP + '22:00' },
    'hours.thu': { de: '11:00' + HAIRSP + '–' + HAIRSP + '22:00', en: '11:00' + HAIRSP + '–' + HAIRSP + '22:00' },
    'hours.fri': { de: '11:00' + HAIRSP + '–' + HAIRSP + '05:00', en: '11:00' + HAIRSP + '–' + HAIRSP + '05:00' },
    'hours.sat': { de: '11:00' + HAIRSP + '–' + HAIRSP + '05:00', en: '11:00' + HAIRSP + '–' + HAIRSP + '05:00' },

    'footer.legal': { de: 'Love Kebab · Pamukkale Kebap Haus<br>Essen-Rüttenscheid', en: 'Love Kebab · Pamukkale Kebap Haus<br>Essen-Rüttenscheid' }
  };

  function getStoredLang() {
    try {
      var stored = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === 'de' || stored === 'en') return stored;
    } catch (e) { /* localStorage unavailable */ }
    return 'de';
  }

  var currentLang = getStoredLang();

  function applyLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var entry = translations[el.getAttribute('data-i18n')];
      if (entry && entry[lang] != null) el.innerHTML = entry[lang];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var entry = translations[el.getAttribute('data-i18n-aria')];
      if (entry && entry[lang] != null) el.setAttribute('aria-label', entry[lang]);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var entry = translations[el.getAttribute('data-i18n-title')];
      if (entry && entry[lang] != null) el.setAttribute('title', entry[lang]);
    });

    var titleKey = document.body.getAttribute('data-page-title') || 'meta.title';
    var descKey = document.body.getAttribute('data-page-desc') || 'meta.description';
    if (translations[titleKey]) document.title = translations[titleKey][lang];
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && translations[descKey]) {
      metaDesc.setAttribute('content', translations[descKey][lang]);
    }

    document.querySelectorAll('.lang-option').forEach(function (opt) {
      opt.classList.toggle('is-active', opt.getAttribute('data-lang') === lang);
    });

    if (navToggle) {
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-label', translations[expanded ? 'nav.menuClose' : 'nav.menuOpen'][lang]);
    }

    try { window.localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* localStorage unavailable */ }
  }

  function initLangToggle() {
    var toggle = document.getElementById('lang-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      applyLang(currentLang === 'de' ? 'en' : 'de');
    });
  }

  /* ----------------------------------------------------------- DOM refs */
  var nav = document.querySelector('.nav');
  var hero = document.querySelector('.hero');
  var heroImageParallaxEl = document.querySelector('.hero-image-wrap');
  var scrollTopBtn = document.getElementById('scroll-top');
  var navToggle = document.querySelector('.nav-toggle');
  var navOverlay = document.getElementById('navOverlay');
  var navOverlayClose = document.querySelector('.nav-overlay-close');

  /* --------------------------------------------- shared RAF scroll loop */
  var lastNavScrolled = null;

  function frame(now) {
    var y = window.scrollY;
    var vh = window.innerHeight;

    /* nav chrome: transparent → solid */
    var navScrolled = y > 24;
    if (nav && navScrolled !== lastNavScrolled) {
      nav.classList.toggle('nav--scrolled', navScrolled);
      lastNavScrolled = navScrolled;
    }

    /* scroll-to-top visibility */
    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle('is-visible', y > vh * 0.6);
    }

    if (!prefersReducedMotion && hero) {
      var heroH = hero.offsetHeight || 1;
      var heroP = clamp01(y / heroH);

      /* hero image: gentle parallax + fade while leaving the hero */
      if (heroImageParallaxEl) {
        var drift = seg(heroP, 0, 0.9);
        heroImageParallaxEl.style.transform = 'translateY(' + (drift * -34).toFixed(2) + 'px)';
        heroImageParallaxEl.style.opacity = String(1 - drift * 0.35);
      }
    }

    requestAnimationFrame(frame);
  }

  /* --------------------------------------- reduced motion: final states */
  function applyReducedMotionStates() {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ------------------------------------------------------ mobile menu */
  function closeMenu() {
    if (!navToggle || !navOverlay) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', translations['nav.menuOpen'][currentLang]);
    navOverlay.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  }

  function openMenu() {
    if (!navToggle || !navOverlay) return;
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', translations['nav.menuClose'][currentLang]);
    navOverlay.classList.add('is-open');
    document.body.classList.add('nav-open');
  }

  function initNavToggle() {
    if (!navToggle || !navOverlay) return;

    navToggle.addEventListener('click', function () {
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMenu(); else openMenu();
    });

    if (navOverlayClose) navOverlayClose.addEventListener('click', closeMenu);

    navOverlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ------------------------------------------------------ smooth scroll */
  function initSmoothScroll() {
    var menuJump = document.querySelector('.menu-jump');
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        var navH = nav ? nav.offsetHeight : 72;
        var jumpH = menuJump ? menuJump.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.scrollY - navH - jumpH;
        window.scrollTo({
          top: Math.max(top, 0),
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      });
    });
  }

  /* -------------------------------- shared swipe/arrow carousel behavior */
  function setupCarousel(grid, prevBtn, nextBtn, itemSelector, breakpointPx) {
    var carouselQuery = window.matchMedia('(max-width: ' + breakpointPx + 'px)');
    var timer = null;

    function items() { return grid.querySelectorAll(itemSelector); }

    function currentIndex() {
      var list = items();
      var pos = grid.scrollLeft;
      var closest = 0, min = Infinity;
      list.forEach(function (c, i) {
        var d = Math.abs(c.offsetLeft - grid.offsetLeft - pos);
        if (d < min) { min = d; closest = i; }
      });
      return closest;
    }

    function goTo(i) {
      var list = items();
      var count = list.length;
      if (!count) return;
      var idx = ((i % count) + count) % count;
      grid.scrollTo({ left: list[idx].offsetLeft - grid.offsetLeft, behavior: 'smooth' });
    }

    function next() { goTo(currentIndex() + 1); }
    function prev() { goTo(currentIndex() - 1); }

    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function startAuto() {
      stopAuto();
      if (!carouselQuery.matches || prefersReducedMotion) return;
      timer = setInterval(next, 2000);
    }

    prevBtn.addEventListener('click', function () { prev(); startAuto(); });
    nextBtn.addEventListener('click', function () { next(); startAuto(); });
    grid.addEventListener('pointerdown', stopAuto);
    grid.addEventListener('pointerup', startAuto);
    grid.addEventListener('touchstart', stopAuto, { passive: true });
    grid.addEventListener('touchend', startAuto, { passive: true });
    carouselQuery.addEventListener('change', startAuto);

    startAuto();
  }

  /* ---------------------------------------- values: swipe/arrow carousel */
  function initValuesCarousel() {
    var grid = document.getElementById('values-grid');
    var prevBtn = document.querySelector('.values-arrow--prev');
    var nextBtn = document.querySelector('.values-arrow--next');
    if (!grid || !prevBtn || !nextBtn) return;
    setupCarousel(grid, prevBtn, nextBtn, '.value-card', 820);
  }

  /* ------------------------------------- menu preview: swipe/arrow carousel */
  function initMenuCarousel() {
    var grid = document.getElementById('menu-grid');
    var prevBtn = document.querySelector('.menu-arrow--prev');
    var nextBtn = document.querySelector('.menu-arrow--next');
    if (!grid || !prevBtn || !nextBtn) return;
    setupCarousel(grid, prevBtn, nextBtn, '.product-card', 700);
  }

  /* ------------------------------------------------- menu quick-jump nav */
  function initMenuJump() {
    var jumpLinks = document.querySelectorAll('.menu-jump-link');
    var cats = document.querySelectorAll('.menu-cat');
    if (!jumpLinks.length || !cats.length || !('IntersectionObserver' in window)) return;

    var linkFor = {};
    jumpLinks.forEach(function (link) { linkFor[link.getAttribute('href')] = link; });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        jumpLinks.forEach(function (l) { l.classList.remove('is-active'); });
        var active = linkFor['#' + entry.target.id];
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    cats.forEach(function (cat) { observer.observe(cat); });
  }

  /* re-land on a #hash target (e.g. menu.html#drinks) after CMS content has
     rendered — the browser's own anchor-jump fires too early, before the
     dynamically-built menu has expanded the page to its final height */
  function fixInitialHashScroll() {
    if (!window.location.hash) return;
    var target = document.querySelector(window.location.hash);
    if (!target) return;
    var menuJump = document.querySelector('.menu-jump');
    var navH = nav ? nav.offsetHeight : 72;
    var jumpH = menuJump ? menuJump.offsetHeight : 0;
    var top = target.getBoundingClientRect().top + window.scrollY - navH - jumpH;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'auto' });
  }

  /* -------------------------------------------------------- scroll top */
  function initScrollTop() {
    if (!scrollTopBtn) return;
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------- one-shot reveals (IntersectionObserver) */
  function initRevealObserver() {
    var items = document.querySelectorAll('.reveal');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------- small conveniences */
  function initTodayHighlight() {
    var today = String(new Date().getDay()); // 0 = Sunday
    var row = document.querySelector('.hours-table tr[data-day="' + today + '"]');
    if (row) row.classList.add('is-today');
  }

  function initYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------ CMS-editable content
     Text and photos edited in Decap CMS live in content/site.json (homepage)
     and content/menu.json (priced menu). Both are optional — if either is
     missing or unreachable, the hardcoded defaults above / in the HTML are
     used as-is, so the site still works with no CMS content at all. */
  function flattenInto(target, obj, prefix) {
    Object.keys(obj || {}).forEach(function (key) {
      var value = obj[key];
      var path = prefix ? prefix + '.' + key : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        flattenInto(target, value, path);
      } else {
        target[path] = value;
      }
    });
    return target;
  }

  function applyTextOverrides(data) {
    var flat = flattenInto({}, data, '');
    Object.keys(flat).forEach(function (key) {
      if (translations[key]) translations[key].de = flat[key];
    });
  }

  function applyImageOverrides(images) {
    if (!images) return;
    document.querySelectorAll('[data-content-img]').forEach(function (el) {
      var key = el.getAttribute('data-content-img');
      if (images[key]) el.src = images[key];
    });
  }

  // "kebab-durum" -> "kebabDurum", to match the translations key naming
  function camelFromId(id) {
    return id.replace(/-([a-z0-9])/g, function (_, c) { return c.toUpperCase(); });
  }

  /* builds one menu.html category (grid of product cards, or a plain
     price list) straight from content/menu.json — see that file for shape.
     Category eyebrow/title/jump-label are merged into `translations`
     (not written to the DOM directly) so the applyLang() pass that runs
     right after this — and any later language toggle — renders the
     CMS-edited value instead of clobbering it back to the hardcoded
     default. */
  function renderMenuCategory(cat) {
    var section = document.getElementById(cat.id);
    if (!section) return;

    var camel = camelFromId(cat.id);
    if (cat.eyebrow && translations['menu.cat.' + camel + 'Eyebrow']) {
      translations['menu.cat.' + camel + 'Eyebrow'].de = cat.eyebrow;
    }
    if (cat.title && translations['menu.cat.' + camel + 'Title']) {
      translations['menu.cat.' + camel + 'Title'].de = cat.title;
    }
    if (cat.jumpLabel && translations['menu.jump.' + camel]) {
      translations['menu.jump.' + camel].de = cat.jumpLabel;
    }

    // one or two representative photos per category (never one per dish) —
    // built from content/menu.json's cat.photos; sections with no photos
    // (Saucen & Dips, Dessert) simply have no [data-menu-cat-photos] host
    var photoGroup = section.querySelector('[data-menu-cat-photos]');
    if (photoGroup) {
      var photos = cat.photos || [];
      photoGroup.className = 'menu-cat-photo-group' + (photos.length > 1 ? ' has-' + photos.length : '');
      photoGroup.innerHTML = '';
      photos.forEach(function (photo) {
        var img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.alt || cat.title || '';
        img.loading = 'lazy';
        photoGroup.appendChild(img);
      });
    }

    var container = section.querySelector('[data-menu-grid]');
    if (!container || !cat.items) return;
    container.className = 'list-grid';
    container.innerHTML = '';

    cat.items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'list-row';
      var priceHtml = item.askInStore
        ? '<span class="list-row-price tbd">' + translations['menu.askInStore'][currentLang] + '</span>'
        : '<span class="list-row-price">' + (item.price || '') + '</span>';
      row.innerHTML =
        '<div class="list-row-line">' +
          '<span class="list-row-name">' + item.name + '</span>' +
          '<span class="list-row-leader" aria-hidden="true"></span>' +
          priceHtml +
        '</div>' +
        (item.desc ? '<p class="list-row-desc">' + item.desc + '</p>' : '');
      container.appendChild(row);
    });

    // optional secondary price list rendered inside the same section, with
    // no jump-nav entry of its own (e.g. the fries topping list under Love
    // Friet) — same CMS-merge-into-translations approach as eyebrow/title
    var subContainer = section.querySelector('[data-menu-sublist]');
    if (subContainer) {
      if (cat.sublist && cat.sublist.items && cat.sublist.items.length) {
        var subKey = 'menu.cat.' + camel + 'SublistHeading';
        if (cat.sublist.heading && translations[subKey]) {
          translations[subKey].de = cat.sublist.heading;
        }
        var headingHtml = translations[subKey] ? translations[subKey][currentLang] : (cat.sublist.heading || '');
        var rowsHtml = cat.sublist.items.map(function (item) {
          var priceHtml = item.price ? '<span class="list-row-price">' + item.price + '</span>' : '';
          return '<div class="list-row">' +
            '<span class="list-row-name">' + item.name + '</span>' +
            priceHtml +
          '</div>';
        }).join('');
        subContainer.innerHTML =
          (headingHtml ? '<p class="menu-sublist-heading">' + headingHtml + '</p>' : '') +
          '<div class="list-grid">' + rowsHtml + '</div>';
      } else {
        subContainer.innerHTML = '';
      }
    }
  }

  function renderMenu(data) {
    if (!data || !data.categories) return;
    data.categories.forEach(renderMenuCategory);
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; });
  }

  function loadContent() {
    return Promise.all([fetchJson('content/site.json'), fetchJson('content/menu.json')])
      .then(function (results) {
        var site = results[0];
        var menu = results[1];
        if (site) {
          applyTextOverrides(site);
          applyImageOverrides(site.images);
        }
        if (menu) {
          // top-level scalars (pageTitle, heroTitle, ...) flow through the
          // same key-matching merge as site.json; `categories` is an array
          // so flattenInto leaves it alone and renderMenu handles it below
          applyTextOverrides(menu);
          renderMenu(menu);
        }
      });
  }

  /* --------------------------------------------------------------- boot */
  function init() {
    applyLang(currentLang);
    initNavToggle();
    initLangToggle();
    initSmoothScroll();
    initMenuJump();
    initValuesCarousel();
    initMenuCarousel();
    initScrollTop();
    initRevealObserver();
    initTodayHighlight();
    initYear();
    fixInitialHashScroll();

    // hero entrance choreography
    requestAnimationFrame(function () {
      document.body.classList.add('is-loaded');
    });

    if (prefersReducedMotion) {
      applyReducedMotionStates();
      if (nav) nav.classList.add('nav--scrolled');
    } else {
      requestAnimationFrame(frame);
    }

  }

  function boot() {
    loadContent().then(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

/**
 * Love Kebab — main.js
 *
 * Engineering rule: every continuous scroll-position-dependent effect
 * (nav chrome, hero image parallax, horizontal
 * process scroll-jack) runs from ONE shared requestAnimationFrame loop that
 * reads window.scrollY once per frame. One-shot reveals use a separate
 * lightweight IntersectionObserver.
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
  var processStackedQuery = window.matchMedia('(max-width: 700px)');

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
    'nav.menuOpen': { de: 'Menü öffnen', en: 'Open menu' },
    'nav.menuClose': { de: 'Menü schließen', en: 'Close menu' },

    'hero.sectionAria': { de: 'Willkommen bei Love Kebab', en: 'Welcome to Love Kebab' },
    'hero.kicker': { de: 'Döner · Wings · Hand-Cut Fries', en: 'Döner · Wings · Hand-Cut Fries' },
    'hero.word0': { de: 'Mit', en: 'Made' },
    'hero.word1': { de: 'Liebe', en: 'with' },
    'hero.word2': { de: 'gemacht.', en: 'love.' },
    'hero.trust1': { de: '100' + HAIRSP + '% frisches Fleisch', en: '100' + HAIRSP + '% Fresh Meat' },

    'place.name': { de: 'Essen-Rüttenscheid', en: 'Essen-Rüttenscheid' },

    'marquee.love': { de: 'Döner mit Liebe', en: 'Döner with Love' },
    'marquee.fresh': { de: '100' + HAIRSP + '% frisch', en: '100' + HAIRSP + '% Fresh' },

    'story.eyebrow': { de: 'Unsere Geschichte', en: 'Our Story' },
    'story.title': { de: 'Döner, wie er<br>sein sollte.', en: 'Döner, the way<br>it should be.' },
    'story.body1': {
      de: 'Bei Love Kebab treffen frische Zutaten auf jahrelange Erfahrung. Mitten in Rüttenscheid schneiden wir jeden Döner auf Bestellung vom Spieß — ehrlich, frisch und mit Liebe zubereitet.',
      en: 'At Love Kebab, fresh ingredients meet years of experience. Right here in Rüttenscheid, we cut every döner fresh off the spit, made to order — honest, fresh, and made with love.'
    },
    'story.stat1': { de: 'Jeden Tag geöffnet', en: 'Open everyday' },
    'story.stat2': { de: 'Frisch', en: 'Fresh' },
    'story.stat3': { de: 'Jahre in Rüttenscheid', en: 'years in Rüttenscheid' },
    'story.photoLabel': { de: 'Foto: Ladeninnenraum', en: 'Photo: Store interior' },
    'story.photoSub': { de: 'Fotos folgen in Kürze', en: 'Photos coming soon' },
    'story.tag': { de: 'Bald verfügbar', en: 'Coming soon' },

    'menu.eyebrow': { de: 'Unsere Klassiker', en: 'Our Classics' },
    'menu.title': { de: 'Frisch für dich<br>zubereitet.', en: 'Freshly made<br>for you.' },
    'menu.photoDoner': { de: 'Foto: Döner Kebab', en: 'Photo: Döner Kebab' },
    'menu.descDoner': { de: 'Der Klassiker im frischen Fladenbrot — direkt vom Spieß.', en: 'The classic in fresh flatbread — straight from the spit.' },
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
    'values.meatDesc': { de: 'Täglich frisch geliefert und mariniert — nie aus der Tiefkühltruhe.', en: 'Delivered and marinated fresh daily — never from the freezer.' },
    'values.sauceDesc': { de: 'Eigene Rezepte, jeden Tag frisch angerührt — das schmeckt man.', en: 'Our own recipes, freshly mixed every day — you can taste it.' },
    'values.loveTitle': { de: 'Mit Liebe gemacht', en: 'Made with Love' },
    'values.loveDesc': { de: 'Jeder Döner wird auf Bestellung geschnitten und mit voller Aufmerksamkeit gebaut.', en: 'Every döner is cut to order and built with full attention.' },
    'values.prev': { de: 'Zurück', en: 'Previous' },
    'values.next': { de: 'Weiter', en: 'Next' },
    'menu.prev': { de: 'Zurück', en: 'Previous' },
    'menu.next': { de: 'Weiter', en: 'Next' },

    'process.ariaLabel': { de: 'Ein Blick in unsere Küche', en: 'A look inside our kitchen' },
    'process.title': { de: 'Ein Blick in unsere Küche', en: 'A look inside our kitchen' },
    'process.eyebrow': { de: 'Galerie', en: 'Gallery' },
    'process.step1': { de: 'Schritt 01', en: 'Step 01' },
    'process.title1': { de: 'Frisches Fleisch', en: 'Fresh Meat' },
    'process.desc1': { de: 'Täglich frisch geliefert — Qualität, die man sieht und schmeckt.', en: 'Delivered fresh daily — quality you can see and taste.' },
    'process.photo1': { de: 'Foto: Frisches Fleisch', en: 'Photo: Fresh Meat' },
    'process.step2': { de: 'Schritt 02', en: 'Step 02' },
    'process.title2': { de: 'Eigene Gewürzmischung', en: 'Our Own Spice Blend' },
    'process.desc2': { de: 'Hausgemachte Marinade nach bewährtem Familienrezept.', en: 'Homemade marinade made from a trusted family recipe.' },
    'process.photo2': { de: 'Foto: Gewürzmischung', en: 'Photo: Spice Blend' },
    'process.step3': { de: 'Schritt 03', en: 'Step 03' },
    'process.title3': { de: 'Langsam gegart am Spieß', en: 'Slow-Roasted on the Spit' },
    'process.desc3': { de: 'Stundenlang am Drehspieß — saftig innen, knusprig außen.', en: 'Hours on the rotisserie — juicy inside, crispy outside.' },
    'process.photo3': { de: 'Foto: Dönerspieß', en: 'Photo: Döner Spit' },
    'process.step4': { de: 'Schritt 04', en: 'Step 04' },
    'process.title4': { de: 'Frisch für dich geschnitten', en: 'Freshly Cut for You' },
    'process.desc4': { de: 'Auf Bestellung geschnitten, frisch belegt und mit Liebe serviert.', en: 'Cut to order, freshly topped, and served with love.' },
    'process.photo4': { de: 'Foto: Frisch geschnitten', en: 'Photo: Freshly Cut' },

    'contact.eyebrow': { de: 'Standort', en: 'Location' },
    'contact.title': { de: 'Besuch uns in<br>Rüttenscheid.', en: 'Visit us in<br>Rüttenscheid.' },
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

    'footer.instagramAria': { de: 'Instagram (folgt)', en: 'Instagram (coming soon)' },
    'footer.tiktokAria': { de: 'TikTok (folgt)', en: 'TikTok (coming soon)' },
    'footer.rights': { de: 'Alle Rechte vorbehalten.', en: 'All rights reserved.' },
    'footer.imprint': { de: 'Impressum', en: 'Imprint' },
    'footer.privacy': { de: 'Datenschutz', en: 'Privacy Policy' },

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
      de: 'Die vollständige Speisekarte von Love Kebab in Essen-Rüttenscheid: Döner & Dürüm, Wings, Fries, Teller, Steinofenpizza, Pide & Lahmacun, Salate, Spezialitäten, Beilagen und Getränke.',
      en: 'The full Love Kebab menu in Essen-Rüttenscheid: Döner & Dürüm, wings, fries, Teller, stone-oven pizza, Pide & Lahmacun, salads, specialties, sides and drinks.'
    },
    'menu.heroTitle': { de: 'Speisekarte', en: 'Menu' },
    'menu.heroSub': { de: 'Alles frisch zubereitet — direkt vom Spieß oder aus dem Steinofen.', en: 'Everything made fresh — straight from the spit or the stone oven.' },

    'menu.jump.kebabDurum': { de: 'Kebab & Dürüm', en: 'Kebab & Dürüm' },
    'menu.jump.wings': { de: 'Wings', en: 'Wings' },
    'menu.jump.fries': { de: 'Fries', en: 'Fries' },
    'menu.jump.teller': { de: 'Teller', en: 'Teller' },
    'menu.jump.pizza': { de: 'Pizza', en: 'Pizza' },
    'menu.jump.pideLahmacun': { de: 'Pide & Lahmacun', en: 'Pide & Lahmacun' },
    'menu.jump.salads': { de: 'Salate', en: 'Salads' },
    'menu.jump.specialties': { de: 'Spezialitäten', en: 'Specialties' },
    'menu.jump.sides': { de: 'Beilagen', en: 'Sides' },
    'menu.jump.drinks': { de: 'Getränke', en: 'Drinks' },

    'menu.cat.kebabDurumEyebrow': { de: 'Frisch vom Spieß', en: 'Fresh off the spit' },
    'menu.cat.kebabDurumTitle': { de: 'Kebab & Dürüm', en: 'Kebab & Dürüm' },
    'menu.cat.wingsEyebrow': { de: 'Frisch frittiert', en: 'Freshly fried' },
    'menu.cat.wingsTitle': { de: 'Wings', en: 'Wings' },
    'menu.cat.friesEyebrow': { de: 'Handgeschnitten', en: 'Hand-cut' },
    'menu.cat.friesTitle': { de: 'Fries', en: 'Fries' },
    'menu.cat.tellerEyebrow': { de: 'Für den großen Hunger', en: 'For the properly hungry' },
    'menu.cat.tellerTitle': { de: 'Teller', en: 'Teller' },
    'menu.cat.pizzaEyebrow': { de: 'Steinofen, Ø 30 cm', en: 'Stone-oven, Ø 30cm' },
    'menu.cat.pizzaTitle': { de: 'Pizza', en: 'Pizza' },
    'menu.cat.pideLahmacunEyebrow': { de: 'Frisch aus dem Steinofen', en: 'Straight from the stone oven' },
    'menu.cat.pideLahmacunTitle': { de: 'Pide & Lahmacun', en: 'Pide & Lahmacun' },
    'menu.cat.saladsEyebrow': { de: 'Leicht, aber nicht klein', en: 'Lighter, still loaded' },
    'menu.cat.saladsTitle': { de: 'Salate', en: 'Salads' },
    'menu.cat.specialtiesEyebrow': { de: 'Hausgemachte Spezialitäten', en: 'Homemade specialties' },
    'menu.cat.specialtiesTitle': { de: 'Spezialitäten', en: 'Specialties' },
    'menu.cat.sidesEyebrow': { de: 'Imbiss', en: 'Extras' },
    'menu.cat.sidesTitle': { de: 'Beilagen', en: 'Sides' },
    'menu.cat.drinksEyebrow': { de: 'Getränke', en: 'Drinks' },
    'menu.cat.drinksTitle': { de: 'Getränke', en: 'Drinks' },

    'menu.item.donerKebap.desc': { de: 'Dönerfleisch im warmen Fladenbrot mit knackigem Salat und Soße nach Wahl.', en: 'Sliced döner meat in warm pita with crisp salad and your choice of sauce.' },
    'menu.item.duerum.desc': { de: 'Dönerfleisch und Salat fest gerollt im weichen Dürüm-Fladen.', en: 'Döner meat and salad rolled tight in a soft dürüm wrap.' },
    'menu.item.falafelTasche.desc': { de: 'Knusprige Kichererbsen-Falafel im Fladenbrot mit frischem Salat und Soße.', en: 'Crispy chickpea falafel tucked into pita with fresh salad and sauce.' },
    'menu.item.sucukTasche.desc': { de: 'Gegrillte türkische Sucuk-Wurst im Fladenbrot mit Salat und Soße.', en: 'Grilled Turkish sucuk sausage in pita with salad and sauce.' },
    'menu.item.salatTasche.desc': { de: 'Fladenbrot gefüllt mit knackigem, gemischtem Salat und Soße nach Wahl.', en: 'Pita packed with crisp mixed salad and your choice of sauce.' },
    'menu.item.pommDoener.desc': { de: 'Dönerfleisch auf knusprigen Pommes mit Salat und Soße.', en: 'Döner meat piled over crispy fries with salad and sauce.' },
    'menu.item.doenerfleischPortion.desc': { de: 'Eine großzügige Portion frisch geschnittenes Dönerfleisch, ohne Brot.', en: 'A generous portion of freshly sliced döner meat, no bread.' },

    'menu.item.loveKebabWings.desc': { de: 'Chicken Wings mariniert in unserer eigenen Gewürzmischung — der Love-Kebab-Klassiker.', en: 'Chicken wings tossed in our own signature marinade — the Love Kebab original.' },
    'menu.item.buffaloWings.desc': { de: 'Knusprige Chicken Wings in scharfer Buffalo-Soße.', en: 'Crispy chicken wings tossed in spicy buffalo sauce.' },
    'menu.item.garlicParmesanWings.desc': { de: 'Chicken Wings in Knoblauch-Butter mit frisch geriebenem Parmesan.', en: 'Chicken wings in garlic butter with freshly grated parmesan.' },
    'menu.item.bbqWings.desc': { de: 'Chicken Wings mit rauchiger BBQ-Glasur.', en: 'Chicken wings with a smoky BBQ glaze.' },

    'menu.item.handCutFries.desc': { de: 'Frisch handgeschnittene Pommes, gesalzen — nie aus der Tiefkühltruhe.', en: 'Fresh hand-cut fries, salted — never from the freezer.' },
    'menu.item.parmesanFries.desc': { de: 'Handgeschnittene Pommes mit Parmesan und frischen Kräutern.', en: 'Hand-cut fries tossed with parmesan and fresh herbs.' },
    'menu.item.loadedFries.desc': { de: 'Handgeschnittene Pommes mit Dönerfleisch, Käse und Soße nach Wahl.', en: 'Hand-cut fries loaded with döner meat, cheese and your choice of sauce.' },

    'menu.item.iskender.desc': { de: 'Dönerfleisch auf Fladenbrot, Tomatensoße, zerlassene Butter und Joghurt.', en: 'Döner meat over pide bread, tomato sauce, melted butter and yoghurt.' },
    'menu.item.doenerTeller.desc': { de: 'Dönerfleisch serviert mit Reis oder Pommes und frischem Salat.', en: 'Döner meat served over rice or fries with fresh salad.' },
    'menu.item.sucukTeller.desc': { de: 'Gegrillte Sucuk-Wurst mit Reis oder Pommes und frischem Salat.', en: 'Grilled sucuk sausage with rice or fries and fresh salad.' },
    'menu.item.falafelTeller.desc': { de: 'Knusprige Falafel mit Reis oder Pommes und frischem Salat.', en: 'Crispy falafel with rice or fries and fresh salad.' },

    'menu.item.pizzaDoenerfleisch.desc': { de: 'Tomatensoße, Mozzarella und frisch geschnittenes Dönerfleisch.', en: 'Tomato sauce, mozzarella and freshly sliced döner meat.' },
    'menu.item.pizzaMargherita.desc': { de: 'Tomatensoße und zerlaufener Mozzarella, direkt aus dem Steinofen.', en: 'Tomato sauce and melted mozzarella, straight from the stone oven.' },
    'menu.item.pizzaFunghi.desc': { de: 'Tomatensoße, Mozzarella und frische Champignons.', en: 'Tomato sauce, mozzarella and fresh mushrooms.' },
    'menu.item.pizzaHawaii.desc': { de: 'Tomatensoße, Mozzarella, Schinken und Ananas.', en: 'Tomato sauce, mozzarella, ham and pineapple.' },
    'menu.item.pizzaVegetarisch.desc': { de: 'Tomatensoße, Mozzarella und eine Mischung aus frischem Gemüse.', en: 'Tomato sauce, mozzarella and a mix of fresh vegetables.' },
    'menu.item.pizzaSalami.desc': { de: 'Tomatensoße, Mozzarella und würzige Salami.', en: 'Tomato sauce, mozzarella and spicy salami.' },
    'menu.item.pizzaTonno.desc': { de: 'Tomatensoße, Mozzarella, Thunfisch und Zwiebeln.', en: 'Tomato sauce, mozzarella, tuna and onion.' },
    'menu.item.pizzaSucuk.desc': { de: 'Tomatensoße, Mozzarella und gegrillte türkische Sucuk-Wurst.', en: 'Tomato sauce, mozzarella and grilled Turkish sucuk sausage.' },

    'menu.item.lahmacunFleischSalat.desc': { de: 'Lahmacun beladen mit extra Dönerfleisch und frischem Salat.', en: 'Lahmacun loaded with extra döner meat and fresh salad.' },
    'menu.item.lahmacun.desc': { de: 'Dünner türkischer Fladen mit würzigem Hackfleisch, frisch gebacken.', en: 'Thin Turkish flatbread topped with spiced minced meat, baked to order.' },
    'menu.item.lahmacunSalat.desc': { de: 'Klassischer Lahmacun gerollt mit knackigem, frischem Salat.', en: 'Classic lahmacun rolled with crisp fresh salad.' },
    'menu.item.kiymaliPide.desc': { de: 'Schiffchen-Pide belegt mit würzigem Hackfleisch und Käse.', en: 'Boat-shaped pide topped with spiced minced meat and cheese.' },
    'menu.item.peynirliPide.desc': { de: 'Schiffchen-Pide beladen mit geschmolzenem türkischem Käse.', en: 'Boat-shaped pide loaded with melted Turkish cheese.' },
    'menu.item.sucukPide.desc': { de: 'Schiffchen-Pide mit gegrillter Sucuk-Wurst und Käse.', en: 'Boat-shaped pide topped with grilled sucuk sausage and cheese.' },
    'menu.item.doenerliPide.desc': { de: 'Schiffchen-Pide mit Dönerfleisch und zerlaufenem Käse.', en: 'Boat-shaped pide topped with döner meat and melted cheese.' },
    'menu.item.vegetariaPide.desc': { de: 'Schiffchen-Pide mit Spinat, Käse und frischem Gemüse.', en: 'Boat-shaped pide topped with spinach, cheese and fresh vegetables.' },

    'menu.item.doenersalat.desc': { de: 'Gemischter Salat mit warmem, frisch geschnittenem Dönerfleisch.', en: 'Mixed salad topped with warm, freshly sliced döner meat.' },
    'menu.item.gemischterSalat.desc': { de: 'Knackiger gemischter Salat mit leichtem Haus-Dressing.', en: 'Crisp mixed salad with a light house dressing.' },
    'menu.item.thunfischsalat.desc': { de: 'Gemischter Salat mit Thunfisch und Zwiebeln.', en: 'Mixed salad topped with tuna and onion.' },
    'menu.item.gemischterSalatFalafel.desc': { de: 'Gemischter Salat mit knuspriger Falafel.', en: 'Mixed salad topped with crispy falafel.' },
    'menu.item.gemischterSalatGemuese.desc': { de: 'Gemischter Salat mit in der Pfanne gebratenem Saisongemüse.', en: 'Mixed salad topped with pan-fried seasonal vegetables.' },

    'menu.item.luxusVorspeisenteller.desc': { de: 'Ein großzügiger Teller zum Teilen mit unseren besten hausgemachten Vorspeisen.', en: 'A generous sharing plate of our best homemade starters.' },
    'menu.item.blaetterteigrollen.desc': { de: 'Knusprige hausgemachte Blätterteigrollen, gefüllt und frisch frittiert.', en: 'Crispy homemade pastry rolls, filled and fried to order.' },
    'menu.item.weisskaeseteller.desc': { de: 'Türkischer Weißkäse goldbraun überbacken.', en: 'Turkish white cheese baked until golden and bubbling.' },

    'menu.askInStore': { de: 'Bitte im Laden fragen', en: 'Ask in store' }
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
  var processSection = document.getElementById('process');
  var processTrack = document.getElementById('process-track');
  var processSteps = processTrack ? processTrack.querySelectorAll('.process-step') : [];
  var processDots = document.querySelectorAll('.process-dot');
  var processBarFill = document.getElementById('process-bar-fill');
  var scrollTopBtn = document.getElementById('scroll-top');
  var navToggle = document.querySelector('.nav-toggle');
  var navOverlay = document.getElementById('navOverlay');
  var navOverlayClose = document.querySelector('.nav-overlay-close');

  /* --------------------------------------------------- measured layout */
  var processMax = 0;      // max horizontal translate in px
  var stepCount = processSteps.length;

  /* mobile: duplicate the steps once so the CSS loop (translateX(-50%))
     wraps seamlessly — clones are aria-hidden, originals stay the single
     source of truth for screen readers */
  function updateProcessCarousel() {
    if (!processTrack) return;
    var clones = processTrack.querySelectorAll('.process-step--clone');
    if (processStackedQuery.matches && !prefersReducedMotion) {
      if (!clones.length) {
        processSteps.forEach(function (step) {
          var clone = step.cloneNode(true);
          clone.classList.add('process-step--clone');
          clone.setAttribute('aria-hidden', 'true');
          processTrack.appendChild(clone);
        });
      }
    } else if (clones.length) {
      clones.forEach(function (c) { c.remove(); });
    }
  }

  function measure() {
    if (processTrack && processSection && !processStackedQuery.matches) {
      // center the first / last card in the viewport
      var vw = document.documentElement.clientWidth;
      var stepW = processSteps.length ? processSteps[0].offsetWidth : 0;
      var pad = Math.max((vw - stepW) / 2, 20);
      processTrack.style.paddingLeft = pad + 'px';
      processTrack.style.paddingRight = pad + 'px';
      processMax = Math.max(0, processTrack.scrollWidth - vw);
    } else {
      processMax = 0;
      if (processTrack) {
        processTrack.style.paddingLeft = '';
        processTrack.style.paddingRight = '';
      }
    }
  }

  /* --------------------------------------------- shared RAF scroll loop */
  var lastNavScrolled = null;
  var lastActiveStep = -1;

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

      /* process: vertical scroll → horizontal travel */
      if (processSection && processTrack && processMax > 0) {
        var rect = processSection.getBoundingClientRect();
        var runway = rect.height - vh;
        if (runway > 0) {
          var p = clamp01(-rect.top / runway);
          var x = p * processMax;
          processTrack.style.transform = 'translate3d(' + (-x).toFixed(2) + 'px, 0, 0)';

          var active = Math.min(stepCount - 1, Math.round(p * (stepCount - 1)));
          if (active !== lastActiveStep) {
            lastActiveStep = active;
            processDots.forEach(function (dot, i) {
              dot.classList.toggle('active', i === active);
            });
            processSteps.forEach(function (step, i) {
              step.classList.toggle('is-active', i === active);
            });
          }
          if (processBarFill) {
            processBarFill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
          }
        }
      }
    }

    requestAnimationFrame(frame);
  }

  /* --------------------------------------- reduced motion: final states */
  function applyReducedMotionStates() {
    if (processTrack) processTrack.style.transform = 'none';
    processSteps.forEach(function (s) { s.classList.add('is-active'); });
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

  function buildCarouselArrow(direction, i18nKey) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'menu-arrow menu-arrow--' + direction;
    btn.setAttribute('data-i18n-aria', i18nKey);
    var label = translations[i18nKey];
    btn.setAttribute('aria-label', label ? label[currentLang] : direction);
    btn.innerHTML = direction === 'prev'
      ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
    return btn;
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

  /* --------------------------- menu.html: per-category swipe/arrow carousels */
  function initCategoryCarousels() {
    document.querySelectorAll('.menu-cat .product-grid').forEach(function (grid) {
      var wrapper = document.createElement('div');
      wrapper.className = 'menu-carousel';
      grid.parentNode.insertBefore(wrapper, grid);
      var prevBtn = buildCarouselArrow('prev', 'menu.prev');
      var nextBtn = buildCarouselArrow('next', 'menu.next');
      wrapper.appendChild(prevBtn);
      wrapper.appendChild(grid);
      wrapper.appendChild(nextBtn);
      setupCarousel(grid, prevBtn, nextBtn, '.product-card', 700);
    });
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

  /* --------------------------------------------------------------- boot */
  function init() {
    applyLang(currentLang);
    updateProcessCarousel();
    measure();
    initNavToggle();
    initLangToggle();
    initSmoothScroll();
    initMenuJump();
    initValuesCarousel();
    initMenuCarousel();
    initCategoryCarousels();
    initScrollTop();
    initRevealObserver();
    initTodayHighlight();
    initYear();

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

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        updateProcessCarousel();
        measure();
      }, 150);
    });
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

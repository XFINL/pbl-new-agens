let currentLang = 'cn';

function applyLanguage(lang) {
  currentLang = lang;
  const t = translations[lang];
  if (!t) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  const langTrigger = document.querySelector('.lang-trigger');
  if (langTrigger) langTrigger.textContent = t.nav_lang;

  document.querySelectorAll('.lang-item').forEach(el => {
    const lk = el.dataset.lang;
    if (lk && translations[lang][`lang_${lk}`] !== undefined) {
      el.textContent = translations[lang][`lang_${lk}`];
    }
  });

  document.querySelectorAll('.lang-item').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });

  document.querySelectorAll('.md-toolbar-btn').forEach(btn => {
    const cmd = btn.dataset.cmd;
    if (cmd && t.toolbar[cmd]) btn.title = t.toolbar[cmd];
  });

  const submitBtn = document.querySelector('.submit-btn');
  if (submitBtn && submitBtn.style.pointerEvents !== 'none') {
    submitBtn.textContent = t.submit;
  }

  localStorage.setItem('support_lang', lang);
}

const langWrapper = document.getElementById('langWrapper');
const langTrigger = langWrapper.querySelector('.lang-trigger');
langTrigger.addEventListener('click', function(e) {
  e.stopPropagation();
  langWrapper.classList.toggle('open');
});
document.addEventListener('click', function(e) {
  if (!langWrapper.contains(e.target)) langWrapper.classList.remove('open');
});

document.querySelectorAll('.lang-item').forEach(item => {
  item.addEventListener('click', function() {
    const lang = this.dataset.lang;
    if (lang) applyLanguage(lang);
    langWrapper.classList.remove('open');
  });
});

const savedLang = localStorage.getItem('support_lang') || 'cn';
applyLanguage(savedLang);
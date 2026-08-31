const navItems = document.querySelectorAll('.nav-item:not(.lang-wrapper)');
navItems.forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

const customSelect = document.getElementById('customSelect');
const trigger = customSelect.querySelector('.custom-select-trigger');
const triggerText = trigger.querySelector('.trigger-text');
const dropdown = customSelect.querySelector('.custom-select-dropdown');
const options = dropdown.querySelectorAll('.custom-select-option');
const nativeSelect = customSelect.querySelector('.native-select');
let isOpen = false;
function toggleDropdown(e) { if (e) e.stopPropagation(); isOpen ? closeDropdown() : openDropdown(); }
function openDropdown() { isOpen = true; customSelect.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); }
function closeDropdown() { isOpen = false; customSelect.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); }
function selectOption(option) {
  options.forEach(opt => opt.classList.remove('selected'));
  if (option.dataset.value) {
    option.classList.add('selected');
    const langKey = `select_${option.dataset.value}`;
    triggerText.textContent = (translations[currentLang] && translations[currentLang][langKey]) || option.textContent;
    triggerText.style.color = '#1a1a1a';
    customSelect.classList.add('has-value');
    nativeSelect.value = option.dataset.value;
  } else {
    triggerText.textContent = translations[currentLang].select_placeholder;
    triggerText.style.color = '';
    customSelect.classList.remove('has-value');
    nativeSelect.value = '';
  }
  closeDropdown();
}
trigger.addEventListener('click', toggleDropdown);
options.forEach(opt => {
  opt.addEventListener('click', function(e) {
    e.stopPropagation();
    if (this.classList.contains('placeholder')) { closeDropdown(); return; }
    selectOption(this);
  });
});
document.addEventListener('click', function(e) { if (!customSelect.contains(e.target)) closeDropdown(); });
trigger.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
  if (e.key === 'Escape') closeDropdown();
});

const mdEditor = document.getElementById('mdEditor');
const mdTextarea = mdEditor.querySelector('.md-textarea');
const mdPreview = mdEditor.querySelector('.md-preview');
const mdTabs = mdEditor.querySelectorAll('.md-tab');
const toolbarBtns = mdEditor.querySelectorAll('.md-toolbar-btn');

function renderMarkdown(text) {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:4px 0">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g, '').replace(/<p><br><\/p>/g, '');
  html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
  html = html.replace(/<p><blockquote>/g, '<blockquote>').replace(/<\/blockquote><\/p>/g, '</blockquote>');
  html = html.replace(/<p><h/g, '<h').replace(/<\/h[1-3]><\/p>/g, '');
  html = html.replace(/<p><pre>/g, '<pre>').replace(/<\/pre><\/p>/g, '</pre>');
  return html;
}

function updatePreview() { mdPreview.innerHTML = renderMarkdown(mdTextarea.value); }

mdTextarea.addEventListener('input', updatePreview);

mdTabs.forEach(tab => {
  tab.addEventListener('click', function() {
    mdTabs.forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    const target = this.dataset.tab;
    if (target === 'edit') {
      mdTextarea.classList.remove('hidden');
      mdPreview.classList.remove('active');
    } else {
      mdTextarea.classList.add('hidden');
      mdPreview.classList.add('active');
      updatePreview();
    }
  });
});

toolbarBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    const cmd = this.dataset.cmd;
    const ta = mdTextarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    let insert = '', cursorOffset = 0;

    switch (cmd) {
      case 'bold':
        insert = `**${selected || '**'}**`;
        cursorOffset = selected ? 0 : 2;
        break;
      case 'italic':
        insert = `*${selected || '*'}*`;
        cursorOffset = selected ? 0 : 1;
        break;
      case 'heading':
        insert = '\n## ' + (selected || '') + '\n';
        cursorOffset = selected ? 0 : -1;
        break;
      case 'list':
        insert = '\n- ' + (selected || '');
        cursorOffset = 0;
        break;
      case 'link':
        insert = (selected ? `[${selected}](url)` : '[](url)');
        cursorOffset = selected ? -4 : -1;
        break;
      case 'code':
        insert = selected ? '`' + selected + '`' : '``';
        cursorOffset = selected ? 1 : 1;
        break;
      case 'image':
        insert = (selected ? `![${selected}](url)` : '![](url)');
        cursorOffset = selected ? -4 : -1;
        break;
    }

    if (insert) {
      const newVal = ta.value.substring(0, start) + insert + ta.value.substring(end);
      ta.value = newVal;
      const pos = start + insert.length + cursorOffset;
      ta.setSelectionRange(pos, pos);
      ta.focus();
      ta.dispatchEvent(new Event('input'));
    }
  });
});

const form = document.getElementById('supportForm');
form.addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('.submit-btn');
  const t = translations[currentLang];
  btn.textContent = t.submitting;
  btn.style.pointerEvents = 'none';
  setTimeout(() => {
    btn.textContent = t.submitted;
    setTimeout(() => {
      btn.textContent = t.submit;
      btn.style.pointerEvents = '';
    }, 2000);
  }, 1000);
});
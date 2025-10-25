// Config — update for your deployment
const DOCS_URL = 'docs/1.%20introduction.html'; // Or your GitBook URL
const GITHUB_URL = 'https://github.com/your-org/synledger'; // Your repo URL

// Wire links
for (const id of ['docs-link','docs-link-footer','get-started']) {
  const el = document.getElementById(id);
  if (el) { el.setAttribute('href', DOCS_URL); }
}
for (const id of ['github-link','github-link-footer']) {
  const el = document.getElementById(id);
  if (el) { el.setAttribute('href', GITHUB_URL); }
}

// Theme toggle
const root = document.documentElement;
const stored = localStorage.getItem('theme');
if (stored === 'light') root.classList.add('light');
const btn = document.getElementById('theme-toggle');
function setIcon(){ if (btn) btn.textContent = root.classList.contains('light') ? '🌚' : '🌙'; }
setIcon();
btn && btn.addEventListener('click', ()=>{
  root.classList.toggle('light');
  localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  setIcon();
});

// Year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Book a call
function book(email){
  const subject = encodeURIComponent('Intro call — SynLedger');
  const body = encodeURIComponent('Hi,\n\nI would like to schedule a 20–30 min intro call.\nMy time zone: ____.\nTopics: ____.\n\nThanks!');
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}
document.getElementById('cal-israel')?.addEventListener('click', (e)=>{ e.preventDefault(); book('israel@synledger.xyz'); });
document.getElementById('cal-cofounder')?.addEventListener('click', (e)=>{ e.preventDefault(); book('founders@synledger.xyz'); });

// Section reveal
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

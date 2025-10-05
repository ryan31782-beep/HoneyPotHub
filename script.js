// Tiny static 'CMS' powered by offers.json
const state = {
  cat: 'all',
  query: '',
  showCodes: true,
  onlyFeatured: false,
  utm: { source: 'hph', medium: 'affiliate', campaign: '' }
};

const els = {
  pills: [], grid: null, empty: null, search: null, showCodes: null, onlyFeatured: null
};

function badge(label, cls=''){ return `<span class="badge ${cls}">${label}</span>`; }

function linkWithUTM(url, campaign){
  try{
    const u = new URL(url);
    u.searchParams.set('utm_source', state.utm.source);
    u.searchParams.set('utm_medium', state.utm.medium);
    if(campaign) u.searchParams.set('utm_campaign', campaign);
    return u.toString();
  }catch(_){ return url; }
}

function render(off){ 
  els.grid.innerHTML = '';
  const q = state.query.toLowerCase();
  const campaign = state.cat==='all' ? 'all' : state.cat;
  const filtered = off.filter(o => {
    if(state.cat!=='all' && !o.categories.includes(state.cat)) return false;
    if(state.onlyFeatured && !o.featured) return false;
    if(q && !(o.name+o.description+(o.code||'')).toLowerCase().includes(q)) return false;
    return true;
  });
  if(!filtered.length){ els.empty.classList.remove('hidden'); return; }
  els.empty.classList.add('hidden');

  for(const o of filtered){
    const url = linkWithUTM(o.url, campaign);
    const code = o.code ? `<div class="code" aria-label="Discount code">${o.code}</div>` : '';
    const btnCopy = (o.code && state.showCodes) ? `<button class="btn copy" data-code="${o.code}">Copy code</button>` : '';
    const cats = o.categories.map(c => badge(c)).join('');
    const feat = o.featured ? badge('featured','featured') : '';
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="badges">${cats}${feat}</div>
      <h3>${o.name}</h3>
      <p>${o.description}</p>
      ${state.showCodes && code ? code : ''}
      <div class="actions">
        <a class="btn primary" href="${url}" target="_blank" rel="nofollow sponsored noopener">Get deal</a>
        ${btnCopy}
      </div>
    `;
    els.grid.appendChild(card);
  }
}

async function init(){
  els.grid = document.getElementById('grid');
  els.empty = document.getElementById('empty');
  els.search = document.getElementById('search');
  els.showCodes = document.getElementById('show-codes');
  els.onlyFeatured = document.getElementById('only-featured');
  document.getElementById('year').textContent = new Date().getFullYear();

  // nav pills
  document.querySelectorAll('nav a.pill').forEach(p => {
    els.pills.push(p);
    p.addEventListener('click', e => {
      e.preventDefault();
      els.pills.forEach(x=>x.classList.remove('pill-active'));
      p.classList.add('pill-active');
      state.cat = p.dataset.cat;
      render(window._offers || []);
    });
  });

  els.search.addEventListener('input', () => { state.query = els.search.value; render(window._offers||[]); });
  els.showCodes.addEventListener('change', () => { state.showCodes = els.showCodes.checked; render(window._offers||[]); });
  els.onlyFeatured.addEventListener('change', () => { state.onlyFeatured = els.onlyFeatured.checked; render(window._offers||[]); });

  // Copy buttons (event delegation)
  document.body.addEventListener('click', (e)=>{
    const btn = e.target.closest('button.btn.copy');
    if(!btn) return;
    const code = btn.dataset.code;
    navigator.clipboard.writeText(code).then(()=>{
      const prev = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(()=>btn.textContent=prev, 1000);
    });
  });

  const res = await fetch('offers.json');
  const offers = await res.json();
  window._offers = offers;
  render(offers);
}

init();

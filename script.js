const $ = (s) => document.querySelector(s);

const CATS = [
  { nome: 'Abaixo do peso',     faixa: '< 18,5',      max: 18.5,     cor: '--c1' },
  { nome: 'Peso normal',        faixa: '18,5 a 24,9', max: 25,       cor: '--c2' },
  { nome: 'Sobrepeso',          faixa: '25 a 29,9',   max: 30,       cor: '--c3' },
  { nome: 'Obesidade grau I',   faixa: '30 a 34,9',   max: 35,       cor: '--c4' },
  { nome: 'Obesidade grau II',  faixa: '35 a 39,9',   max: 40,       cor: '--c5' },
  { nome: 'Obesidade grau III', faixa: '≥ 40',        max: Infinity, cor: '--c6' },
];
const LIMITES = [15, 18.5, 25, 30, 35, 40, 45]; // cada faixa ocupa 1/6 do medidor
const CHAVE = 'imc-historico';

const fmt = (v, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const categoria = (imc) => CATS.find((c) => imc < c.max);

function angulo(imc) {
  const x = Math.min(Math.max(imc, 15), 44.99);
  const i = LIMITES.findIndex((l, k) => x < LIMITES[k + 1]);
  const t = (i + (x - LIMITES[i]) / (LIMITES[i + 1] - LIMITES[i])) / 6;
  return -90 + t * 180;
}

function ler() {
  const w = parseFloat($('#wN').value);
  const h = parseFloat($('#hN').value);
  const ok = w >= 20 && w <= 400 && h >= 80 && h <= 250;
  return { w, h, ok };
}

function atualizar() {
  const { w, h, ok } = ler();
  const res = $('#result');
  $('#save').disabled = !ok;
  res.classList.toggle('off', !ok);
  $('#err').textContent = ok ? '' : 'Informe peso entre 20 e 400 kg e altura entre 80 e 250 cm.';
  if (!ok) return;

  const m = h / 100;
  const imc = w / (m * m);
  const cat = categoria(imc);
  const min = 18.5 * m * m;
  const max = 24.9 * m * m;

  $('#val').textContent = fmt(imc);
  $('#cat').textContent = cat.nome;
  $('#cat').style.color = `var(${cat.cor})`;
  $('#needle').style.setProperty('--a', `${angulo(imc)}deg`);

  let meta;
  if (w < min) meta = `Faltam ${fmt(min - w)} kg para entrar na faixa normal (${fmt(min)} a ${fmt(max)} kg para ${fmt(h, 0)} cm).`;
  else if (w > max) meta = `Estão ${fmt(w - max)} kg acima da faixa normal (${fmt(min)} a ${fmt(max)} kg para ${fmt(h, 0)} cm).`;
  else meta = `Seu peso está dentro da faixa normal para ${fmt(h, 0)} cm (${fmt(min)} a ${fmt(max)} kg).`;
  $('#goal').textContent = meta;

  $('#legend').innerHTML = CATS.map(
    (c) => `<li style="--dot:var(${c.cor})" class="${c === cat ? 'on' : ''}">${c.nome}<span>${c.faixa}</span></li>`
  ).join('');
}

// --- sincroniza campo numérico e controle deslizante ---
function ligar(k) {
  const n = $(`#${k}N`), r = $(`#${k}R`);
  n.addEventListener('input', () => { if (n.value !== '') r.value = n.value; atualizar(); });
  r.addEventListener('input', () => { n.value = r.value; atualizar(); });
}
ligar('w');
ligar('h');

// --- histórico (localStorage com proteção contra falhas) ---
function carregar() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; }
}
function gravar(lista) {
  try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch { /* sem armazenamento: segue sem salvar */ }
}
function desenharHistorico() {
  const lista = carregar();
  $('#clear').hidden = lista.length === 0;
  $('#hist').innerHTML = lista.length
    ? lista.map((r) => `<li style="--dot:var(${categoria(r.imc).cor})"><i></i>${r.data} · ${fmt(r.w)} kg, ${fmt(r.h, 0)} cm<b>${fmt(r.imc)}</b></li>`).join('')
    : '<li class="empty">Nenhuma medição salva ainda.</li>';
}

$('#save').addEventListener('click', () => {
  const { w, h, ok } = ler();
  if (!ok) return;
  const imc = w / ((h / 100) ** 2);
  const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  gravar([{ data, w, h, imc }, ...carregar()].slice(0, 8));
  desenharHistorico();
});
$('#clear').addEventListener('click', () => { gravar([]); desenharHistorico(); });

atualizar();
desenharHistorico();

// 구글 시트 CSV(요약 + 지출 상세)를 받아 비밀번호로 암호화한 data.enc 를 만든다.
// 필수 환경변수: SHEET_CSV_URL, DASH_PASSWORD
// 선택 환경변수: SHEET_DETAIL_CSV_URL  (지출가계부 탭 게시 CSV — 없으면 상세 내역 기능만 꺼짐)
import { webcrypto as wc } from 'node:crypto';
import fs from 'node:fs';

const url    = process.env.SHEET_CSV_URL;
const detUrl = process.env.SHEET_DETAIL_CSV_URL;
const pw     = process.env.DASH_PASSWORD;
if (!url || !pw) { console.error('SHEET_CSV_URL / DASH_PASSWORD 시크릿이 설정되지 않았습니다.'); process.exit(1); }

// 실명 → 가명 (암호를 풀어도 실명이 남지 않도록 여기서 한 번 더 치환)
const _u = x => Buffer.from(x, 'base64').toString('utf8');
const _K = ['7Jqp7ZmU','66+87JWE','7J6s7J2A'].map(_u), _V = ['6r+A6r+A','66eQ67KM','7Ke464uI'].map(_u);
const NAMES = Object.fromEntries(_K.map((k, i) => [k, _V[i]]));
const _RE = new RegExp(_K.join('|'), 'g');
const alias = s => s.replace(_RE, k => NAMES[k]);

async function get(u, label) {
  const r = await fetch(u, { redirect:'follow' });
  if (!r.ok) throw new Error(label + ' 읽기 실패: HTTP ' + r.status);
  return alias(await r.text());
}

const main = await get(url, '요약 시트');
if (!main.includes('#META')) {
  console.error('CSV 형식이 예상과 다릅니다. 게시 대상이 대시보드데이터 탭인지 확인하세요.');
  process.exit(1);
}

let payload = main;
if (detUrl) {
  try {
    const det = await get(detUrl, '지출가계부 시트');
    payload += '\n#=====DETAIL=====\n' + det;
    console.log('지출 상세 포함: ' + det.length + '자');
  } catch (e) {
    console.warn('지출 상세를 건너뜁니다 — ' + e.message);
  }
}

const salt = wc.getRandomValues(new Uint8Array(16));
const iv   = wc.getRandomValues(new Uint8Array(12));
const km   = await wc.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
const key  = await wc.subtle.deriveKey(
  { name:'PBKDF2', salt, iterations:250000, hash:'SHA-256' },
  km, { name:'AES-GCM', length:256 }, false, ['encrypt']);
const ct = new Uint8Array(await wc.subtle.encrypt({ name:'AES-GCM', iv }, key, new TextEncoder().encode(payload)));

fs.mkdirSync('site', { recursive:true });
fs.copyFileSync('index.html', 'site/index.html');
fs.writeFileSync('site/robots.txt', 'User-agent: *\nDisallow: /\n');
fs.writeFileSync('site/.nojekyll', '');
fs.writeFileSync('site/data.enc', Buffer.concat([Buffer.from(salt), Buffer.from(iv), Buffer.from(ct)]));
console.log('완료: ' + payload.length + '자 암호화 → site/data.enc');

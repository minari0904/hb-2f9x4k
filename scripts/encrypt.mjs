// 구글 시트 CSV(요약 + 지출 상세)를 받아 비밀번호로 암호화한 data.enc 를 만든다.
// 필수 환경변수: SHEET_CSV_URL, DASH_PASSWORD
// 선택 환경변수:
//   SHEET_DETAIL_CSV_URL  지출가계부 탭 게시 CSV (없으면 상세 내역 기능만 꺼짐)
//   NAME_MAP              실명→가명 치환표. "실명1=꿀꿀,실명2=말벌,실명3=째니"
//                         저장소가 공개라 코드에 실명을 두지 않는다. 없으면 치환 없이 진행.
import { webcrypto as wc } from 'node:crypto';
import fs from 'node:fs';

const url    = process.env.SHEET_CSV_URL;
const detUrl = process.env.SHEET_DETAIL_CSV_URL;
const pw     = process.env.DASH_PASSWORD;
if (!url || !pw) { console.error('SHEET_CSV_URL / DASH_PASSWORD 시크릿이 설정되지 않았습니다.'); process.exit(1); }

const pairs = (process.env.NAME_MAP || '')
  .split(',').map(s => s.split('=')).filter(a => a.length === 2 && a[0].trim() && a[1].trim())
  .map(([a, b]) => [a.trim(), b.trim()]);
if (!pairs.length) console.warn('! NAME_MAP이 없어 이름 치환을 건너뜁니다.');
const alias = s => pairs.reduce((acc, [real, fake]) => acc.split(real).join(fake), s);

async function get(u, label) {
  const r = await fetch(u, { redirect: 'follow' });
  if (!r.ok) throw new Error(label + ' 읽기 실패: HTTP ' + r.status);
  return alias(await r.text());
}

const main = await get(url, '요약 시트');
if (!main.includes('#META')) {
  console.error('CSV 형식이 예상과 다릅니다. 게시 대상이 대시보드데이터 탭인지 확인하세요.');
  process.exit(1);
}
if (/#(REF|VALUE|NAME|DIV\/0|N\/A|ERROR)/.test(main)) {
  console.warn('! 시트에 계산 오류가 있습니다. 대시보드 상단에 경고가 표시됩니다. docs/operations.md 참고.');
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
  { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
  km, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await wc.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(payload)));

fs.mkdirSync('site', { recursive: true });
fs.copyFileSync('index.html', 'site/index.html');
fs.writeFileSync('site/robots.txt', 'User-agent: *\nDisallow: /\n');
fs.writeFileSync('site/.nojekyll', '');
fs.writeFileSync('site/data.enc', Buffer.concat([Buffer.from(salt), Buffer.from(iv), Buffer.from(ct)]));
console.log('완료: ' + payload.length + '자 암호화 → site/data.enc');

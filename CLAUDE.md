# 꿀벌이네 자산가계부 대시보드

구글 스프레드시트로 관리하는 가계부를 읽어, **비밀번호로 잠긴 웹 대시보드**로 보여주는 프로젝트.
부부 2인이 링크로 공유해서 본다.

> **사용자는 비개발자다.** 코드 이야기보다 "어느 셀에 무엇을 넣으세요", "어느 버튼을 누르세요"
> 수준으로 안내해야 한다. 터미널 명령을 시킬 때는 복사해서 붙여넣을 수 있는 한 줄로 준다.

---

## 1. 전체 구조

```
구글 시트 (2026_자산가계부)
  ├─ 원본 탭      요약(재무제표) · 예결산관리 · 자산관리 · 지출가계부 · 로드맵 · History · 메모장
  │               └ 사용자가 매월 25일에 직접 정리하는 곳. 건드리지 않는다.
  ├─ 대시보드데이터  원본 탭을 수식으로 읽어 평평한 표로 만든 탭. ★웹에 게시(CSV)★
  ├─ 지출가계부     개별 거래 내역. ★웹에 게시(CSV)★ (항목 클릭 시 상세 내역용)
  ├─ 변동사유(자산)  자산·부채 항목 변동 사유. 사용자가 직접 입력
  └─ 포트폴리오상세  종목별 수량·평단가. GOOGLEFINANCE로 시세 자동 조회
        │
        ▼  GitHub Actions (매일 06:00 KST · main 푸시 · 수동 실행)
   scripts/encrypt.mjs
        CSV 2개 fetch → 실명→가명 치환 → AES-GCM 암호화 → site/data.enc
        │
        ▼  GitHub Pages
   index.html + data.enc      브라우저에서 비밀번호 입력 → 복호화 → 렌더
```

**핵심 성질**: 시트를 고치면 다음 갱신 때 대시보드가 따라온다. **시트를 다시 "웹에 게시"할 필요는 없다.**
게시 주소는 한 번 만들면 계속 살아있고 내용만 바뀐다.

---

## 2. 파일 지도

| 경로 | 무엇 |
|---|---|
| `index.html` | 대시보드 전체. HTML+CSS+JS 단일 파일, 외부 의존성 0 |
| `scripts/encrypt.mjs` | 시트 CSV를 받아 암호화 |
| `.github/workflows/update.yml` | 자동 갱신 워크플로 |
| `docs/sheet-spec.md` | **대시보드데이터 탭의 셀 단위 명세.** 수식이 깨졌을 때 여기를 본다 |
| `docs/dashboard-spec.md` | index.html 내부 구조, 함수 지도, 디자인 규칙 |
| `docs/operations.md` | 매월 루틴 · 배포 · 트러블슈팅 기록 |
| `docs/prompts.md` | 자주 쓰는 작업 요청 문구 모음 |
| `tools/gen_dashboard_tab.py` | `대시보드데이터` 탭을 통째로 다시 만드는 생성기 |
| `LOCAL.md` | 시트 ID·주소·가명 매핑 등 **비공개 정보** (git 제외됨) |

---

## 3. 절대 규칙

1. **이 저장소는 공개(Public)다.** 아래를 커밋하지 않는다.
   - 실명(사용자 본인·배우자·자녀), 구글 시트 ID나 게시 URL, 실제 금액, 비밀번호
   - 필요한 값은 전부 `LOCAL.md`(git 제외) 또는 GitHub Secrets에 둔다.
2. **`대시보드데이터` 탭은 수식 전용이다.** 사람이 값을 직접 입력하지 않는다.
3. **원본 탭에서 셀을 잘라내기·삭제하지 않는다.** `대시보드데이터`가 직접 셀 주소로 참조하므로
   셀이 밀리면 `#REF!`가 난다. 값을 지울 때는 `Delete` 키(내용만 삭제)를 쓴다.
4. 차트·색상·대시보드 UI를 건드릴 때는 **`dataviz` 스킬을 먼저 읽는다.** 팔레트는 검증된 값이라
   임의로 바꾸지 않는다. (`docs/dashboard-spec.md` § 디자인 규칙)
5. `site/`, `data.enc`, `node_modules/` 는 커밋하지 않는다(`.gitignore`에 있음).

---

## 4. 자주 하는 작업

### 대시보드 화면을 고칠 때
`index.html` 하나만 고치면 된다. 고친 뒤 로컬 확인 → 커밋 → 푸시하면 자동 재배포된다.

```bash
# 로컬 미리보기 (mode를 csv로 바꾼 사본을 만들어 띄운다)
python -m http.server 8899
```
`index.html`의 `CONFIG.mode`를 `'csv'`로, `csvUrl`에 게시 CSV 주소를 넣으면 암호화 없이 바로 본다.
**커밋 전에 반드시 `mode: 'encrypted'`로 되돌린다.**

### 시트 구조가 바뀌었을 때
`docs/sheet-spec.md`의 매핑 표를 먼저 고치고, `tools/gen_dashboard_tab.py`를 수정해
탭을 다시 만들어 시트에 가져오기 한다.

### 배포 / 재갱신
```bash
git add -A && git commit -m "설명" && git push
```
푸시하면 워크플로가 자동 실행된다. 코드 변경 없이 데이터만 다시 읽고 싶으면
GitHub → Actions → `대시보드 갱신` → **Run workflow**.

---

## 5. 빠른 트러블슈팅

| 증상 | 먼저 볼 곳 |
|---|---|
| 특정 월 숫자가 실제보다 작다 | 대시보드 상단 빨간 경고 박스 → `docs/operations.md` § #REF! 복구 |
| 화면이 안 뜨고 "불러오지 못했습니다" | Actions 로그, `SHEET_CSV_URL` 오타 |
| 비밀번호가 안 먹음 | `DASH_PASSWORD` 바꾼 뒤 Run workflow를 안 돌렸을 가능성 |
| 항목 클릭해도 상세 내역이 없음 | `SHEET_DETAIL_CSV_URL` 시크릿 미등록 |
| 404 | Settings → Pages → Source가 `GitHub Actions`인지 |

자세한 내용과 과거 사례는 `docs/operations.md`.

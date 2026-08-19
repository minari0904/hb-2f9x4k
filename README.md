# 꿀벌이네 자산가계부 대시보드 — 설치 안내

이 폴더를 GitHub 저장소에 올리면, 매일 아침 구글 시트를 읽어
**비밀번호로 잠긴 대시보드**를 자동으로 갱신합니다.

## 미리 준비할 것

- GitHub 계정
- 구글 시트 게시 CSV 주소 **2개**
  1. `대시보드데이터` 탭 — 필수
  2. `지출가계부` 탭 — 선택 (손익계산서에서 항목을 눌러 실제 지출 내역을 보려면 필요)
- 정할 것: 대시보드 비밀번호 (배우자와 공유할 것)

> 두 번째 CSV 만드는 법: 구글 시트 → 파일 → 공유 → **웹에 게시** → 게시할 대상에서
> `지출가계부` 선택, 형식 `쉼표로 구분된 값(.csv)` → 게시 → 나온 주소 복사.
> 이 주소는 GitHub Secrets에만 넣으므로 사이트에는 노출되지 않습니다.

---

# 1단계 — 저장소에 파일 올리기

방법 A와 B 중 **하나만** 하시면 됩니다.

## 방법 A. Claude Code에게 시키기 (가장 쉬움)

이미 GitHub를 연결해 두셨다면 이게 제일 빠릅니다.
압축을 풀어둔 뒤 Claude Code에 아래를 그대로 붙여넣으세요.

```
C:\claude\finance_report\대시보드_배포키트 폴더의 내용을
내 GitHub에 새 공개 저장소 "hb-2f9x4k" 로 만들어서 푸시해줘.
.github/workflows/update.yml 파일도 빠뜨리지 말고 꼭 포함해줘.
푸시가 끝나면 저장소 주소를 알려줘.
```

- 저장소 이름(`hb-2f9x4k`)은 아무나 추측하지 못하게 아무 글자·숫자 조합으로 바꾸셔도 됩니다.
- **Public(공개)** 으로 만들어야 합니다. 무료 계정은 공개 저장소에서만 GitHub Pages를 쓸 수 있습니다.
  저장소가 공개돼도 `data.enc`는 암호화되어 있어 비밀번호 없이는 숫자를 볼 수 없습니다.

## 방법 B. GitHub 웹사이트에서 직접 (프로그램 설치 불필요)

**B-1. 저장소 만들기**
github.com 로그인 → 오른쪽 위 `+` → **New repository**
- Repository name: `hb-2f9x4k` (추측 어려운 이름)
- **Public** 선택
- **Add a README file** 체크
- **Create repository**

**B-2. index.html 과 scripts 폴더 올리기**
저장소 화면 → **Add file → Upload files**
→ 압축 푼 폴더에서 `index.html` 과 `scripts` 폴더를 **끌어다 놓기**
→ 아래 **Commit changes** 버튼

**B-3. 워크플로 파일 만들기** (이건 끌어다 놓기가 잘 안 되므로 직접 만듭니다)
저장소 화면 → **Add file → Create new file**
→ 파일명 칸에 아래를 **그대로** 입력하면 폴더가 자동으로 만들어집니다
```
.github/workflows/update.yml
```
→ 압축 푼 폴더의 `.github/workflows/update.yml` 을 메모장으로 열어
   **전체 복사 → 붙여넣기**
→ **Commit changes**

---

# 2단계 — 비밀 정보 등록 (웹에서만 가능)

저장소 화면 상단 **Settings** 탭
→ 왼쪽 메뉴 **Secrets and variables → Actions**
→ **New repository secret** 버튼으로 아래를 **하나씩** 등록

| Name (그대로 입력) | Secret (값) |
|---|---|
| `SHEET_CSV_URL` | `대시보드데이터` 탭 게시 CSV 주소 |
| `SHEET_DETAIL_CSV_URL` | `지출가계부` 탭 게시 CSV 주소 (선택) |
| `DASH_PASSWORD` | 정하신 비밀번호 |

> 저장하면 본인도 다시 볼 수 없습니다(덮어쓰기만 가능). 저장소가 공개여도
> 이 값들은 다른 사람에게 보이지 않고, 자동 갱신이 돌 때만 사용됩니다.

# 3단계 — Pages 켜기

**Settings → Pages** → Source 를 **GitHub Actions** 로 선택

# 4단계 — 첫 실행

**Actions** 탭 → 왼쪽 목록에서 `대시보드 갱신` → 오른쪽 **Run workflow** → **Run workflow**

1~2분 뒤 초록색 체크가 뜨면 완료입니다. 주소는
`https://<GitHub 사용자이름>.github.io/<저장소이름>/`

이 주소를 배우자와 공유하고, 비밀번호를 알려주세요.

---

## 이후 사용법

- 매달 25일 시트를 정리하면 **다음날 아침 6시**에 자동 갱신됩니다.
- 바로 반영하고 싶으면 **Actions → 대시보드 갱신 → Run workflow**.
- **구글 시트를 다시 게시할 필요는 없습니다.** 한 번 게시한 주소는 계속 살아있고,
  시트 내용을 바꾸면 그 주소의 내용도 함께 바뀝니다.
- 대시보드 디자인·기능이 바뀐 새 `index.html` 을 받으면
  저장소에서 기존 `index.html` 을 열고 연필 아이콘 → 전체 지우고 붙여넣기 → Commit
  (또는 Add file → Upload files 로 같은 이름 덮어쓰기) 후 Run workflow.

## 잘 안 될 때

| 증상 | 확인할 것 |
|---|---|
| Actions에서 빨간 X | 로그를 열어보면 이유가 한글로 나옵니다. 대부분 Secret 주소 오타 |
| 페이지는 열리는데 비밀번호가 안 먹음 | `DASH_PASSWORD` 저장 후 Run workflow 를 다시 실행했는지 |
| 404 페이지 | Settings → Pages 의 Source 가 `GitHub Actions` 인지 |
| 항목을 눌러도 내역이 안 나옴 | `SHEET_DETAIL_CSV_URL` 이 등록됐는지 |

## 보안 메모

- 사이트에는 **암호화된 데이터만** 올라갑니다. 구글 시트 주소도 사이트에 노출되지 않습니다.
- 검색엔진 수집은 `robots.txt` 와 페이지의 `noindex` 태그로 차단합니다.
- 실명은 두 단계로 걸러집니다: 시트의 `대시보드데이터` 탭 수식에서 한 번,
  자동 갱신이 암호화하기 직전에 한 번 더 가명(꿀꿀·말벌·째니)으로 바꿉니다.
- 비밀번호는 브라우저에 저장되지 않습니다. 화면을 새로 열 때마다 입력합니다.

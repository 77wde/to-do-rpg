# TO DO BUG RPG️

산만하고 회피형인 사람들(ADHD 포함)을 위한 **RPG 기반 To-Do 리스트**.
할 일을 퀘스트로 바꿔, 완료할 때마다 경험치·골드를 얻고 레벨업합니다.
(PRD.md / DESIGN.md 기반, Next.js App Router)

## 실행 방법

Node.js 20+ 권장 (Next.js 15 / React 19).

```bash
npm install
```

```bash
npm run dev
```

http://localhost:3000 접속 → 로그인 → 모험 시작.

프로덕션 빌드:

```bash
npm run build && npm start
```

### Supabase 없이도 실행됩니다

환경변수를 설정하지 않으면 **로컬 모드**로 동작합니다 — 로그인 없이 `LOGIN` 버튼만 있고,
닉네임을 입력하면 바로 시작하며, 세이브는 브라우저 localStorage에 남습니다.
게임 기능은 전부 그대로 쓸 수 있으니, 기획·디자인만 확인할 때는 이 상태로 충분합니다.

계정 로그인을 붙이려면 [SUPABASE_SETUP.md](SUPABASE_SETUP.md) 를 따라
`.env.local` 을 채우세요 ([.env_template](.env_template) 참고). 값이 채워지면
시작 화면이 자동으로 이메일 로그인 폼으로 바뀝니다.

## 인증과 데이터

| | 상태 |
| --- | --- |
| 인증 | **이메일 + 비밀번호** (Supabase Auth) — 가입·로그인·로그아웃, 확인 메일 처리 |
| DB 스키마 | `players` / `quests` / `activity_log` — 전 테이블 RLS로 본인 행만 접근 |
| 게임 상태 저장 | 로그인 시 **Supabase**, 환경변수 미설정 시 localStorage |

저장은 **낙관적**입니다. 화면은 즉시 갱신되고 DB 쓰기는 뒤따라갑니다 —
퀘스트를 완료할 때마다 응답을 기다리면 게임의 반응이 끊기기 때문입니다.
쓰기는 순서대로 직렬화되며, 실패하면 토스트로 알립니다.

> **PRD와 다른 점**: PRD 4장은 로그인 방식으로 Google OAuth를 적었지만,
> 이메일 + 비밀번호 로그인만 쓰기로 변경했습니다. 소셜 로그인 코드는 제거된 상태입니다.

RLS 정책은 `TO authenticated` 와 `auth.uid()` 소유권 조건을 함께 걸고,
UPDATE에는 `USING` 과 `WITH CHECK` 를 모두 지정해 다른 사용자에게 행을 넘길 수 없게 했습니다.

## 구현된 기능

- **핵심 RPG 루프** — 퀘스트 완료 시 XP·골드 획득, 레벨업(최대 HP 증가)
- **Idle 러너 포커스** — `진행하기` → 뽀모도로 시작. 캐릭터가 앞으로 달리고
  10·20·25분 깃발을 통과하면 골드. **집중을 멈추면(일시정지/포기) 뒤의 가시가
  따라잡아 HP 감소.** (우측 상단 🐇 데모 속도로 빠르게 체험 가능)
- **GTD 분류 + 맵** — inbox / next-action / calendar / someday-maybe / waiting-for.
  맵은 평소 흑백, **당장 할 일이 생긴 지역(다음 행동·캘린더)에 색이 켜짐**
- **기습 이벤트** — 다음 행동을 완료하면 inbox/someday 퀘스트가 자동으로
  다음 행동으로 소환됨
- **상점** — 골드로 스킨·동료·소모품(회복 물약, 집중 방패) 구매
- **수집·칭호** — 레벨 도달 시 상점에서 못 사는 트로피·칭호 잠금해제
- **오늘의 퀘스트 + 패널티** — 데일리 미완료 시 다음 접속에 HP·XP 패널티,
  연속 달성(streak) 기록. 집중 방패가 패널티 1회 방어

## 프로젝트 구조

```
app/
  layout.tsx              웹픽셀 비트맵 폰트(+Inter/JetBrains Mono 폴백) + 전역 스토어
  globals.css             DESIGN.md 디자인 토큰 + 픽셀 테마(각진 모서리·하드 섀도우)
  page.tsx                시작 화면 — 이메일 로그인/가입, 닉네임 입력
  play/page.tsx           대시보드 셸 + 탭
  auth/confirm/route.ts   가입 확인 링크 처리(verifyOtp)
  auth/auth-code-error/   확인 실패 안내
middleware.ts             Supabase 세션 갱신
components/
  PixelButton, PixelLogo, PlayerBar, Toasts, ActivityLog
  QuestsView, QuestCard, MapView, DailyView
  ShopView, CollectionView, FocusOverlay(러너)
lib/
  types.ts                도메인 타입
  constants.ts            XP 곡선/보상/상점/수집 카탈로그
  game.ts                 순수 게임 로직(레벨업/완료/기습/패널티)
  store.tsx               Context + localStorage 저장
  supabase/
    client.ts, server.ts  브라우저 / 서버 클라이언트 (@supabase/ssr)
    middleware.ts         세션 갱신 로직
    auth.ts               가입 / 로그인 / 로그아웃
    gameRepo.ts           게임 상태 로드 + 변경분만 반영하는 동기화
supabase/
  config.toml
  migrations/             스키마 + RLS 정책
```

## 남은 작업

- **여러 기기 동시 사용** — 지금은 마지막 쓰기가 이깁니다. 한 계정을 두 곳에서
  동시에 열면 나중 쪽이 앞의 변경을 덮어쓸 수 있습니다.
- **오프라인 대응** — 쓰기에 실패하면 알리기만 하고 재시도 큐는 없습니다.
- **배포** — 배포 도메인을 Supabase Redirect URLs에 추가해야 확인 메일 링크가 동작합니다.
  자세한 배포 체크리스트는 [SUPABASE_SETUP.md](SUPABASE_SETUP.md) 참고.

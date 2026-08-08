# QuestLog 🗡️

산만하고 회피형인 사람들(ADHD 포함)을 위한 **RPG 기반 To-Do 리스트**.
할 일을 퀘스트로 바꿔, 완료할 때마다 경험치·골드를 얻고 레벨업합니다.
(PRD.md / DESIGN.md 기반, Next.js App Router)

## 실행 방법

> 이 환경엔 Node가 없어 코드만 작성되어 있습니다. 아래는 로컬(사용자 PC)에서 실행하는 방법입니다.

Node.js 18.18+ (권장 20+) 필요:

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속 → 닉네임 입력 → 모험 시작.

프로덕션 빌드:

```bash
npm run build && npm start
```

## 구현된 기능 (1차 MVP)

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
  layout.tsx        폰트(Inter/JetBrains Mono) + 전역 스토어
  globals.css       DESIGN.md 디자인 토큰(크림 캔버스/오렌지)
  page.tsx          시작(닉네임 로그인) 화면
  play/page.tsx     대시보드 셸 + 탭
components/
  PlayerBar, Toasts, ActivityLog
  QuestsView, QuestCard, MapView, DailyView
  ShopView, CollectionView, FocusOverlay(러너)
lib/
  types.ts          도메인 타입
  constants.ts      XP 곡선/보상/상점/수집 카탈로그
  game.ts           순수 게임 로직(레벨업/완료/기습/패널티)
  store.tsx         Context + localStorage 저장
```

## 다음 단계 (PRD의 남은 기술 요구)

현재는 **로컬 우선 MVP**로, 데이터는 브라우저 localStorage에 저장됩니다.
PRD의 아래 항목은 다음 단계로 남겨두었고, 붙이기 쉽게 구조를 분리해 두었습니다.

- **Supabase** DB 연동 (localStorage → `lib/store.tsx`의 저장 계층 교체)
- **Google OAuth** 로그인 (시작 화면의 "Google로 계속" 버튼 활성화)

이 둘은 사용자님의 Supabase 프로젝트 키(`NEXT_PUBLIC_SUPABASE_URL` 등)와
Google OAuth 설정이 필요합니다. 준비되면 연동해 드릴게요.

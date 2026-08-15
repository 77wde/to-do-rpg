# Supabase 세팅 가이드

TO DO BUG RPG에 Google 로그인과 데이터베이스를 붙이는 순서입니다.
코드는 이미 다 들어가 있고, **아래 과정을 마치면 자동으로 활성화**됩니다.

환경변수가 비어 있는 동안에는 앱이 기존 로컬 모드(localStorage 세이브, 로그인 없음)로 동작하므로,
세팅 도중에도 앱은 계속 뜹니다.

---

## 1. Supabase 프로젝트 생성

[supabase.com/dashboard](https://supabase.com/dashboard) 에서 새 프로젝트를 만듭니다.

- **Region**: `Northeast Asia (Seoul)` 을 권장합니다 (지연 시간).
- **Database Password**: 생성 시 한 번만 표시되니 비밀번호 관리자에 저장해 두세요.

생성 후 `Project Settings → General` 의 **Reference ID**(예: `abcdefghijklmnop`)를 메모합니다.

---

## 2. 스키마 적용

테이블 정의는 [`supabase/migrations/`](supabase/migrations/) 에 있습니다.
프로젝트에 연결한 뒤 push 하면 됩니다.

```bash
supabase login
```

```bash
supabase link --project-ref <REFERENCE_ID>
```

```bash
supabase db push
```

적용되는 내용:

| 테이블 | 용도 |
| --- | --- |
| `players` | `auth.users` 와 1:1. 레벨·XP·골드·HP·보유 아이템 등 |
| `quests` | 퀘스트. GTD 카테고리, 보상, 완료 시각 |
| `activity_log` | 활동 피드 기록 |

세 테이블 모두 RLS가 켜져 있고, **본인 행만** 읽고 쓸 수 있습니다.

적용 후 점검:

```bash
supabase db advisors
```

---

## 3. 이메일 인증 설정

이 앱은 **이메일 + 비밀번호 로그인만** 사용합니다. 소셜 로그인은 쓰지 않습니다.

### 3-1. Email provider 확인

`Authentication → Sign In / Providers → Email` 이 켜져 있는지 봅니다 (기본값 켜짐).

### 3-2. 리디렉션 URL 등록 — 필수

`Authentication → URL Configuration → Redirect URLs` 에 확인 링크가 돌아올 주소를 등록합니다:

```
http://localhost:3000/auth/confirm
```

배포 도메인이 있으면 `https://<도메인>/auth/confirm` 도 추가합니다.
등록하지 않으면 가입 확인 메일의 링크가 Site URL로 튕겨서 로그인이 완료되지 않습니다.

### 3-3. 확인 메일을 쓸지 정하기

`Authentication → Sign In / Providers → Email → Confirm email` 옵션입니다.

| 설정 | 동작 |
| --- | --- |
| **켬** (기본) | 가입 → 확인 메일 발송 → 링크 클릭해야 로그인 가능 |
| **끔** | 가입 즉시 로그인 |

앱은 두 경우를 모두 처리합니다. 켜져 있으면 가입 후 "CHECK YOUR INBOX" 안내가 뜨고,
꺼져 있으면 곧바로 게임으로 들어갑니다.

> **개발 중이라면 끄는 쪽이 편합니다.** Supabase 기본 SMTP는 발송량 제한이 매우 낮아
> (테스트 목적) 몇 번 가입해 보면 바로 막힙니다. 실제 서비스에서는 켜두고
> `Project Settings → Authentication → SMTP Settings` 에 자체 SMTP를 연결하세요.

### 3-4. 유출 비밀번호 차단 (권장)

같은 Email provider 화면의 Password Security 항목에서 **Leaked password protection** 을 켜면,
[HaveIBeenPwned](https://haveibeenpwned.com/) 에 유출 이력이 있는 비밀번호를 가입·변경 단계에서 거부합니다.
비밀번호 로그인을 쓰는 이상 켜두는 편이 좋고, 꺼져 있으면 `supabase db advisors --linked` 가 경고합니다.

---

## 4. 환경변수

`Project Settings → API` 에서 값을 가져와 `.env.local` 을 만듭니다.

```bash
cp .env_template .env.local
```

| 변수 | 값 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL — `https://<REFERENCE_ID>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`) |

> **URL 뒤에 경로를 붙이지 마세요.** 같은 화면에 있는 RESTful endpoint(`.../rest/v1`)를 복사하면
> SDK가 인증 주소를 `.../rest/v1/auth/v1/authorize` 로 조립하고,
> `{"message":"No API key found in request"}` 가 돌아옵니다.
> 로그인 버튼을 눌렀는데 이 JSON이 뜬다면 십중팔구 이 문제입니다.

> `service_role`(secret) 키는 절대 넣지 마세요. `NEXT_PUBLIC_` 변수는 브라우저로 전송되며,
> 이 키는 RLS를 통째로 우회합니다.

입력 후 dev 서버를 재시작합니다 — 환경변수는 빌드 시점에 삽입되므로 hot reload로는 반영되지 않습니다.

---

## 5. 확인

시작 화면이 단일 `LOGIN` 버튼에서 **로그인 / 가입 탭이 있는 이메일 폼**으로 바뀌면 연결된 것입니다.

가입 흐름 (확인 메일 켜짐):

```
가입 → CHECK YOUR INBOX 안내 → 메일 링크 → /auth/confirm (verifyOtp) → /play
```

로그인 흐름:

```
이메일 + 비밀번호 → 세션 발급 → (첫 플레이면) 닉네임 입력 → /play
```

확인 링크 처리에 실패하면 `/auth/auth-code-error` 로 이동합니다.
이때는 3-2의 Redirect URLs 등록을 먼저 확인하세요.

---

## 현재 상태와 남은 작업

이미 되어 있는 것:

- `@supabase/ssr` 기반 브라우저/서버 클라이언트 — [`lib/supabase/`](lib/supabase/)
- 세션 갱신 미들웨어 — [`middleware.ts`](middleware.ts)
- 이메일 가입 / 로그인 / 로그아웃 — [`lib/supabase/auth.ts`](lib/supabase/auth.ts)
- 확인 링크 처리 — [`app/auth/confirm/route.ts`](app/auth/confirm/route.ts)
- RLS 포함 스키마 — [`supabase/migrations/`](supabase/migrations/)

- 게임 상태 저장 — [`lib/supabase/gameRepo.ts`](lib/supabase/gameRepo.ts)
  (로그인 시 DB, 미설정 시 localStorage)
- 첫 로그인 시 닉네임을 받아 `players` 행 생성

아직 안 된 것:

- 여러 기기에서 같은 계정을 동시에 열면 마지막 쓰기가 이깁니다 (충돌 해결 없음)
- 쓰기 실패 시 알림만 하고 재시도 큐는 없습니다

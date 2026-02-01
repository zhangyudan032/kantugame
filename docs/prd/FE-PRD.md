# Frontend PRD (V1.0)

Scope: Web front-end only, based on PRD-001. Decisions below reflect "cookie login + backend stats + backend returns image URL".

## 1) Pages and Routes
- /login: login + registration in one form
- /game: main quiz loop
- /empty: question pool exhausted page
- /game modal: session stats on logout

## 2) Auth Design (No Token Handling in Frontend)
Backend uses HttpOnly cookie for session. Frontend only needs:
- All fetch calls include credentials: "include"
- No token stored on frontend

Cookie rules (backend responsibility):
- HttpOnly, Secure, SameSite=Lax

## 3) Core Flows

### 3.1 Login / Register
Inputs: email, password. If email not registered, show "confirm password" and switch to register flow.

Validation and error texts:
- invalid email: "请输入有效的邮箱地址"
- password wrong: "密码错误，请重试"
- password < 6: "密码至少需要 6 位"
- confirm mismatch: "两次密码不一致，请重新输入"

### 3.2 Quiz Loop
1) Fetch next question for current user
2) Show image
3) User submits answer
4) Show result:
   - correct: "🎉 恭喜您答对了！"
   - wrong: "❌ 正确答案是：XXX"
5) Click "下一题" to continue

Empty answer:
- show "请输入答案"

### 3.3 Logout + Stats
If user answered at least one question, show stats modal on logout:
- correctCount, wrongCount, accuracy

If no answers, logout directly without modal.

### 3.4 Question Pool Exhausted
If backend returns NO_QUESTION:
- navigate to /empty
- show:
  - "你真是个答题小天才！"
  - "题库正在更新中，请明日再来"
- button: "返回登录页" (logs out and goes to /login)

## 4) API Contract (Frontend Expectation)

All requests must include credentials: "include".

### POST /api/auth/login
req: { email, password }
res: { userId }

### POST /api/auth/register
req: { email, password }
res: { userId }

### GET /api/questions/next
res:
- success: { id, imageUrl }
- no question: { code: "NO_QUESTION" }

### POST /api/answers/submit
req: { questionId, answer }
res: { isCorrect, correctAnswer }

### POST /api/auth/logout
res:
- { ok: true } (no answers)
- { ok: true, stats: { correctCount, wrongCount, accuracy } } (has answers)

## 5) UI Components
- LoginCard
- InputEmail, InputPassword, InputConfirmPassword (conditional)
- RememberMe checkbox
- PrimaryButton
- QuizImage
- AnswerInput
- ResultBanner
- NextButton
- LogoutButton
- StatsModal
- EmptyState

## 6) Non-Functional
- Responsive, mobile friendly
- Image loading placeholder
- Keyboard submit (Enter key)
- Unified error toast or inline error

# Querious — Deep-Audit Implementation Plan
**Audit basis:** Full read of every model, controller, route, reducer, action, middleware, utility, and key component · **Stack confirmed:** React 18 / Redux Thunk / Framer Motion / Socket.IO client · Express 4 / Mongoose 8 / Socket.IO server / JWT + bcrypt / nodemailer / helmet / express-rate-limit / xss / express-mongo-sanitize

---

## Codebase Truth (What Actually Exists vs. What Was Assumed)

This plan was written after reading every file — not from assumptions. Key facts confirmed:

| Area | What actually exists |
|---|---|
| **User model** | `name, email, password, about, tags, reputation, badges{gold,silver,bronze}, avatar, location, website, savedQuestions[], collectives[], resetPasswordToken, resetPasswordExpires, passwordChangedAt, loginAttempts, lockUntil, forgotPasswordCount, forgotPasswordWindowStart, joinedOn` — **no** `isAdmin`, `trustLevel`, `notificationPrefs` |
| **Question model** | `questionTitle, questionBody, questionTags[], noOfAnswers, upVote[], downVote[], userPosted, userId, askedOn, views, acceptedAnswerId, editedOn, editedBy, status(open/closed), comments[]` — **no** `watchers[]`, `hotScore` |
| **Answer model** | `questionId, answerBody, userId, userAnswered, upVote[], downVote[], isAccepted, answeredOn, editedOn, comments[]` — **no** `outdatedFlags[]`, `isAiAssisted`, `hidden` |
| **Notification model** | `userId, message, questionId, read, createdAt` — **no** `category` field, no `type` field |
| **Reputation logic** | `badges = { gold: floor(rep/500), silver: floor((rep%500)/100), bronze: floor((rep%100)/20) }` — pure math from rep, **no** `UserBadgeAward` collection |
| **Sorting** | Newest / Active / Unanswered tabs + filter drawer (filterSort: newest/activity/score/views) — **no** "Trending" / hot-score tab |
| **Routes** | `/user`, `/questions`, `/answer`, `/notifications` — **no** `/flags`, `/admin`, `/suggest-edit`, `/review` |
| **Pagination** | Offset/skip-based (`page * limit`) — **no** cursor-based |
| **Search** | MongoDB `$text` search on title+body index — **no** semantic/embedding search |
| **Notifications** | `category` field missing on model; Socket.IO real-time + 30s polling fallback works; nodemailer installed but only used for password reset |
| **Auth middleware** | Validates JWT, checks `passwordChangedAt` — **no** trust-level or admin gate |
| **`getAllUsers`** | Fetches **ALL** users with no pagination — will degrade linearly |
| **`Notifications.js` model** | Missing `category` field — all notifications are undifferentiated |

---

## Priority Framework

- **P0** — Do now (critical gaps, < 2 weeks)
- **P1** — Do this sprint (high-value, < 6 weeks)
- **P2** — Do next quarter (differentiator features)
- **Effort:** S = 1–2 days · M = 3–7 days · L = 2–4 weeks

---

## Phase 1 — Foundation Fixes (P0, 1–2 weeks)

These are correctness/scalability issues that will hurt at any user volume.

---

### 1.1 Fix `getAllUsers` — Add Pagination

**Problem confirmed by audit:** `GET /user/getAllUsers` fetches ALL users with no limit. `App.js` dispatches `fetchAllUsers()` on every mount, loading every user into Redux. This is an O(n) memory + network problem that will break at scale.

**Impact:** `usersReducer` length is displayed in the hero stats; `UserPopover` and `MemberCard` consume this list.

#### [MODIFY] `server/controllers/users.js`
- Add `page` / `limit` query params (default limit: 30, max: 100) using skip/limit
- Return `{ data: [...], totalCount, totalPages, currentPage }`

#### [MODIFY] `server/routes/users.js`
- No route change needed, query params handled in controller

#### [MODIFY] `client/src/actions/users.js`
- Pass params to `getAllUsers` call

#### [MODIFY] `client/src/reducers/users.js` (currently `[].js`)
- Store `{ data, totalCount, totalPages, currentPage }` shape

#### [MODIFY] `client/src/App.js`
- Remove the global `fetchAllUsers()` dispatch from top-level mount (it's only needed on `/Users` page and `UserPopover`)

---

### 1.2 Add `category` Field to Notification Model

**Problem confirmed by audit:** `Notifications.js` model has no `type`/`category` field. Every notification is a plain string `message`. This blocks notification filtering, preferences, and any per-type opt-out — it must be fixed before notification prefs (Phase 3) can be built.

#### [MODIFY] `server/models/Notifications.js`
```js
category: {
  type: String,
  enum: ['answer', 'comment', 'vote', 'accept', 'mention', 'badge', 'system'],
  default: 'system'
}
```

#### [MODIFY] `server/utils/notificationHelper.js`
- Add `category` param to `sendNotification(userId, message, questionId, category)`

#### [MODIFY] `server/controllers/Questions.js` + `Answers.js`
- All 4 `sendNotification()` call sites: pass the appropriate `category` string
  - Answer posted → `'answer'`
  - Comment on question/answer → `'comment'`
  - Vote → `'vote'`
  - Answer accepted → `'accept'`

#### [MODIFY] `client/src/reducers/notifications.js`
- No schema change needed client-side; the payload now carries `category`

---

### 1.3 Add `isAdmin` + `requireAdmin` Middleware

**Problem confirmed by audit:** Auth middleware only verifies JWT and `passwordChangedAt`. There is no admin gate anywhere. Many P1 features (flagging queue, admin dashboard) need a secure admin check.

#### [MODIFY] `server/models/auth.js`
```js
isAdmin: { type: Boolean, default: false }
```

#### [NEW] `server/middleware/requireAdmin.js`
```js
import User from '../models/auth.js';
const requireAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user?.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  next();
};
export default requireAdmin;
```

#### [MODIFY] `server/middleware/auth.js`
- Attach `req.user` (full user object) so downstream middleware doesn't re-fetch

**Effort:** S · **Risk:** Low (additive only)

---

### 1.4 "Hot / Trending" Sort Tab

**Problem confirmed by audit:** `HomeMainbar.jsx` has `["newest", "active", "unanswered"]` tabs hardcoded. `getAllQuestions` controller handles `filterSort` but has no hot-score logic. The Reddit hot-ranking formula from the original plan can be added as a 4th tab with zero new infra.

#### [MODIFY] `server/controllers/Questions.js`
- In the `getAllQuestions` aggregation pipeline, add `hot` as a `filterSort` option:
```js
// When filterSort === 'hot'
const aggPipeline = [
  { $match: query },
  {
    $addFields: {
      hotScore: {
        $add: [
          { $divide: [{ $subtract: [{ $size: '$upVote' }, { $size: '$downVote' }] }, 1] },
          { $divide: [{ $subtract: [{ $toLong: '$askedOn' }, 1134028003000] }, 45000000] }
        ]
      }
    }
  },
  { $sort: { hotScore: -1 } },
  { $skip: (page - 1) * limit },
  { $limit: limit }
]
```

#### [MODIFY] `client/src/components/HomeMainbar/HomeMainbar.jsx`
- Add `"hot"` to the tabs array: `["newest", "active", "unanswered", "hot"]`
- Display: `"🔥 Trending"` label

**Effort:** S · **Risk:** Very low

---

### 1.5 Related Questions Widget

**Problem confirmed by audit:** `QuestionsDetails.jsx` / `DisplayQuestion` page has no related questions sidebar. The `$text` index on `questionTitle + questionBody` is already defined — this is a free win.

#### [NEW] `server/controllers/Questions.js` — add `getRelatedQuestions`
```js
export const getRelatedQuestions = async (req, res) => {
  const { id } = req.params;
  const question = await Questions.findById(id, 'questionTitle questionTags');
  const results = await Questions.find(
    { $text: { $search: question.questionTitle }, _id: { $ne: id } },
    { score: { $meta: 'textScore' }, questionTitle: 1, noOfAnswers: 1, acceptedAnswerId: 1, askedOn: 1 }
  ).sort({ score: { $meta: 'textScore' } }).limit(5);
  res.json(results);
};
```

#### [MODIFY] `server/routes/Questions.js`
- `router.get('/:id/related', getRelatedQuestions);`

#### [NEW] `client/src/components/RightSidebar/WidgetRelatedQuestions.jsx`
- Fetch on question detail mount, render top 5 as title links with answered/unanswered chip

#### [MODIFY] `client/src/api/index.js`
- `export const getRelatedQuestions = (id) => API.get(\`/questions/${id}/related\`);`

**Effort:** S · **Risk:** Very low

---

## Phase 2 — Flagging, Content Quality & "Mark as Outdated" (P0, weeks 2–4)

---

### 2.1 Content Flagging System

**Problem confirmed by audit:** No `/flags` route, no `Flag` model, no moderation queue anywhere. Bad content has no removal path except manual DB intervention.

#### [NEW] `server/models/Flag.js`
```js
const FlagSchema = mongoose.Schema({
  targetType: { type: String, enum: ['question', 'answer', 'comment'], required: true },
  targetId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }, // for routing to mod queue
  flaggedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason:     { type: String, enum: ['spam', 'offensive', 'duplicate', 'misleading', 'other'], required: true },
  note:       { type: String, maxlength: 500 },
  status:     { type: String, enum: ['open', 'actioned', 'dismissed'], default: 'open' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  createdAt:  { type: Date, default: Date.now }
});
FlagSchema.index({ targetId: 1, status: 1 });
FlagSchema.index({ flaggedBy: 1, targetId: 1 }, { unique: true }); // 1 flag per user per content
```

#### [NEW] `server/controllers/flags.js`
- `POST /flags` — submit a flag (auth required, rate-limited)
- Auto-hide rule: if `Flag.countDocuments({ targetId, status: 'open' }) >= 3` → set `question.status = 'closed'` or `answer.hidden = true`
- `GET /flags` — list open flags (admin only)
- `PATCH /flags/:id` — resolve a flag (admin only): `{ action: 'actioned' | 'dismissed' }`

#### [NEW] `server/routes/flags.js`
- Import `auth`, `requireAdmin` middleware
- Public: `POST /flags` (auth)
- Admin-gated: `GET /flags`, `PATCH /flags/:id` (auth + requireAdmin)

#### [MODIFY] `server/models/Answers.js`
- Add `hidden: { type: Boolean, default: false }` field (for auto-hide by flag threshold)

#### [MODIFY] `server/index.js`
- Import and mount `flagRoutes` at `/flags`

#### [NEW] `client/src/components/FlagModal/FlagModal.jsx`
- Modal triggered by a "Flag" button on question/answer/comment
- Radio group: spam / offensive / duplicate / misleading / other
- Optional `note` textarea
- Submit calls `POST /flags`

#### [MODIFY] `client/src/api/index.js`
- `export const submitFlag = (flagData) => API.post('/flags', flagData);`
- `export const getFlags = () => API.get('/flags');`
- `export const resolveFlag = (id, action) => API.patch(\`/flags/${id}\`, { action });`

**Effort:** M · **Risk:** Medium (new model + auto-hide logic touches content visibility)

---

### 2.2 "Mark as Outdated" on Answers

**Problem confirmed by audit:** `Answers.js` model has no outdated-flag field. Accepted answers can be years old with no visual warning.

#### [MODIFY] `server/models/Answers.js`
```js
outdatedFlags: [{
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason:    { type: String, maxlength: 200 },
  flaggedAt: { type: Date, default: Date.now }
}]
```

#### [MODIFY] `server/controllers/Answers.js`
- New handler `flagOutdated(req, res)`:
  - Prevent duplicate flags from same user
  - `answer.outdatedFlags.push({ userId, reason })`
  - Return updated answer
- New handler `clearOutdatedFlag(req, res)` — for answer author or admin only

#### [MODIFY] `server/routes/Answers.js`
- `POST /answer/:id/outdated` (auth)
- `DELETE /answer/:id/outdated` (auth — author/admin only)

#### UI — `client/src/Pages/Questions/DisplayQuestion.jsx` (or answer list component)
- If `answer.outdatedFlags.length >= 3`: render yellow warning banner: *"⚠ Flagged as potentially outdated by N users — verify before using"*
- "Mark as outdated" link below every non-author answer (opens a small form with a reason input)
- If viewer is answer author → show "Clear outdated flag" link

**Effort:** S · **Risk:** Very low

---

## Phase 3 — Real Badge System (P0, weeks 2–5)

The original plan correctly identifies this as the highest-leverage single feature. The current `badges = { gold: floor(rep/500), ... }` system gives identical badges to all users with the same reputation — it's not gamification, it's just a rep display.

---

### 3.1 Badge Catalog + `UserBadgeAward` Model

#### [NEW] `server/models/Badge.js` (seeded catalog, immutable)
```js
const BadgeSchema = mongoose.Schema({
  code:        { type: String, required: true, unique: true }, // e.g. 'STUDENT'
  name:        { type: String, required: true },               // e.g. 'Student'
  description: { type: String, required: true },
  tier:        { type: String, enum: ['gold', 'silver', 'bronze'], required: true },
  triggerType: { type: String, required: true }                // e.g. 'first_question'
});
```

**Initial 12 badges (seeded via `server/seeds/badges.js`):**

| Code | Name | Tier | Trigger |
|---|---|---|---|
| `STUDENT` | Student | Bronze | First question asked |
| `TEACHER` | Teacher | Bronze | First answer with ≥1 upvote |
| `COMMENTATOR` | Commentator | Bronze | 10 comments posted |
| `AUTOBIOGRAPHER` | Autobiographer | Bronze | Profile: about + location + website all filled |
| `SUPPORTER` | Supporter | Bronze | First upvote cast |
| `CRITIC` | Critic | Bronze | First downvote cast |
| `ENLIGHTENED` | Enlightened | Silver | Accepted answer with ≥10 upvotes |
| `CIVIC_DUTY` | Civic Duty | Silver | Voted 300 times total |
| `NICE_ANSWER` | Nice Answer | Silver | Answer reaches 10 upvotes |
| `GREAT_ANSWER` | Great Answer | Gold | Answer reaches 100 upvotes |
| `POPULIST` | Populist | Gold | Answer outscores accepted answer by 2× |
| `NECROMANCER` | Necromancer | Gold | Answer ≥ 1 year old question, gets ≥10 upvotes |

#### [NEW] `server/models/UserBadgeAward.js`
```js
const UserBadgeAwardSchema = mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeCode: { type: String, required: true },
  sourceId:  { type: mongoose.Schema.Types.ObjectId }, // the question/answer that triggered it
  awardedAt: { type: Date, default: Date.now }
});
// Idempotent: prevent double-awards for same source
UserBadgeAwardSchema.index({ userId: 1, badgeCode: 1, sourceId: 1 }, { unique: true });
UserBadgeAwardSchema.index({ userId: 1, awardedAt: -1 });
```

---

### 3.2 Badge Trigger Engine

#### [NEW] `server/utils/badgeEngine.js`
```js
export const checkBadgeTriggers = async (userId, eventType, context = {}) => {
  // eventType: 'question_asked' | 'answer_upvoted' | 'answer_accepted' |
  //            'vote_cast' | 'comment_posted' | 'profile_updated'
  // Awards badges idempotently using upsert on unique index
};
```

**Hook into existing controllers:**
- `Questions.js → AskQuestion` → trigger `'question_asked'` → check `STUDENT`
- `Answers.js → voteAnswer` → trigger `'answer_upvoted'` → check `TEACHER`, `NICE_ANSWER`, `GREAT_ANSWER`, `POPULIST`, `NECROMANCER`
- `Answers.js → acceptAnswer` → trigger `'answer_accepted'` → check `ENLIGHTENED`
- `Questions.js/Answers.js → voteQuestion/voteAnswer` → trigger `'vote_cast'` → check `SUPPORTER`, `CRITIC`, `CIVIC_DUTY`
- `Questions.js/Answers.js → addCommentQuestion/addCommentAnswer` → trigger `'comment_posted'` → check `COMMENTATOR`
- `users.js → updateProfile` → trigger `'profile_updated'` → check `AUTOBIOGRAPHER`

#### [MODIFY] `server/utils/reputationHelper.js`
- After `user.save()`, call `checkBadgeTriggers(userId, eventType, context)` asynchronously (fire-and-forget, don't block the response)
- **Keep existing `badges.gold/silver/bronze` counters** but derive them from `UserBadgeAward` counts per tier, not from reputation math:
```js
const [gold, silver, bronze] = await Promise.all([
  UserBadgeAward.countDocuments({ userId, tier: 'gold' }),  // via Badge.findOne lookup
  UserBadgeAward.countDocuments({ userId, tier: 'silver' }),
  UserBadgeAward.countDocuments({ userId, tier: 'bronze' }),
]);
user.badges = { gold, silver, bronze };
```

#### Real-time badge notification
- In `badgeEngine.js`, after awarding: call `sendNotification(userId, \`🏅 You earned the "${badgeName}" badge!\`, null, 'badge')` which auto-pushes via existing Socket.IO

---

### 3.3 Badge UI

#### [MODIFY] `client/src/components/UserBadge/UserBadge.jsx`
- Add tooltip/popover showing badge name + description when hovering the gold/silver/bronze dots
- Keep current counter display, just add name context

#### [NEW] `client/src/Pages/UserProfile/BadgesTab.jsx`
- Listed under `/Users/:id?tab=badges`
- Show earned badges grouped by tier with icon, name, date earned, and the question/answer that triggered it (link back to source)

#### [MODIFY] `client/src/Pages/UserProfile/UserProfile.jsx`
- Add "Badges" tab to the profile tabs alongside existing tabs

#### [MODIFY] `client/src/api/index.js`
- `export const getUserBadges = (userId) => API.get(\`/user/${userId}/badges\`);`

#### [NEW] `server/controllers/users.js` — `getUserBadges`
- `GET /user/:id/badges` — returns `UserBadgeAward[]` with `Badge` catalog details populated

**Effort:** L (split into 2 PRs: models + engine, then UI) · **Risk:** Medium

---

## Phase 4 — "Watch Question" + @Mentions (P1, weeks 4–6)

---

### 4.1 Watch / Subscribe to Question

**Problem confirmed by audit:** `Questions.js` model has no `watchers[]` field. Only the question author + answer authors get activity notifications. Users who found a question via search and want updates have no mechanism.

#### [MODIFY] `server/models/Questions.js`
```js
watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
```

#### [MODIFY] `server/controllers/Questions.js`
- New handler `toggleWatchQuestion(req, res)`:
  - `$addToSet` / `$pull` on `watchers` (atomic, no race condition)
  - Return updated `{ watching: boolean, watcherCount: number }`

#### [MODIFY] `server/routes/Questions.js`
- `POST /questions/:id/watch` (auth)

#### Fan-out watchers on new answer/comment
- In `Answers.js → postAnswer`: after notifying question author, also fan out to `question.watchers` (exclude self and already-notified author)
- In `Questions.js → addCommentQuestion`: same fan-out

#### [NEW] `client/src/components/WatchButton/WatchButton.jsx`
- "👁 Watch (N)" button next to the existing Save button on `DisplayQuestion`
- Optimistic update on click
- Shows `"Watching"` state when active

#### [MODIFY] `client/src/api/index.js`
- `export const toggleWatchQuestion = (id) => API.post(\`/questions/${id}/watch\`);`

**Effort:** S · **Risk:** Low

---

### 4.2 @Mentions in Comments

**Problem confirmed by audit:** Comment `commentBody` is stored as plain text/HTML. No mention-parsing happens on submission. This is a P1 retention feature that requires client-side autocomplete and server-side parse-and-notify.

#### Client-side
- In the comment textarea (both question and answer comment forms):
  - Detect `@` followed by text → debounced `GET /user/getAllUsers?search=<query>` (needs search param added to that endpoint)
  - Dropdown of up to 5 matching users by name
  - On selection: insert `@username` into the textarea and record `userId` for server submission

#### [MODIFY] `server/controllers/Questions.js` → `addCommentQuestion`
- Parse `@username` tokens in `commentBody` using regex `/\B@(\w+)/g`
- Look up matching `User.findOne({ name: username })` for each token
- For each resolved user (excluding self): `sendNotification(userId, message, questionId, 'mention')`

#### [MODIFY] `server/controllers/Answers.js` → `addCommentAnswer`
- Same mention-parse-and-notify logic

#### [MODIFY] `server/controllers/users.js` → `getAllUsers`
- Add `search` query param: `User.find({ name: { $regex: search, $options: 'i' } }).limit(10)`

**Effort:** M · **Risk:** Low (additive to existing comment controllers)

---

## Phase 5 — Notification Preferences + Digest (P1, weeks 5–7)

---

### 5.1 Per-Category Notification Preferences

**Problem confirmed by audit:** `Notifications.js` model now has `category` (added in Phase 1.2), but the User model has no `notificationPrefs` field. The nodemailer infra (`mailHelper.js`) is already installed — only the email-blast logic needs to be wired.

#### [MODIFY] `server/models/auth.js`
```js
notificationPrefs: {
  answer:    { inApp: Boolean, default: true, email: Boolean, default: false },
  comment:   { inApp: Boolean, default: true, email: Boolean, default: false },
  vote:      { inApp: Boolean, default: true, email: Boolean, default: false },
  accept:    { inApp: Boolean, default: true, email: Boolean, default: false },
  mention:   { inApp: Boolean, default: true, email: Boolean, default: true  },
  badge:     { inApp: Boolean, default: true, email: Boolean, default: false },
  digestFrequency: { type: String, enum: ['instant', 'daily', 'weekly'], default: 'instant' }
}
```

#### [MODIFY] `server/utils/notificationHelper.js`
- In `sendNotification(userId, message, questionId, category)`:
  - Fetch user prefs: `User.findById(userId, 'notificationPrefs')`
  - If `prefs[category]?.inApp === false` → skip socket emit
  - If `prefs[category]?.email === true && prefs.digestFrequency === 'instant'` → send immediate email via `mailHelper.js`
  - If `digestFrequency !== 'instant'` → store in `PendingDigest` collection (new model) instead of emailing immediately

#### [NEW] `server/models/PendingDigest.js`
```js
{ userId, notificationId, scheduledFor: Date, sent: Boolean, default: false }
```

#### [NEW] `server/controllers/digest.js` (Vercel cron endpoint)
- `GET /digest/run` (protected by a cron-secret header, not auth middleware)
- Aggregates pending digests by user → groups notifications → sends one email per user
- Marks `PendingDigest.sent = true`

#### [NEW] `client/src/Pages/Settings/NotificationSettings.jsx`
- `/Settings/Notifications` route
- Checkbox grid per category × in-app/email
- Digest frequency select: Instant / Daily / Weekly
- Saves via `PATCH /user/update/:id` (reuses existing `updateProfile` controller; extend to handle `notificationPrefs`)

**Effort:** M · **Risk:** Medium (email delivery needs SMTP configured in `.env`)

---

## Phase 6 — Suggested Edits Workflow (P1, weeks 6–9)

---

### 6.1 Suggested Edit Model + Routes

**Problem confirmed by audit:** `updateQuestion` and `updateAnswer` are author-only (`String(userId) !== String(author)` → 403). There is no way for non-authors to propose improvements.

#### [NEW] `server/models/SuggestedEdit.js`
```js
const SuggestedEditSchema = mongoose.Schema({
  targetType:   { type: String, enum: ['question', 'answer'], required: true },
  targetId:     { type: mongoose.Schema.Types.ObjectId, required: true },
  suggestedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  diffTitle:    { type: String },         // for questions only
  diffBody:     { type: String, required: true },
  diffTags:     { type: [String] },       // for questions only
  status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reviewNote:   { type: String },
  createdAt:    { type: Date, default: Date.now },
  resolvedAt:   { type: Date }
});
SuggestedEditSchema.index({ targetId: 1, status: 1 });
SuggestedEditSchema.index({ suggestedBy: 1, createdAt: -1 });
```

#### [NEW] `server/controllers/suggestedEdits.js`
- `POST /suggest-edits` — create suggested edit (auth; body: `{ targetType, targetId, diffBody, diffTitle?, diffTags? }`)
  - If suggester's `reputation >= 2000` → auto-apply (reuse `updateQuestion`/`updateAnswer` logic) + `sendNotification(author, 'Edit applied by high-rep user', questionId, 'system')`
  - Otherwise → save as `pending` + notify content author
- `GET /suggest-edits/pending` — list pending edits (admin or rep >= 2000)
- `PATCH /suggest-edits/:id` — approve or reject (admin or rep >= 2000)
  - On approve: apply diff to target, notify suggester, award `EDITOR` badge trigger
  - On reject: notify suggester with reason

#### [MODIFY] `server/index.js`
- Mount `suggestedEditRoutes` at `/suggest-edits`

#### UI
- `client/src/Pages/Questions/DisplayQuestion.jsx` — "Suggest an edit" link below question body (shown to non-authors)
- Answer list — same "Suggest an edit" link per answer
- `client/src/Pages/Review/SuggestedEdits.jsx` — `/Review/Edits` queue page (gated by `isAdmin || reputation >= 2000`)
- Diff viewer: show original vs. proposed side-by-side

**Effort:** L · **Risk:** Medium

---

## Phase 7 — Trust Levels (P1/P2, weeks 8–12)

**Dependency:** Requires Phase 2 (Flagging) to be live first, since flag history feeds TL demotion logic.

#### [MODIFY] `server/models/auth.js`
```js
trustLevel: { type: Number, default: 0, min: 0, max: 4 }
```

#### [NEW] `server/utils/trustLevelEngine.js`
```js
// Thresholds (configurable via env):
// TL0 → TL1: reputation >= 15 && joinedOn age >= 1 day
// TL1 → TL2: reputation >= 100 && no flags in last 30 days
// TL2 → TL3: reputation >= 500 && accepted answers >= 5
// TL3 → TL4: isAdmin = true (manual promotion only)
export const recomputeTrustLevel = async (userId) => { ... }
```

Call `recomputeTrustLevel` after every `updateReputationAndBadges` call (async, non-blocking).

#### [NEW] `server/middleware/requireTrustLevel.js`
```js
export const requireTrustLevel = (minLevel) => async (req, res, next) => {
  const user = await User.findById(req.userId, 'trustLevel');
  if ((user?.trustLevel ?? 0) < minLevel) return res.status(403).json({ message: 'Insufficient trust level' });
  next();
};
```

**Gate existing and new actions:**
| Route | Current Gate | Add |
|---|---|---|
| `POST /flags` | auth | `requireTrustLevel(1)` |
| `POST /suggest-edits` | auth | `requireTrustLevel(1)` |
| `GET /suggest-edits/pending` | auth | `requireTrustLevel(2)` |
| Close/retag question | — | New endpoint, `requireTrustLevel(3)` |

**Effort:** L · **Risk:** Medium (affects all action gates; needs careful sequencing)

---

## Phase 8 — Admin Dashboard (P1, weeks 7–9)

**Problem confirmed by audit:** No `/Admin` surface. Data for a dashboard already exists — `ViewTracker`, `Questions.countDocuments`, `Answers.countDocuments`, `getTagsAggregation` (already implemented!), plus flags (Phase 2).

#### [NEW] `server/controllers/admin.js`
All endpoints gated by `auth + requireAdmin`:

```js
// GET /admin/stats
// Returns: { dau: Number, questionsToday: Number, answersToday: Number,
//            openFlags: Number, pendingEdits: Number }
// Sources:
// - dau: distinct userIds in ViewTracker for last 24h
// - questionsToday/answersToday: countDocuments with askedOn/answeredOn >= today
// - openFlags: Flag.countDocuments({ status: 'open' })
// - pendingEdits: SuggestedEdit.countDocuments({ status: 'pending' })

// GET /admin/top-tags — reuses existing getTagsAggregation logic
// GET /admin/flags — same as GET /flags (admin route alias)
// PATCH /admin/users/:id — toggle isAdmin, set trustLevel manually
```

#### [NEW] `server/routes/admin.js`
- Mount at `/admin` in `index.js`

#### [NEW] `client/src/Pages/Admin/AdminDashboard.jsx`
- Route: `/Admin` (gated by `currentUser.isAdmin`)
- Stat cards: DAU, Questions Today, Answers Today, Open Flags, Pending Edits
- Top Tags chart (reuse `getTagsAggregation` already in Redux via `FETCH_TAGS_AGGREGATION`)
- Open Flags table with quick Resolve/Dismiss actions
- Pending Suggested Edits count with link to review queue

**Effort:** M · **Risk:** Low (mostly reading existing data)

---

## Phase 9 — Reputation Ledger + Daily Cap (P2, weeks 10+)

**Problem confirmed by audit:** `reputationHelper.js` does atomic `$inc` with no ledger. There is no audit trail for reputation changes, and no daily cap against vote rings.

#### [NEW] `server/models/RepLedger.js`
```js
const RepLedgerSchema = mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  delta:     { type: Number, required: true },
  source:    { type: String, enum: ['upvote_q', 'downvote_q', 'upvote_a', 'downvote_a', 'accept', 'accepted', 'system'], required: true },
  sourceId:  { type: mongoose.Schema.Types.ObjectId },
  date:      { type: String, required: true }, // YYYY-MM-DD UTC
  createdAt: { type: Date, default: Date.now }
});
RepLedgerSchema.index({ userId: 1, date: 1 });
```

#### [MODIFY] `server/utils/reputationHelper.js`
```js
// 1. Log every delta to RepLedger
// 2. For vote-sourced deltas, check sum of vote-sourced deltas today:
//    if sum >= 200, cap delta at (200 - currentDailyTotal), record capped amount
// 3. Keep existing $inc logic unchanged for accepted-answer bonuses (not capped)
```

#### [NEW] `server/controllers/users.js` — `getUserRepHistory`
- `GET /user/:id/reputation` — paginated `RepLedger` entries for a user
- Returns: `[{ date, delta, source, sourceQuestion/Answer title }]`

#### UI — `client/src/Pages/UserProfile/RepHistoryTab.jsx`
- New tab on profile: "Reputation" showing chronological ledger with daily totals, colored by +/−

**Effort:** M · **Risk:** Low (additive; doesn't touch existing vote logic, only wraps it)

---

## Phase 10 — SEO / Meta Tags (P1, parallel track)

**Problem confirmed by audit:** CRA renders `<div id="root"></div>` — crawlers see nothing. Every question page is invisible to Google. This is the #1 long-term traffic lever.

**Pragmatic approach (no Next.js migration needed):**

#### [MODIFY] `client/public/index.html`
- Add static Open Graph fallback tags for the homepage

#### [NEW] `client/src/hooks/useDocumentMeta.js`
```js
// Hook that sets document.title and meta description dynamically
// <Helmet>-style without adding a new dependency
export const useDocumentMeta = ({ title, description, ogImage }) => {
  useEffect(() => {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    // Set og:title, og:description, og:url dynamically
  }, [title, description]);
};
```

#### [MODIFY] Key page components
- `DisplayQuestion.jsx` → `useDocumentMeta({ title: question.questionTitle + ' - Querious', description: first 160 chars of body })`
- `UserProfile.jsx` → `useDocumentMeta({ title: user.name + "'s Profile - Querious" })`
- `Tags/:tag` → `useDocumentMeta({ title: "Questions tagged [${tag}] - Querious" })`

**Pre-rendering (longer term):**
- `vercel.json` already exists — add `react-snap` prerender step to `build` script to statically render question pages for crawler bots

**Effort:** S (meta hook) → L (prerendering) · **Risk:** Low

---

## Phase 11 — Cursor-based Pagination (P1, before scale)

**Problem confirmed by audit:** `getAllQuestions` uses `skip((page-1)*limit).limit(limit)`. At 10,000+ questions, skip degrades linearly. Switch to cursor-based pagination before it becomes a problem.

#### [MODIFY] `server/controllers/Questions.js` → `getAllQuestions`
```js
// Accept: ?cursor=<lastId>&limit=15 alongside existing page for backward compat
// When cursor present:
const cursorQuery = cursor ? { ...query, _id: { $lt: new ObjectId(cursor) } } : query;
const questions = await Questions.find(cursorQuery).sort({ _id: -1 }).limit(limit + 1);
const hasMore = questions.length > limit;
const nextCursor = hasMore ? questions[limit - 1]._id : null;
```

#### [MODIFY] `client/src/components/Pagination/Pagination.jsx`
- Keep existing page-number UI as default
- Add optional `cursorMode` prop that renders "Load More" button instead

**Effort:** S · **Risk:** Low (backward compatible — old `page` param still works)

---

## Phase 12 — PWA Shell (P2)

**Problem confirmed by audit:** No `manifest.json`, no service worker. CRA already has built-in PWA support via `react-scripts`.

#### [NEW] `client/public/manifest.json`
```json
{
  "name": "Querious",
  "short_name": "Querious",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d1117",
  "theme_color": "#f48225",
  "icons": [...]
}
```

#### [MODIFY] `client/src/index.js`
- Change `serviceWorkerRegistration.unregister()` to `serviceWorkerRegistration.register()`
- Workbox pre-caches the app shell and API responses for `/questions/get` (stale-while-revalidate)

**Effort:** S · **Risk:** Low

---

## Sequencing Summary

```
Week 1–2:  Phase 1 (foundation fixes: pagination, notification category, isAdmin, trending tab, related questions)
Week 2–4:  Phase 2 (flagging system + outdated flags)
Week 3–5:  Phase 3 (badge catalog, UserBadgeAward model, trigger engine, badge UI)
Week 4–6:  Phase 4 (watch question, @mentions)
Week 5–7:  Phase 5 (notification prefs, digest mode)  ← needs Phase 1.2 done
Week 6–9:  Phase 6 (suggested edits)
Week 7–9:  Phase 8 (admin dashboard)  ← needs Phase 2 + Phase 6 done
Week 8–12: Phase 7 (trust levels)     ← needs Phase 2 done
Week 10+:  Phase 9 (rep ledger + daily cap)
Parallel:  Phase 10 (SEO meta tags — no dependencies, do alongside anything)
Parallel:  Phase 11 (cursor pagination — can be done any time)
Later:     Phase 12 (PWA)
```

---

## Files Changed Summary

### New Server Files
| File | Purpose |
|---|---|
| `server/models/Flag.js` | Flag/report model |
| `server/models/Badge.js` | Badge catalog (seeded) |
| `server/models/UserBadgeAward.js` | Per-user badge awards |
| `server/models/SuggestedEdit.js` | Edit proposals |
| `server/models/PendingDigest.js` | Email digest queue |
| `server/models/RepLedger.js` | Reputation audit trail |
| `server/controllers/flags.js` | Flag CRUD |
| `server/controllers/suggestedEdits.js` | Edit proposal workflow |
| `server/controllers/admin.js` | Admin dashboard data |
| `server/controllers/digest.js` | Digest cron handler |
| `server/utils/badgeEngine.js` | Badge trigger logic |
| `server/utils/trustLevelEngine.js` | Trust level computation |
| `server/middleware/requireAdmin.js` | Admin gate |
| `server/middleware/requireTrustLevel.js` | Trust-level gate |
| `server/routes/flags.js` | Flag routes |
| `server/routes/admin.js` | Admin routes |
| `server/routes/suggestedEdits.js` | Suggested edit routes |
| `server/seeds/badges.js` | Badge catalog seed script |

### Modified Server Files
| File | Changes |
|---|---|
| `server/models/auth.js` | Add `isAdmin`, `trustLevel`, `notificationPrefs` |
| `server/models/Questions.js` | Add `watchers[]` |
| `server/models/Answers.js` | Add `outdatedFlags[]`, `hidden` |
| `server/models/Notifications.js` | Add `category` |
| `server/controllers/Questions.js` | `getRelatedQuestions`, `toggleWatchQuestion`, `flagOutdated`, mention parse, hot sort, `getRepHistory` |
| `server/controllers/Answers.js` | `flagOutdated`, `clearOutdatedFlag`, mention parse, watcher fan-out |
| `server/controllers/users.js` | Pagination, `search` param, `getUserBadges`, `getUserRepHistory` |
| `server/utils/reputationHelper.js` | Badge counter derivation from `UserBadgeAward`, rep ledger, daily cap |
| `server/utils/notificationHelper.js` | Add `category` param, check prefs before send |
| `server/index.js` | Mount new routes |
| `server/middleware/auth.js` | Attach `req.user` object |

### New Client Files
| File | Purpose |
|---|---|
| `client/src/components/FlagModal/FlagModal.jsx` | Flag/report modal |
| `client/src/components/WatchButton/WatchButton.jsx` | Watch question toggle |
| `client/src/components/RightSidebar/WidgetRelatedQuestions.jsx` | Related questions widget |
| `client/src/hooks/useDocumentMeta.js` | Dynamic page title/meta |
| `client/src/Pages/Admin/AdminDashboard.jsx` | Admin dashboard |
| `client/src/Pages/Review/SuggestedEdits.jsx` | Edit review queue |
| `client/src/Pages/Settings/NotificationSettings.jsx` | Notification prefs |
| `client/src/Pages/UserProfile/BadgesTab.jsx` | Badges profile tab |
| `client/src/Pages/UserProfile/RepHistoryTab.jsx` | Reputation history tab |

### Modified Client Files
| File | Changes |
|---|---|
| `client/src/AllRoutes.jsx` | Add `/Admin`, `/Review/Edits`, `/Settings/Notifications`, `/Users/:id?tab=badges` routes |
| `client/src/App.js` | Remove global `fetchAllUsers()` |
| `client/src/api/index.js` | New endpoints for all features |
| `client/src/reducers/users.js` | Paginated shape |
| `client/src/reducers/notifications.js` | Handle `category` in payload |
| `client/src/components/HomeMainbar/HomeMainbar.jsx` | Add "🔥 Trending" tab |
| `client/src/components/UserBadge/UserBadge.jsx` | Add badge name tooltips |
| `client/src/Pages/UserProfile/UserProfile.jsx` | Add Badges + Rep History tabs |

---

## Explicit Non-Goals (unchanged from original plan)
- No MongoDB migration (all changes are additive schema fields)
- No framework migration (React + Express stays)
- No custom vector DB (Atlas Vector Search only if embedding is added later)
- No full LLM auto-answering
- No monetization features

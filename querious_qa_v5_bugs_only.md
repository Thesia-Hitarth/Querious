Pre-Existing Issues (not introduced by this push, but worth noting)
Wrong HTTP status on auth errors in server/controllers/auth.js — these existed before this push:

"User already Exist" returns 404 → should be 409 Conflict
"User don't Exist" returns 404 → OK for security (intentional enumeration prevention), but the typo "don't" should be
"doesn't"

/reset-password route has no validation middleware — newPassword is not validated for strength or minimum length before
being hashed. A user could reset to a 1-character password. Since signupValidationRules enforces strength on signup,
this inconsistency should be closed.
CLIENT_URL env var not set on Vercel — CORS in server/index.js defaults to http://localhost:3000 if CLIENT_URL is
missing in production. If that env var isn't set in Vercel's dashboard, all credentialed requests from the live domain
will be CORS-blocked.


CRITICAL
Answer route uses PATCH for POST — conflicts with delete endpoint
server/routes/Answers.js · lines 9 & 10
Both POST /answer/post/:id (post answer) and PATCH /answer/delete/:id (delete answer) use PATCH. The post-answer route should be POST, not PATCH. This means posting answers uses the wrong HTTP method — semantic mismatch can cause proxy/CDN routing failures and confuses clients.
Fix: Change router.patch("/post/:id", …) → router.post("/post/:id", …) and update client/src/api/index.js to use API.post for postAnswer (already correct client-side — mismatch exists server-side).


CRITICAL
noOfAnswers can go negative / get out of sync
server/controllers/Answers.js · deleteAnswer
When an answer is deleted, $inc: { noOfAnswers: -1 } is called with no guard against the value going below 0. If data is ever corrupted or a delete is retried, the count drifts to -1 or lower, breaking the "no answers" filter and answer count display.
Fix: Use $max: [0, { $subtract: ["$noOfAnswers", 1] }] via an aggregation pipeline update, or guard with $inc: { noOfAnswers: -1 }, { $min: [0, …] }. Simpler: Questions.findByIdAndUpdate(questionId, { $inc: { noOfAnswers: -1 }, $max: { noOfAnswers: 0 } }) — or add a post-delete recount.

MAJOR
Password hashed twice on reset
server/controllers/auth.js · resetPassword
The resetToken (a JWT string) is compared with bcrypt.compare(token, user.resetPasswordToken) — but at generation time, bcrypt.hash(resetToken, 10) was stored. This is correct. However, the JWT itself is sent in the URL and compared raw. The issue: if the reset link is accessed twice (user clicks twice), the second attempt's bcrypt comparison against the already-deleted token field returns 400 with a misleading "invalid token" error rather than "already used". More critically, there is no explicit 1-time-use invalidation after a successful reset — the token fields are cleared via undefined, which works but only if save() succeeds atomically.
Fix: After verification, immediately clear resetPasswordToken/Expires and save() before updating the password — prevents any race-condition window where a second request could also pass verification.

MAJOR
Signup returns 404 (not 409) for duplicate users
server/controllers/auth.js · signup · line 7
res.status(404).json({ message: "User already Exist." }) — HTTP 404 means "Not Found". Duplicate user should be 409 Conflict. This causes the client to show wrong error UI and may break any future middleware that branches on status code.
Fix: Change to res.status(409).json(…).

MAJOR
AskQuestion similar-questions panel passes AbortController signal incorrectly
client/src/Pages/AskQuestion/AskQuestion.jsx · useEffect line ~55
getAllQuestions({ … }, { signal: controller.signal }) — but the API function signature is getAllQuestions(params, cancelToken) (axios CancelToken), not an AbortController signal. Axios <1.x doesn't support AbortController natively. The abort never fires, so requests pile up on fast typing — the old "race condition" the comment says was fixed is still present.
Fix: Either upgrade to axios ≥1.1 (which supports signal), or switch back to axios.CancelToken: create a source in the effect, pass source.token, and call source.cancel() on cleanup. Check your axios version in client/package.json.

MAJOR
voteQuestion dispatches fetchAllQuestions unnecessarily on every vote
client/src/actions/question.js · voteQuestion
dispatch(fetchAllQuestions()) is called after every up/downvote on a question. This re-fetches the full paginated question list (15 items + DB round-trip) when only the single question's vote count changed. On the question detail page this is wasteful, causes a flash/re-render of unrelated data, and can overwrite the currently paginated page.
Fix: Remove dispatch(fetchAllQuestions()) from voteQuestion. fetchQuestionDetails(id) already updates the question in the list via the reducer's FETCH_QUESTION_DETAILS case.

MAJOR
Comment delete has no confirmation modal — accidental deletion
client/src/components/Comments/Comments.jsx · handleDeleteComment
Clicking the × button on a comment immediately dispatches the delete action — no confirmation step. Questions and answers both have ConfirmationModal, but comment deletion is instant and irreversible.
Fix: Wrap comment delete dispatch in a window.confirm() or reuse the existing ConfirmationModal component (already imported in the pattern) — add a state like pendingDeleteCommentId.

MINOR
Questions model userId is String but savedQuestions uses ObjectId
server/models/Questions.js vs server/models/auth.js
userId on Questions/Answers is typed as String, while savedQuestions in auth model uses ObjectId ref. Mixed typing causes issues if any query tries to match userId using ObjectId equality. String comparison works currently, but is fragile.
Fix: Standardize userId across all models to mongoose.Schema.Types.ObjectId with a ref, or keep all as String consistently.

MINOR
Notification model missing mongoose index on userId
server/models/Notifications.js
getNotifications queries { userId } on every poll (every 30s in serverless mode). Without an index, this is a full collection scan. As notifications grow this will slow down significantly.
Fix: Add NotificationSchema.index({ userId: 1, createdAt: -1 }).

MINOR
CSP in vercel.json blocks ReactQuill's inline styles
vercel.json · Content-Security-Policy header
The CSP sets style-src 'self' 'unsafe-inline' which allows inline styles, but script-src 'self' without 'unsafe-eval' may break ReactQuill in some environments (Quill uses eval-based delta compilation in older versions). Monitor for console CSP errors post-deploy.
Fix: Add 'unsafe-eval' to script-src only if ReactQuill reports CSP errors. Alternatively, upgrade to a CSP-compliant Quill build.

MINOR
updateProfile action doesn't throw on error — silent failure
client/src/actions/users.js · updateProfile
The catch block only logs to console. The UI calling this action has no way to know the update failed — no toast, no thrown error. The profile page will appear to succeed silently.
Fix: Add throw error in the catch block so callers can handle it, or dispatch an error toast directly from the action.

MINOR
fetchAllUsers called after every toggleSaveQuestion
client/src/actions/users.js · toggleSaveQuestion
dispatch(fetchAllUsers()) is called after every bookmark toggle, re-fetching all users from DB. This is only needed to update the logged-in user's savedQuestions — which is already done via UPDATE_SAVED_QUESTIONS. Unnecessary network call on every save/unsave.
Fix: Remove dispatch(fetchAllUsers()) from toggleSaveQuestion.

MINOR
node_modules committed to repo
GitHub repo root
The node_modules/ folder appears in the repo file tree. This massively inflates the repo size, slows clones, and causes confusing diffs. It should be in .gitignore.
Fix: Add node_modules to root .gitignore, then run git rm -r --cached node_modules and commit.
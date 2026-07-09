import axios from "axios";

// baseURL: "http://localhost:5000/"

const hostname = window.location.hostname;

// U-02: Warn loudly in production when REACT_APP_API_URL is not configured.
// If the backend is on a different domain (Railway, Render, separate Vercel project),
// the window.location.origin fallback will point at the wrong server and all API
// calls will silently 404. Set REACT_APP_API_URL in your Vercel environment variables.
if (!process.env.REACT_APP_API_URL && hostname !== "localhost") {
  console.warn(
    "[Querious] REACT_APP_API_URL is not set. " +
    "Falling back to window.location.origin (" + window.location.origin + "). " +
    "If your API is hosted on a different domain, set REACT_APP_API_URL in your .env file."
  );
}

const API = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    (hostname === "localhost"
      ? "http://localhost:5000"
      : window.location.origin),
  withCredentials: true,
});

API.interceptors.request.use((req) => {
  if (localStorage.getItem("Profile")) {
    req.headers.authorization = `Bearer ${
      JSON.parse(localStorage.getItem("Profile")).token
    }`;
  }
  return req;
});

export const logIn = (authData) => API.post("/user/login", authData);
export const signUp = (authData) => API.post("/user/signup", authData);

export const postQuestion = (questionData) =>
  API.post("/questions/Ask", questionData);
export const getAllQuestions = (params, axiosConfig = {}) => API.get("/questions/get", { params, ...axiosConfig });
export const getQuestionDetails = (id) => API.get(`/questions/get/${id}`);
export const deleteQuestion = (id) => API.delete(`/questions/delete/${id}`);
export const updateQuestion = (id, questionData) => API.put(`/questions/${id}`, questionData);
export const voteQuestion = (id, value) =>
  API.patch(`/questions/vote/${id}`, { value });
export const getRelatedQuestions = (id) => API.get(`/questions/${id}/related`);
export const watchQuestion = (id) => API.post(`/questions/${id}/watch`);

export const postAnswer = (id, noOfAnswers, answerBody, userAnswered) =>
  API.post(`/answer/post/${id}`, { answerBody, userAnswered });
export const deleteAnswer = (answerId) =>
  API.delete(`/answer/${answerId}`);
export const updateAnswer = (id, answerData) => API.put(`/answer/${id}`, answerData);
export const voteAnswer = (id, value) => API.post(`/answer/${id}/vote`, { value });
export const acceptAnswer = (id) => API.patch(`/answer/${id}/accept`);
export const flagAnswerOutdated = (answerId, reason) => API.post(`/answer/${answerId}/outdated`, { reason });
export const clearAnswerOutdatedFlags = (answerId) => API.delete(`/answer/${answerId}/outdated`);

export const commentQuestion = (id, commentBody) => API.post(`/questions/${id}/comment`, { commentBody });
export const deleteCommentQuestion = (id, commentId) => API.delete(`/questions/${id}/comment/${commentId}`);
export const commentAnswer = (id, commentBody) => API.post(`/answer/${id}/comment`, { commentBody });
export const deleteCommentAnswer = (id, commentId) => API.delete(`/answer/${id}/comment/${commentId}`);

export const toggleSaveQuestion = (userId, questionId) => API.post(`/user/${userId}/save`, { questionId });
export const getTagsAggregation = () => API.get("/questions/tags");

export const getAllUsers = (params) => API.get("/user/getAllUsers", { params });
export const getUserDetails = (id) => API.get(`/user/${id}`);
export const getUserBadges = (userId) => API.get(`/user/${userId}/badges`);
export const getUserReputation = (userId) => API.get(`/user/${userId}/reputation`);
export const getUserQuestions = (userId, params) => API.get(`/user/${userId}/questions`, { params });
export const getUserAnswers = (userId, params) => API.get(`/user/${userId}/answers`, { params });
export const updateProfile = (id, updateData) =>
  API.patch(`/user/update/${id}`, updateData);

export const getNotifications = () => API.get("/notifications");
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.patch("/notifications/read-all");

export const forgotPassword = (email) => API.post("/user/forgot-password", { email });
export const resetPassword = (token, newPassword) => API.post("/user/reset-password", { token, newPassword });
export const changePassword = (passwordData) => API.put("/user/change-password", passwordData);

export const getSuggestedEdits = () => API.get("/suggested-edits");
export const approveSuggestedEdit = (id) => API.post(`/suggested-edits/${id}/approve`);
export const rejectSuggestedEdit = (id, rejectionReason) => API.post(`/suggested-edits/${id}/reject`, { rejectionReason });

export const getAdminStats = () => API.get("/admin/stats");
export const submitFlag = (flagData) => API.post("/flags", flagData);

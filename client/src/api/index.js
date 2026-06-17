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
export const getAllQuestions = (params, cancelToken) => API.get("/questions/get", { params, cancelToken });
export const getQuestionDetails = (id) => API.get(`/questions/get/${id}`);
export const deleteQuestion = (id) => API.delete(`/questions/delete/${id}`);
export const updateQuestion = (id, questionData) => API.put(`/questions/${id}`, questionData);
export const voteQuestion = (id, value) =>
  API.patch(`/questions/vote/${id}`, { value });

export const postAnswer = (id, noOfAnswers, answerBody, userAnswered) =>
  API.patch(`/answer/post/${id}`, { answerBody, userAnswered });
export const deleteAnswer = (id, answerId) =>
  API.patch(`/answer/delete/${id}`, { answerId });
export const updateAnswer = (id, answerData) => API.put(`/answer/${id}`, answerData);
export const voteAnswer = (id, value) => API.post(`/answer/${id}/vote`, { value });
export const acceptAnswer = (id) => API.patch(`/answer/${id}/accept`);

export const commentQuestion = (id, commentBody) => API.post(`/questions/${id}/comment`, { commentBody });
export const deleteCommentQuestion = (id, commentId) => API.delete(`/questions/${id}/comment/${commentId}`);
export const commentAnswer = (id, commentBody) => API.post(`/answer/${id}/comment`, { commentBody });
export const deleteCommentAnswer = (id, commentId) => API.delete(`/answer/${id}/comment/${commentId}`);

export const toggleSaveQuestion = (userId, questionId) => API.post(`/user/${userId}/save`, { questionId });
export const getTagsAggregation = () => API.get("/questions/tags");

export const getAllUsers = () => API.get("/user/getAllUsers");
export const getUserDetails = (id) => API.get(`/user/${id}`);
export const updateProfile = (id, updateData) =>
  API.patch(`/user/update/${id}`, updateData);

export const getNotifications = () => API.get("/notifications");
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.patch("/notifications/read-all");

export const forgotPassword = (email) => API.post("/user/forgot-password", { email });
export const resetPassword = (token, newPassword) => API.post("/user/reset-password", { token, newPassword });

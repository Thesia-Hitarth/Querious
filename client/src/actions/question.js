import * as api from "../api/index";
import axios from "axios";

export const askQuestion = (questionData, navigate) => async (dispatch) => {
  try {
    const { data } = await api.postQuestion(questionData);
    dispatch({ type: "POST_QUESTION", payload: data });
    // BUG-03: await so the list is refreshed before navigating home
    await dispatch(fetchAllQuestions());
    navigate("/");
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchAllQuestions = (params = {}, axiosConfig = {}) => async (dispatch) => {
  try {
    const { data } = await api.getAllQuestions(params, axiosConfig);
    dispatch({ type: "FETCH_ALL_QUESTIONS", payload: data });
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else {
      console.error(error);
    }
    throw error;
  }
};

export const fetchQuestionDetails = (id) => async (dispatch) => {
  try {
    const { data } = await api.getQuestionDetails(id);
    dispatch({ type: "FETCH_QUESTION_DETAILS", payload: data });
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteQuestion = (id, navigate) => async (dispatch) => {
  try {
    const { data } = await api.deleteQuestion(id);
    dispatch(fetchAllQuestions());
    navigate("/");
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateQuestion = (id, questionData) => async (dispatch) => {
  try {
    const { data } = await api.updateQuestion(id, questionData);
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const voteQuestion = (id, value) => async (dispatch) => {
  try {
    const { data } = await api.voteQuestion(id, value);
    // fetchQuestionDetails updates the single question in the store —
    // no need to re-fetch the entire paginated question list.
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const postAnswer = (answerData) => async (dispatch) => {
  try {
    const { id, answerBody, userAnswered } = answerData;
    const { data } = await api.postAnswer(
      id,
      0, // noOfAnswers parameter is ignored by server-side now
      answerBody,
      userAnswered
    );
    dispatch({ type: "POST_ANSWER", payload: data });
    // BUG-02: fetchAllQuestions() removed — it reset pagination on every answer post.
    // fetchQuestionDetails keeps the current question page in sync.
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteAnswer = (id, answerId) => async (dispatch) => {
  try {
    const { data } = await api.deleteAnswer(id, answerId);
    // BUG-02: fetchAllQuestions() removed — it reset pagination on every answer delete.
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateAnswer = (id, answerId, answerData) => async (dispatch) => {
  try {
    const { data } = await api.updateAnswer(answerId, answerData);
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const voteAnswer = (id, answerId, value) => async (dispatch) => {
  try {
    const { data } = await api.voteAnswer(answerId, value);
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const acceptAnswer = (id, answerId) => async (dispatch) => {
  try {
    const { data } = await api.acceptAnswer(answerId);
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const commentQuestion = (id, commentBody) => async (dispatch) => {
  try {
    const { data } = await api.commentQuestion(id, commentBody);
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteCommentQuestion = (id, commentId) => async (dispatch) => {
  try {
    const { data } = await api.deleteCommentQuestion(id, commentId);
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const commentAnswer = (id, answerId, commentBody) => async (dispatch) => {
  try {
    const { data } = await api.commentAnswer(answerId, commentBody);
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteCommentAnswer = (id, answerId, commentId) => async (dispatch) => {
  try {
    const { data } = await api.deleteCommentAnswer(answerId, commentId);
    dispatch(fetchQuestionDetails(id));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchTagsAggregation = () => async (dispatch) => {
  try {
    const { data } = await api.getTagsAggregation();
    dispatch({ type: "FETCH_TAGS_AGGREGATION", payload: data });
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

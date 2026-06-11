import * as api from "../api/index";

export const askQuestion = (questionData, navigate) => async (dispatch) => {
  try {
    const { data } = await api.postQuestion(questionData);
    dispatch({ type: "POST_QUESTION", payload: data });
    dispatch(fetchAllQuestions());
    navigate("/");
  } catch (error) {
    console.error(error);
  }
};

export const fetchAllQuestions = (params = {}) => async (dispatch) => {
  try {
    const { data } = await api.getAllQuestions(params);
    dispatch({ type: "FETCH_ALL_QUESTIONS", payload: data });
  } catch (error) {
    console.error(error);
  }
};

export const fetchQuestionDetails = (id) => async (dispatch) => {
  try {
    const { data } = await api.getQuestionDetails(id);
    dispatch({ type: "FETCH_QUESTION_DETAILS", payload: data });
  } catch (error) {
    console.error(error);
  }
};

export const deleteQuestion = (id, navigate) => async (dispatch) => {
  try {
    await api.deleteQuestion(id);
    dispatch(fetchAllQuestions());
    navigate("/");
  } catch (error) {
    console.error(error);
  }
};

export const updateQuestion = (id, questionData, navigate) => async (dispatch) => {
  try {
    await api.updateQuestion(id, questionData);
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
  }
};

export const voteQuestion = (id, value) => async (dispatch) => {
  try {
    await api.voteQuestion(id, value);
    dispatch(fetchAllQuestions());
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
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
    dispatch(fetchAllQuestions());
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
  }
};

export const deleteAnswer = (id, answerId) => async (dispatch) => {
  try {
    await api.deleteAnswer(id, answerId);
    dispatch(fetchAllQuestions());
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
  }
};

export const updateAnswer = (id, answerId, answerData) => async (dispatch) => {
  try {
    await api.updateAnswer(answerId, answerData);
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
  }
};

export const voteAnswer = (id, answerId, value) => async (dispatch) => {
  try {
    await api.voteAnswer(answerId, value);
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
  }
};

export const acceptAnswer = (id, answerId) => async (dispatch) => {
  try {
    await api.acceptAnswer(answerId);
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
  }
};

export const commentQuestion = (id, commentBody) => async (dispatch) => {
  try {
    await api.commentQuestion(id, commentBody);
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
  }
};

export const deleteCommentQuestion = (id, commentId) => async (dispatch) => {
  try {
    await api.deleteCommentQuestion(id, commentId);
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
  }
};

export const commentAnswer = (id, answerId, commentBody) => async (dispatch) => {
  try {
    await api.commentAnswer(answerId, commentBody);
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
  }
};

export const deleteCommentAnswer = (id, answerId, commentId) => async (dispatch) => {
  try {
    await api.deleteCommentAnswer(answerId, commentId);
    dispatch(fetchQuestionDetails(id));
  } catch (error) {
    console.error(error);
  }
};

export const fetchTagsAggregation = () => async (dispatch) => {
  try {
    const { data } = await api.getTagsAggregation();
    dispatch({ type: "FETCH_TAGS_AGGREGATION", payload: data });
  } catch (error) {
    console.error(error);
  }
};


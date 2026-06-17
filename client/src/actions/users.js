import * as api from "../api";

export const fetchAllUsers = () => async (dispatch) => {
  try {
    const { data } = await api.getAllUsers();
    dispatch({ type: "FETCH_USERS", payload: data });
  } catch (error) {
    console.log(error);
  }
};
export const updateProfile = (id, updateData) => async (dispatch) => {
  try {
    const { data } = await api.updateProfile(id, updateData);
    dispatch({ type: "UPDATE_CURRENT_USER", payload: data });

    // Sync localStorage Profile data
    const localProfile = JSON.parse(localStorage.getItem("Profile"));
    if (localProfile && localProfile.result && localProfile.result._id === id) {
      localProfile.result = data;
      localStorage.setItem("Profile", JSON.stringify(localProfile));
      dispatch({ type: "FETCH_CURRENT_USER", payload: localProfile });
    }
  } catch (error) {
    console.log(error);
  }
};

export const toggleSaveQuestion = (userId, questionId) => async (dispatch) => {
  try {
    const { data } = await api.toggleSaveQuestion(userId, questionId);
    
    // Sync localStorage
    const localProfile = JSON.parse(localStorage.getItem("Profile"));
    if (localProfile && localProfile.result) {
      localProfile.result.savedQuestions = data.savedQuestions;
      localStorage.setItem("Profile", JSON.stringify(localProfile));
    }
    
    dispatch({ type: "UPDATE_SAVED_QUESTIONS", payload: data.savedQuestions });
    dispatch(fetchAllUsers());
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchUserDetails = (id) => async (dispatch) => {
  try {
    const { data } = await api.getUserDetails(id);
    dispatch({ type: "FETCH_USER_DETAILS", payload: data });
  } catch (error) {
    console.error(error);
  }
};

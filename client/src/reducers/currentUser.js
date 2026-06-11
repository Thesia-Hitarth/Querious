const currentUserReducer = (state = null, action) => {
  switch (action.type) {
    case "FETCH_CURRENT_USER":
      return action.payload;
    case "UPDATE_SAVED_QUESTIONS":
      if (!state || !state.result) return state;
      return {
        ...state,
        result: {
          ...state.result,
          savedQuestions: action.payload,
        },
      };
    default:
      return state;
  }
};

export default currentUserReducer;

const currentUserReducer = (state = null, action) => {
  switch (action.type) {
    case "FETCH_CURRENT_USER":
      return action.payload;
    case "UPDATE_CURRENT_USER":
      // M-01 fix: Profile edits now reflect immediately in the logged-in user's
      // in-memory state without depending on the localStorage round-trip.
      if (!state || !state.result) return state;
      return {
        ...state,
        result: { ...state.result, ...action.payload },
      };
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

const questionsReducer = (
  state = {
    data: null,
    totalPages: 1,
    currentPage: 1,
    searchQuery: "",
    tagsAggregation: [],
    totalCount: 0,
    totalSiteQuestions: 0,
    totalSiteAnswers: 0,
  },
  action
) => {
  switch (action.type) {
    case "POST_QUESTION":
      return { ...state };
    case "POST_ANSWER":
      return { ...state };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "FETCH_TAGS_AGGREGATION":
      return { ...state, tagsAggregation: action.payload };
    case "FETCH_ALL_QUESTIONS":
      return {
        ...state,
        data: action.payload.data,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage,
        totalCount: action.payload.totalCount || 0,
        totalSiteQuestions: action.payload.totalSiteQuestions || 0,
        totalSiteAnswers: action.payload.totalSiteAnswers || 0,
        totalSiteUsers: action.payload.totalSiteUsers || 0,
      };
    case "FETCH_QUESTION_DETAILS":
      const currentData = state.data || [];
      const exists = currentData.some((q) => q._id === action.payload._id);
      return {
        ...state,
        data: exists
          ? currentData.map((q) =>
              q._id === action.payload._id ? action.payload : q
            )
          : [...currentData, action.payload],
      };
    default:
      return state;
  }
};
export default questionsReducer;

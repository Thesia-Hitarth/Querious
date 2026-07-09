const usersReducer = (
  state = {
    data: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
  },
  action
) => {
  switch (action.type) {
    case "FETCH_USERS":
      return {
        ...state,
        data: action.payload.data || [],
        totalCount: action.payload.totalCount || 0,
        totalPages: action.payload.totalPages || 1,
        currentPage: action.payload.currentPage || 1,
      };
    case "UPDATE_CURRENT_USER":
      return {
        ...state,
        data: state.data.map((user) =>
          user._id === action.payload._id ? action.payload : user
        ),
      };
    default:
      return state;
  }
};

export default usersReducer;

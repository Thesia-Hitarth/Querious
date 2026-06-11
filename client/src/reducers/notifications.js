const notificationsReducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case "FETCH_NOTIFICATIONS":
      return { ...state, data: action.payload };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        data: state.data.map((n) =>
          n._id === action.payload ? { ...n, read: true } : n
        ),
      };
    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        data: state.data.map((n) => ({ ...n, read: true })),
      };
    case "ADD_NOTIFICATION":
      // Prepend the new notification to the list
      return {
        ...state,
        data: [action.payload, ...state.data],
      };
    default:
      return state;
  }
};

export default notificationsReducer;

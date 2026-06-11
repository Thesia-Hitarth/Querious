import { combineReducers } from "redux";
import authReducer from "./auth";
import currentUserReducer from "./currentUser";
import questionsReducer from "./questions";
import usersReducer from "./users";
import notificationsReducer from "./notifications";
import userDetailsReducer from "./userDetails";

export default combineReducers({
  authReducer,
  currentUserReducer,
  questionsReducer,
  usersReducer,
  notificationsReducer,
  userDetailsReducer,
});

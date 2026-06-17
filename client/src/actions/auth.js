import * as api from "../api";
import { setCurrentUser } from "./currentUser";
import { fetchAllUsers } from "./users";

export const signup = (authData, navigate, from = "/") => async (dispatch) => {
  try {
    const { data } = await api.signUp(authData);
    dispatch({ type: "AUTH", data });
    dispatch(setCurrentUser(JSON.parse(localStorage.getItem("Profile"))));
    dispatch(fetchAllUsers());
    navigate(from, { replace: true });
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const login = (authData, navigate, from = "/") => async (dispatch) => {
  try {
    const { data } = await api.logIn(authData);
    dispatch({ type: "AUTH", data });
    dispatch(setCurrentUser(JSON.parse(localStorage.getItem("Profile"))));
    navigate(from, { replace: true });
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

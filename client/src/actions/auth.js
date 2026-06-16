import * as api from "../api";
import { setCurrentUser } from "./currentUser";
import { fetchAllUsers } from "./users";

export const signup = (authData, navigate, redirectPath = "/") => async (dispatch) => {
  try {
    const { data } = await api.signUp(authData);
    dispatch({ type: "AUTH", data });
    dispatch(setCurrentUser(JSON.parse(localStorage.getItem("Profile"))));
    dispatch(fetchAllUsers());
    navigate(redirectPath);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const login = (authData, navigate, redirectPath = "/") => async (dispatch) => {
  try {
    const { data } = await api.logIn(authData);
    dispatch({ type: "AUTH", data });
    dispatch(setCurrentUser(JSON.parse(localStorage.getItem("Profile"))));
    navigate(redirectPath);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

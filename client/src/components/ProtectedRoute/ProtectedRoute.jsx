import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const User = useSelector((state) => state.currentUserReducer);
  const location = useLocation();

  if (User === null) {
    // Redirect to login page and pass the intended destination as location state
    return (
      <Navigate
        to="/Auth"
        state={{
          from: location,
          message: "Please log in or sign up to ask a question",
        }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;

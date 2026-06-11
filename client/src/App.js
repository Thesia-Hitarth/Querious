import { BrowserRouter as Router } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import AllRoutes from "./AllRoutes";
import { fetchAllQuestions } from "./actions/question";
import { fetchAllUsers } from "./actions/users";
import { fetchNotifications } from "./actions/notifications";

import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

function App() {
  const dispatch = useDispatch();
  const User = useSelector((state) => state.currentUserReducer);

  useEffect(() => {
    dispatch(fetchAllQuestions());
    dispatch(fetchAllUsers());
  }, [dispatch]);

  useEffect(() => {
    if (User?.result?._id) {
      // Connect to the API server
      const apiUrl = window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://stack-overflow-clone-server-ql8j.onrender.com/";
      
      const socket = io(apiUrl);
      socket.emit("join", User.result._id);

      socket.on("notification", (notif) => {
        dispatch({ type: "ADD_NOTIFICATION", payload: notif });
      });

      dispatch(fetchNotifications());

      return () => {
        socket.disconnect();
      };
    }
  }, [User?.result?._id, dispatch]);

  const [slideIn, setSlideIn] = useState(true);

  useEffect(() => {
    if (window.innerWidth <= 760) {
      setSlideIn(false);
    }
  }, []);

  const handleSlideIn = () => {
    if (window.innerWidth <= 760) {
      setSlideIn((state) => !state);
    }
  };

  return (
    <div className="App">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar handleSlideIn={handleSlideIn} />
        <ErrorBoundary>
          <AllRoutes slideIn={slideIn} handleSlideIn={handleSlideIn} />
        </ErrorBoundary>
      </Router>
    </div>
  );
}

export default App;

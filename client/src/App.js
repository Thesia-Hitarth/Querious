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
import { ToastProvider } from "./components/Toast/ToastContext";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

function App() {
  const dispatch = useDispatch();
  const User = useSelector((state) => state.currentUserReducer);

  useEffect(() => {
    dispatch(fetchAllQuestions());
    dispatch(fetchAllUsers());
  }, [dispatch]);

  useEffect(() => {
    if (User?.result?._id) {
      dispatch(fetchNotifications());

      const enableSocket = process.env.REACT_APP_ENABLE_SOCKET === "true" || window.location.hostname === "localhost";

      if (enableSocket) {
        const apiUrl = window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : window.location.origin;

        const socket = io(apiUrl);
        socket.emit("join", User.result._id);

        socket.on("notification", (notif) => {
          dispatch({ type: "ADD_NOTIFICATION", payload: notif });
        });

        return () => {
          socket.disconnect();
        };
      } else {
        // Fallback polling for serverless deployment
        const interval = setInterval(() => {
          dispatch(fetchNotifications());
        }, 30000);

        return () => {
          clearInterval(interval);
        };
      }
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
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navbar handleSlideIn={handleSlideIn} />
          <ErrorBoundary>
            <AllRoutes slideIn={slideIn} handleSlideIn={handleSlideIn} />
          </ErrorBoundary>
          <ScrollToTop />
        </Router>
      </ToastProvider>
    </div>
  );
}

export default App;

import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import LoadingSkeleton from "./components/LoadingSkeleton/LoadingSkeleton";

const Home = lazy(() => import("./Pages/Home/Home"));
const Auth = lazy(() => import("./Pages/Auth/Auth"));
const Questions = lazy(() => import("./Pages/Questions/Questions"));
const AskQuestion = lazy(() => import("./Pages/AskQuestion/AskQuestion"));
const DisplayQuestion = lazy(() => import("./Pages/Questions/DisplayQuestion"));
const Tags = lazy(() => import("./Pages/Tags/Tags"));
const TagQuestions = lazy(() => import("./Pages/Tags/TagQuestions"));
const Users = lazy(() => import("./Pages/Users/Users"));
const UserProfile = lazy(() => import("./Pages/UserProfile/UserProfile"));
const ResetPassword = lazy(() => import("./Pages/Auth/ResetPassword"));
const Blogs = lazy(() => import("./Pages/Blogs/Blogs"));

const AllRoutes = ({ slideIn, handleSlideIn }) => {
  return (
    <Suspense fallback={<LoadingSkeleton type="question-list" count={4} />}>
      <Routes>
        <Route
          path="/"
          element={<Home slideIn={slideIn} handleSlideIn={handleSlideIn} />}
        />
        <Route path="/Auth" element={<Auth />} />
        <Route path="/AskQuestion" element={<AskQuestion />} />
        <Route
          path="/Questions"
          element={<Questions slideIn={slideIn} handleSlideIn={handleSlideIn} />}
        />
        <Route
          path="/Questions/:id"
          element={
            <DisplayQuestion slideIn={slideIn} handleSlideIn={handleSlideIn} />
          }
        />
        <Route
          path="/Tags"
          element={<Tags slideIn={slideIn} handleSlideIn={handleSlideIn} />}
        />
        <Route
          path="/Tags/:tag"
          element={<TagQuestions slideIn={slideIn} handleSlideIn={handleSlideIn} />}
        />
        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />
        <Route
          path="/Users"
          element={<Users slideIn={slideIn} handleSlideIn={handleSlideIn} />}
        />
        <Route
          path="/Users/:id"
          element={
            <UserProfile slideIn={slideIn} handleSlideIn={handleSlideIn} />
          }
        />
        <Route
          path="/Blogs"
          element={<Blogs slideIn={slideIn} handleSlideIn={handleSlideIn} />}
        />
        <Route
          path="/Blogs/:id"
          element={<Blogs slideIn={slideIn} handleSlideIn={handleSlideIn} />}
        />
      </Routes>
    </Suspense>
  );
};

export default AllRoutes;

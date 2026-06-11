import React from "react";
import { useParams } from "react-router-dom";
import "../../App.css";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import RightSidebar from "../../components/RightSidebar/RightSidebar";
import HomeMainbar from "../../components/HomeMainbar/HomeMainbar";

const TagQuestions = ({ slideIn, handleSlideIn }) => {
  const { tag } = useParams();

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2">
        <HomeMainbar tag={tag} />
        <RightSidebar />
      </div>
    </div>
  );
};

export default TagQuestions;

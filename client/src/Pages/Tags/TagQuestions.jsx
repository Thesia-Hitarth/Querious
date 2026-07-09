import React from "react";
import { useParams, Link } from "react-router-dom";
import "../../App.css";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import RightSidebar from "../../components/RightSidebar/RightSidebar";
import HomeMainbar from "../../components/HomeMainbar/HomeMainbar";
import { COLLECTIVES } from "../../constants/collectives";
import CollectiveIcon from "../../components/CollectiveIcon/CollectiveIcon";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";

const TagQuestions = ({ slideIn, handleSlideIn }) => {
  const { tag } = useParams();

  useDocumentMeta({
    title: `Questions tagged [${tag}]`,
    description: `Browse developer questions and answers tagged with [${tag}] on Querious.`,
    keywords: `${tag}, questions, answers, coding, developer`,
  });

  const matchedCollective = COLLECTIVES.find((c) =>
    c.tags.includes(tag?.toLowerCase())
  );

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2">
        <div className="tag-questions-main-content" style={{ flex: 1, minWidth: 0 }}>
          {matchedCollective && (
            <div className="tag-collective-cta">
              <CollectiveIcon name={matchedCollective.name} iconClass={matchedCollective.iconClass} size={24} />
              <span className="cta-text">
                This topic has an active Collective —{" "}
                <Link to={`/Collectives/${matchedCollective.id}`}>
                  Join {matchedCollective.name} →
                </Link>
              </span>
            </div>
          )}
          <HomeMainbar tag={tag} />
        </div>
        <RightSidebar />
      </div>
    </div>
  );
};

export default TagQuestions;

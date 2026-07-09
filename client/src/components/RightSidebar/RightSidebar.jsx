import React from "react";
import { useParams } from "react-router-dom";
import "./RightSidebar.css";
import Widget from "./Widget";
import WidgetTags from "./WidgetTags";
import WidgetCollectives from "./WidgetCollectives";
import WidgetLeaderboard from "./WidgetLeaderboard";
import WidgetRelatedQuestions from "./WidgetRelatedQuestions";

const RightSidebar = () => {
  const { id } = useParams();

  return (
    <aside className="right-sidebar">
      {id && <WidgetRelatedQuestions questionId={id} />}
      <WidgetLeaderboard />
      <Widget />
      <WidgetTags />
      <WidgetCollectives />
    </aside>
  );
};


export default RightSidebar;

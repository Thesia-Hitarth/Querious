import React from "react";
import "./RightSidebar.css";
import Widget from "./Widget";
import WidgetTags from "./WidgetTags";
import WidgetCollectives from "./WidgetCollectives";
import WidgetLeaderboard from "./WidgetLeaderboard";

const RightSidebar = () => {
  return (
    <aside className="right-sidebar">
      <WidgetLeaderboard />
      <Widget />
      <WidgetTags />
      <WidgetCollectives />
    </aside>
  );
};


export default RightSidebar;

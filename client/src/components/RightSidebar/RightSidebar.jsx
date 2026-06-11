import React from "react";
import "./RightSidebar.css";
import Widget from "./Widget";
import WidgetTags from "./WidgetTags";
import WidgetCollectives from "./WidgetCollectives";

const RightSidebar = () => {
  return (
    <aside className="right-sidebar">
      <Widget />
      <WidgetTags />
      <WidgetCollectives />
    </aside>
  );
};

export default RightSidebar;

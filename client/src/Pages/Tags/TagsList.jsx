import React from "react";
import { Link } from "react-router-dom";
import "./Tags.css";

const TagsList = ({ tag }) => {
  return (
    <Link to={`/Tags/${tag.tagName}`} className="tag-link-wrapper">
      <div className="tag">
        <h5>{tag.tagName}</h5>
        {tag.count !== undefined && <span className="tag-count"> ({tag.count})</span>}
        <p>{tag.tagDesc}</p>
      </div>
    </Link>
  );
};

export default TagsList;

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import TagsList from "./TagsList";
import "./Tags.css";
import { tagsList } from "./tagList";
import { fetchTagsAggregation } from "../../actions/question";

const Tags = ({ slideIn, handleSlideIn }) => {
  const dispatch = useDispatch();
  const tagsAggregation = useSelector((state) => state.questionsReducer.tagsAggregation) || [];
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchTagsAggregation());
  }, [dispatch]);

  // Combine static tagsList with dynamic tagsAggregation
  const mergedTags = tagsAggregation.map((dynTag) => {
    const staticTag = tagsList.find(
      (st) => st.tagName.toLowerCase() === dynTag.tag.toLowerCase()
    );
    return {
      tagName: dynTag.tag,
      tagDesc: staticTag ? staticTag.tagDesc : `Questions related to ${dynTag.tag} programming.`,
      count: dynTag.count
    };
  });

  // If no dynamic tags are fetched yet, merge count=0 or similar for the default tagsList
  const baseTags = mergedTags.length > 0 ? mergedTags : tagsList.map(t => ({ ...t, count: 0 }));

  // Filter based on search query
  const filteredTags = baseTags.filter((tag) =>
    tag.tagName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2">
        <div className="tags-container-inner" style={{ width: "100%" }}>
          <h1 className="tags-h1">Tags</h1>
          <p className="tags-p-subtitle">
            Browse {baseTags.length} tags used to categorize questions on Querious.
          </p>
          <p className="tags-p-desc">
            Using the right tags makes it easier for others to find and answer your question.
          </p>

          <div className="tags-search-wrapper">
            <input
              type="text"
              placeholder="Filter by tag name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tags-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="tags-clear-btn"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="tags-list-container">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag, index) => (
                <TagsList tag={tag} key={index} />
              ))
            ) : (
              <div className="tags-empty-state">
                <p className="tags-empty-text">No tags matching "<strong>{searchTerm}</strong>" — you can use it when asking a question.</p>
                <div className="tags-empty-suggestions">
                  <p>Suggestions:</p>
                  <ul>
                    <li>Make sure all words are spelled correctly.</li>
                    <li>Try search terms that are more general.</li>
                    <li>Try searching for popular tags like <strong>reactjs</strong>, <strong>javascript</strong>, or <strong>node.js</strong>.</li>
                  </ul>
                  <div className="tags-empty-actions">
                    <p>Can't find the tag you need? You can create a new tag when you ask a question!</p>
                    <Link to="/AskQuestion" className="btn btn-primary ask-tag-btn">
                      Ask a Question
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tags;

import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import TagsList from "./TagsList";
import "./Tags.css";
import { tagsList } from "./tagList";
import { fetchTagsAggregation } from "../../actions/question";

const Tags = ({ slideIn, handleSlideIn }) => {
  const dispatch = useDispatch();
  const tagsAggregation = useSelector((state) => state.questionsReducer.tagsAggregation) || [];

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

  const tagsToDisplay = mergedTags.length > 0 ? mergedTags : tagsList;

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2">
        <h1 className="tags-h1">Tags</h1>
        <p className="tags-p">
          A tag is a keyword or label that categorizes your question with other,
          similar questions.
        </p>
        <p className="tags-p">
          Using the right tags makes it easier for others to find and answer
          your question.
        </p>
        <div className="tags-list-container">
          {tagsToDisplay.map((tag, index) => (
            <TagsList tag={tag} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tags;

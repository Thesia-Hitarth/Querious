import React from "react";

const FilterFields = ({
  filterNoAnswers,
  setFilterNoAnswers,
  filterNoAccepted,
  setFilterNoAccepted,
  filterDaysOld,
  setFilterDaysOld,
  filterSort,
  setFilterSort,
  filterTagsOption,
  setFilterTagsOption,
  filterTags,
  setFilterTags,
  onImmediate = false,
  handleImmediateChange
}) => {
  const handleChange = (field, val, setter) => {
    if (onImmediate && handleImmediateChange) {
      handleImmediateChange(field, val);
    } else {
      setter(val);
    }
  };

  return (
    <div className="filter-grid">
      {/* Column 1: Filter By */}
      <div className="filter-col">
        <h4>Filter by</h4>
        <div className="filter-group">
          <label className="filter-checkbox-label">
            <input
              type="checkbox"
              checked={filterNoAnswers}
              onChange={(e) => handleChange("filterNoAnswers", e.target.checked, setFilterNoAnswers)}
            />
            <span>No answers</span>
          </label>
          <label className="filter-checkbox-label">
            <input
              type="checkbox"
              checked={filterNoAccepted}
              onChange={(e) => handleChange("filterNoAccepted", e.target.checked, setFilterNoAccepted)}
            />
            <span>No accepted answers</span>
          </label>
          <div className="filter-input-row">
            <input
              type="number"
              placeholder="e.g. 30"
              value={filterDaysOld}
              onChange={(e) => handleChange("filterDaysOld", e.target.value, setFilterDaysOld)}
              min="1"
              className="filter-number-input"
            />
            <span>Days old</span>
          </div>
        </div>
      </div>

      {/* Column 2: Sorted By */}
      <div className="filter-col">
        <h4>Sorted by</h4>
        <div className="filter-group">
          <label className="filter-radio-label">
            <input
              type="radio"
              name="filterSort"
              value="newest"
              checked={filterSort === "newest"}
              onChange={() => handleChange("filterSort", "newest", setFilterSort)}
            />
            <span>Newest</span>
          </label>
          <label className="filter-radio-label">
            <input
              type="radio"
              name="filterSort"
              value="activity"
              checked={filterSort === "activity"}
              onChange={() => handleChange("filterSort", "activity", setFilterSort)}
            />
            <span>Recent activity</span>
          </label>
          <label className="filter-radio-label">
            <input
              type="radio"
              name="filterSort"
              value="score"
              checked={filterSort === "score"}
              onChange={() => handleChange("filterSort", "score", setFilterSort)}
            />
            <span>Highest score</span>
          </label>
          <label className="filter-radio-label">
            <input
              type="radio"
              name="filterSort"
              value="views"
              checked={filterSort === "views"}
              onChange={() => handleChange("filterSort", "views", setFilterSort)}
            />
            <span>Most frequent</span>
          </label>
        </div>
      </div>

      {/* Column 3: Tagged With */}
      <div className="filter-col">
        <h4>Tagged with</h4>
        <div className="filter-group">
          <label className="filter-radio-label">
            <input
              type="radio"
              name="filterTagsOption"
              value="any"
              checked={filterTagsOption === "any"}
              onChange={() => handleChange("filterTagsOption", "any", setFilterTagsOption)}
            />
            <span>Any tags</span>
          </label>
          <label className="filter-radio-label">
            <input
              type="radio"
              name="filterTagsOption"
              value="custom"
              checked={filterTagsOption === "custom"}
              onChange={() => handleChange("filterTagsOption", "custom", setFilterTagsOption)}
            />
            <span>The following tags:</span>
          </label>
          {filterTagsOption === "custom" && (
            <input
              type="text"
              placeholder="e.g. reactjs nodejs"
              value={filterTags}
              className="filter-tags-input"
              onChange={(e) => handleChange("filterTags", e.target.value, setFilterTags)}
              autoFocus
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterFields;

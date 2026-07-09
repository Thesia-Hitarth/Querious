import React from "react";
import FilterFields from "../HomeMainbar/FilterFields";
import "./FacetRail.css";

const FacetRail = ({ filterProps }) => {
  return (
    <div className="facet-rail">
      <div className="facet-rail-header">
        <h3>Filter & Sort</h3>
      </div>
      <div className="facet-rail-body">
        <FilterFields {...filterProps} onImmediate={true} />
      </div>
    </div>
  );
};

export default FacetRail;

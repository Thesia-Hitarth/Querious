import { useState } from "react";

export function useQuestionFilters() {
  const [filterNoAnswers, setFilterNoAnswers] = useState(false);
  const [filterNoAccepted, setFilterNoAccepted] = useState(false);
  const [filterDaysOld, setFilterDaysOld] = useState("");
  const [filterSort, setFilterSort] = useState("newest");
  const [filterTagsOption, setFilterTagsOption] = useState("any");
  const [filterTags, setFilterTags] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    const filters = {};
    if (filterNoAnswers) filters.filterNoAnswers = true;
    if (filterNoAccepted) filters.filterNoAccepted = true;
    if (filterDaysOld) filters.filterDaysOld = parseInt(filterDaysOld);
    if (filterTagsOption === "custom" && filterTags.trim()) {
      filters.filterTags = filterTags.trim();
    }
    if (filterSort && filterSort !== "newest") filters.filterSort = filterSort;
    setAppliedFilters(filters);
  };

  const handleResetFilter = () => {
    setFilterNoAnswers(false);
    setFilterNoAccepted(false);
    setFilterDaysOld("");
    setFilterSort("newest");
    setFilterTagsOption("any");
    setFilterTags("");
    setAppliedFilters({});
  };

  const handleCancel = () => {
    setFilterNoAnswers(appliedFilters.filterNoAnswers ?? false);
    setFilterNoAccepted(appliedFilters.filterNoAccepted ?? false);
    setFilterDaysOld(appliedFilters.filterDaysOld || "");
    setFilterSort(appliedFilters.filterSort || "newest");
    setFilterTags(appliedFilters.filterTags || "");
    setFilterTagsOption(appliedFilters.filterTags ? "custom" : "any");
  };

  const handleImmediateChange = (field, value) => {
    let nextNoAnswers = filterNoAnswers;
    let nextNoAccepted = filterNoAccepted;
    let nextDaysOld = filterDaysOld;
    let nextSort = filterSort;
    let nextTagsOption = filterTagsOption;
    let nextTags = filterTags;

    if (field === "filterNoAnswers") {
      setFilterNoAnswers(value);
      nextNoAnswers = value;
    } else if (field === "filterNoAccepted") {
      setFilterNoAccepted(value);
      nextNoAccepted = value;
    } else if (field === "filterDaysOld") {
      setFilterDaysOld(value);
      nextDaysOld = value;
    } else if (field === "filterSort") {
      setFilterSort(value);
      nextSort = value;
    } else if (field === "filterTagsOption") {
      setFilterTagsOption(value);
      nextTagsOption = value;
    } else if (field === "filterTags") {
      setFilterTags(value);
      nextTags = value;
    }

    const filters = {};
    if (nextNoAnswers) filters.filterNoAnswers = true;
    if (nextNoAccepted) filters.filterNoAccepted = true;
    if (nextDaysOld) filters.filterDaysOld = parseInt(nextDaysOld);
    if (nextTagsOption === "custom" && nextTags.trim()) {
      filters.filterTags = nextTags.trim();
    }
    if (nextSort && nextSort !== "newest") filters.filterSort = nextSort;
    setAppliedFilters(filters);
  };

  return {
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
    appliedFilters,
    setAppliedFilters,
    handleApplyFilter,
    handleResetFilter,
    handleCancel,
    handleImmediateChange
  };
}
export default useQuestionFilters;

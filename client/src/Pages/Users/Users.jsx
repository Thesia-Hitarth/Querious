import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Users.css";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import UsersList from "./UsersList";
import Pagination from "../../components/Pagination/Pagination";
import { fetchAllUsers } from "../../actions/users";

const Users = ({ slideIn, handleSlideIn }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortMode, setSortMode] = useState("reputation");
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();

  const { totalPages, currentPage } = useSelector((state) => state.usersReducer);

  // Debounce search term changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search query
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(fetchAllUsers({ page, search: debouncedSearch, sort: sortMode }));
  }, [page, debouncedSearch, sortMode, dispatch]);

  const handlePageChange = (pageNumber) => {
    setPage(pageNumber);
  };

  const handleSortChange = (mode) => {
    setSortMode(mode);
    setPage(1);
  };

  return (
    <div className="home-container-1">
      <LeftSidebar slideIn={slideIn} handleSlideIn={handleSlideIn} />
      <div className="home-container-2" style={{ marginTop: "30px" }}>
        <div className="users-container-inner" style={{ width: "100%" }}>
          <h1 className="users-h1">Community</h1>
          <p className="users-subtitle">Developers helping developers on Querious</p>
          
          <div className="users-search-container" style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="users-search-input"
              style={{ flex: 1, minWidth: "200px", maxWidth: "400px" }}
            />
            
            <div className="users-sort-tabs" style={{ display: "flex", gap: "var(--space-2)" }}>
              <button
                type="button"
                className={`tab-btn ${sortMode === "reputation" ? "active" : ""}`}
                onClick={() => handleSortChange("reputation")}
              >
                Reputation
              </button>
              <button
                type="button"
                className={`tab-btn ${sortMode === "newest" ? "active" : ""}`}
                onClick={() => handleSortChange("newest")}
              >
                Newest
              </button>
              <button
                type="button"
                className={`tab-btn ${sortMode === "alpha" ? "active" : ""}`}
                onClick={() => handleSortChange("alpha")}
              >
                Alphabetical
              </button>
            </div>
          </div>

          <UsersList searchTerm="" sortMode={sortMode} />

          <div style={{ marginTop: "var(--space-6)" }}>
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;

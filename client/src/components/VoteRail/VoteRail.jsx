import React from "react";
import "./VoteRail.css";

const UpVoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

const DownVoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const VoteRail = ({
  score = 0,
  onUpVote,
  onDownVote,
  userUpVoted = false,
  userDownVoted = false,
  isVoting = false,
  orientation = "vertical",
  accepted = false,
}) => {
  const isReadOnly = !onUpVote || !onDownVote;

  return (
    <div
      className={`vote-rail ${orientation}`}
      role="group"
      aria-label="Vote buttons"
    >
      {accepted && (
        <div className="vote-rail-accepted-badge" title="Accepted Answer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      <button
        type="button"
        className={`vote-btn upvote ${userUpVoted ? "active" : ""} ${isReadOnly ? "readonly" : ""}`}
        onClick={!isReadOnly && !isVoting ? onUpVote : undefined}
        disabled={isReadOnly || isVoting}
        aria-label="Upvote"
      >
        <UpVoteIcon />
      </button>
      <span className="vote-score" aria-live="polite">
        {score}
      </span>
      <button
        type="button"
        className={`vote-btn downvote ${userDownVoted ? "active" : ""} ${isReadOnly ? "readonly" : ""}`}
        onClick={!isReadOnly && !isVoting ? onDownVote : undefined}
        disabled={isReadOnly || isVoting}
        aria-label="Downvote"
      >
        <DownVoteIcon />
      </button>
    </div>
  );
};

export default React.memo(VoteRail);

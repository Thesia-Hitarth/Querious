export const computeTrustLevel = (reputation, joinedOn) => {
  const daysSinceJoined = Math.floor((new Date() - new Date(joinedOn || Date.now())) / (1000 * 60 * 60 * 24));

  if (reputation >= 2000 && daysSinceJoined >= 100) return 4; // Leader
  if (reputation >= 500 && daysSinceJoined >= 50) return 3;  // Regular
  if (reputation >= 125 && daysSinceJoined >= 15) return 2;  // Member
  if (reputation >= 15) return 1;                            // Basic User
  return 0;                                                  // New User
};

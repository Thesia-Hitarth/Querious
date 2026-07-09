export function getActivityHeat(updatedAt) {
  const hours = (Date.now() - new Date(updatedAt).getTime()) / 3600000;
  if (hours < 1) return "hot";
  if (hours < 24) return "warm";
  return "cold";
}

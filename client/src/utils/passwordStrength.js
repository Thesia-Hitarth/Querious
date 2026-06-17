export const getPasswordStrength = (pwd) => {
  let score = 0;
  if (!pwd) return { score, text: "", color: "" };
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  
  let text = "Weak";
  let color = "#e05151";
  if (score === 3) {
    text = "Medium";
    color = "#ffac38";
  } else if (score === 4) {
    text = "Strong";
    color = "#2ecc71";
  }
  return { score, text, color };
};

export const getPasswordStrength = (pwd) => {
  let score = 0;
  if (!pwd) return { score, text: "", color: "" };
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  
  let text = "";
  let color = "";
  switch (score) {
    case 0:
    case 1:
      text = "Very Weak";
      color = "#e05151";
      break;
    case 2:
      text = "Fair";
      color = "#f39c12";
      break;
    case 3:
      text = "Medium";
      color = "#ffac38";
      break;
    case 4:
      text = "Strong";
      color = "#2ecc71";
      break;
    default:
      text = "";
      color = "";
  }
  return { score, text, color };
};

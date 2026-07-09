import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateProfile } from "../../actions/users";
import { useToast } from "../../components/Toast/ToastContext";

const EditProfileForm = ({ currentUser, setSwitch }) => {
  const [name, setName] = useState(currentUser?.result?.name);
  const [about, setAbout] = useState(currentUser?.result?.about);
  const [tagsInput, setTagsInput] = useState(currentUser?.result?.tags?.join(" ") || "");
  const [website, setWebsite] = useState(currentUser?.result?.website || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      showToast("Please fill in all password fields", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      showToast("Password must contain at least one uppercase letter", "error");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      showToast("Password must contain at least one number", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const apiModule = await import("../../api");
      await apiModule.changePassword({ oldPassword, newPassword });
      showToast("Password updated successfully!", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password. Please try again.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tagsArray = tagsInput.split(" ").filter((t) => t.trim() !== "");
    if (tagsArray.length === 0) {
      showToast("Please update your tags field", "warning");
      return;
    }
    if (website.trim() !== "" && !/^https?:\/\/.+/.test(website.trim())) {
      showToast("Website must start with http:// or https://", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await dispatch(updateProfile(currentUser?.result?._id, { name, about, tags: tagsArray, website }));
      showToast("Profile updated successfully!", "success");
      setSwitch(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="edit-profile-title">Edit Your Profile</h1>
      <h2 className="edit-profile-title-2">Public information</h2>
      <form className="edit-profile-form" onSubmit={handleSubmit}>
        <label htmlFor="name">
          <h3>Display name <span style={{ color: "var(--color-danger)" }}>*</span></h3>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
        </label>
        <label htmlFor="about">
          <h3>About me</h3>
          <textarea
            id="about"
            cols="30"
            rows="10"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
        </label>
        <label htmlFor="website">
          <h3>Website</h3>
          <p>Must start with http:// or https://</p>
          <input
            type="url"
            id="website"
            value={website}
            placeholder="https://yoursite.com"
            onChange={(e) => setWebsite(e.target.value)}
            disabled={isSubmitting}
          />
        </label>
        <label htmlFor="tags">
          <h3>Watched tags <span style={{ color: "var(--color-danger)" }}>*</span></h3>
          <p>Add tags separated by 1 space</p>
          <input
            type="text"
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            disabled={isSubmitting}
          />
        </label>
        <br />
        <input 
          type="submit" 
          value={isSubmitting ? "Saving..." : "Save profile"} 
          className="user-submit-btn" 
          disabled={isSubmitting}
        />
        <button
          type="button"
          className="user-cancel-btn"
          onClick={() => setSwitch(false)}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </form>

      <hr style={{ border: "0", borderTop: "1px solid var(--color-border, #e2e8f0)", margin: "40px 0" }} />
      <h2 className="edit-profile-title-2">Change Password</h2>
      <form className="edit-profile-form" onSubmit={handlePasswordSubmit}>
        <label htmlFor="old-password">
          <h3>Current Password <span style={{ color: "var(--color-danger)" }}>*</span></h3>
          <input
            type="password"
            id="old-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={isChangingPassword}
            required
          />
        </label>
        <label htmlFor="new-password">
          <h3>New Password <span style={{ color: "var(--color-danger)" }}>*</span></h3>
          <input
            type="password"
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isChangingPassword}
            required
          />
        </label>
        <label htmlFor="confirm-new-password">
          <h3>Confirm New Password <span style={{ color: "var(--color-danger)" }}>*</span></h3>
          <input
            type="password"
            id="confirm-new-password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            disabled={isChangingPassword}
            required
          />
        </label>
        <br />
        <input
          type="submit"
          value={isChangingPassword ? "Updating..." : "Update Password"}
          className="user-submit-btn"
          disabled={isChangingPassword}
        />
      </form>
    </div>
  );
};

export default EditProfileForm;
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateProfile } from "../../actions/users";
import { useToast } from "../../components/Toast/ToastContext";

const EditProfileForm = ({ currentUser, setSwitch }) => {
  const [name, setName] = useState(currentUser?.result?.name);
  const [about, setAbout] = useState(currentUser?.result?.about);
  const [tagsInput, setTagsInput] = useState(currentUser?.result?.tags?.join(" ") || "");
  const [website, setWebsite] = useState(currentUser?.result?.website || "");
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const handleSubmit = (e) => {
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
    dispatch(updateProfile(currentUser?.result?._id, { name, about, tags: tagsArray, website }));
    setSwitch(false);
  };

  return (
    <div>
      <h1 className="edit-profile-title">Edit Your Profile</h1>
      <h2 className="edit-profile-title-2">Public information</h2>
      <form className="edit-profile-form" onSubmit={handleSubmit}>
        <label htmlFor="name">
          <h3>Display name</h3>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          />
        </label>
        <label htmlFor="tags">
          <h3>Watched tags</h3>
          <p>Add tags separated by 1 space</p>
          <input
            type="text"
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </label>
        <br />
        <input type="submit" value="Save profile" className="user-submit-btn" />
        <button
          type="button"
          className="user-cancel-btn"
          onClick={() => setSwitch(false)}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditProfileForm;
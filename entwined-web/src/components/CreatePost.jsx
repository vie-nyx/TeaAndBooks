import { useEffect, useState } from "react";
import api from "../api/api";
import { POST_CREATION_CATEGORIES } from "../constants/postCategories";

export default function CreatePost() {
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const resetState = () => {
    setImageFile(null);
    setImagePreview(null);
    setCaption("");
    setCategory("general");
  };

  const handleClose = () => {
    if (submitting) return;
    setOpen(false);
    resetState();
  };

  useEffect(() => {
    const openComposer = () => {
      setOpen(true);
    };

    window.addEventListener("posts:openComposer", openComposer);
    return () => {
      window.removeEventListener("posts:openComposer", openComposer);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      alert("Please choose an image");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token || token === "undefined" || token === "null") {
      alert("You are not logged in. Please log in again.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("category", category);

      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      await api.post("/api/posts/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      window.dispatchEvent(new CustomEvent("posts:refresh"));
      handleClose();
    } catch (err) {
      alert(
        `Failed to create post: ${
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unknown error"
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        className="create-post-fab"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Create post"
      >
        +
      </button>

      {open && (
        <div className="create-post-modal-overlay">
          <div className="create-post-modal">
            <div className="create-post-header">
              <h3>Create a post</h3>
              <button
                type="button"
                className="create-post-close"
                onClick={handleClose}
              >
                x
              </button>
            </div>
            <form className="create-post-body" onSubmit={handleSubmit}>
              <label className="create-post-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={submitting}
                />
                <span>
                  {imageFile ? "Change image" : "Click to upload an image"}
                </span>
              </label>

              <div className="create-post-field-grid">
                <label className="create-post-field">
                  <span>Category</span>
                  <select
                    className="create-post-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={submitting}
                  >
                    {POST_CREATION_CATEGORIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {imagePreview && (
                <div className="create-post-preview">
                  <img src={imagePreview} alt="Post preview" />
                </div>
              )}

              <textarea
                className="create-post-caption"
                placeholder="Share a thought, mini review, quote, or reading update..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                disabled={submitting}
              />

              <div className="create-post-caption-meta">
                <span>Pick a category so the right readers can find this post faster.</span>
                <span>{caption.length}/2200</span>
              </div>

              <div className="create-post-actions">
                <button
                  type="button"
                  className="create-post-cancel"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="create-post-submit"
                  disabled={submitting || !imageFile}
                >
                  {submitting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

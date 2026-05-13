import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { createPost } from "../../api/blog";

const CATEGORIES = ["Tech", "Lifestyle", "News", "Tutorial"];

export default function CreatePostPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const navigate = useNavigate();
  const imageRef = useRef(null);

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("category", data.category);
      if (data.videoLink) formData.append("videoLink", data.videoLink);
      if (data.image?.[0]) formData.append("image", data.image[0]);

      await createPost(formData);
      toast.success("Post submitted for review");
      navigate("/blog");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    }
  };

  return (
    <div className="container">
      <h1>Write a Post</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="post-form">
        <div className="form-group">
          <label>Title</label>
          <input
            {...register("title", { required: "Title is required" })}
            placeholder="Post title"
          />
          {errors.title && (
            <span className="error">{errors.title.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            {...register("category", { required: "Category is required" })}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="error">{errors.category.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>Content</label>
          <textarea
            {...register("content", { required: "Content is required" })}
            placeholder="Write your post..."
            rows={10}
          />
          {errors.content && (
            <span className="error">{errors.content.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>Video Link (optional)</label>
          <input
            {...register("videoLink")}
            placeholder="https://youtube.com/..."
          />
        </div>

        <div className="form-group">
          <label>Cover Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            {...register("image")}
            ref={imageRef}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Post"}
        </button>
      </form>
    </div>
  );
}

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { createPost } from "../../api/blog";

const CATEGORIES = [
  "TECHNOLOGY",
  "HEALTH",
  "EDUCATION",
  "BUSINESS",
  "LIFESTYLE",
  "TRAVEL",
  "FOOD",
  "SPORTS",
  "ENTERTAINMENT",
  "OTHER",
];

const CATEGORY_LABELS = {
  TECHNOLOGY: "Technology",
  HEALTH: "Health",
  EDUCATION: "Education",
  BUSINESS: "Business",
  LIFESTYLE: "Lifestyle",
  TRAVEL: "Travel",
  FOOD: "Food",
  SPORTS: "Sports",
  ENTERTAINMENT: "Entertainment",
  OTHER: "Other",
};

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
      if (data.imageUrl) formData.append("imageUrl", data.imageUrl);
      if (data.image?.[0]) formData.append("image", data.image[0]);

      await createPost(formData);
      toast.success("Post submitted for review");
      navigate("/blog?mine=true");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-linear-to-r from-orange-50 via-white to-indigo-50 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">
                Write
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                Create a blog post
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Publish a post with category, cover image, PDF, and video link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/blog")}
              className="self-start rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back to Blog
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
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
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="error">{errors.category.message}</span>
              )}
            </div>
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

          <div className="grid gap-5 md:grid-cols-2">
            <div className="form-group">
              <label>Video Link (optional)</label>
              <input
                {...register("videoLink")}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className="form-group">
              <label>Cover Image URL (optional)</label>
              <input
                {...register("imageUrl")}
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Paste an image URL here, or upload a file below. Uploaded file
                takes priority.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="form-group md:col-span-2">
              <label>Cover Image Upload (optional)</label>
              <input
                type="file"
                accept="image/*"
                {...register("image")}
                ref={imageRef}
              />
              <p className="mt-1 text-xs text-gray-500">
                Use this if you want to upload a local file instead of an image
                URL.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full md:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Post"}
          </button>
        </form>
      </div>
    </div>
  );
}

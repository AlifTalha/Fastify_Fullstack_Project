import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
} from "../../api/shop";

const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await getAllProducts();
      setProducts(data.products || data.data || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openEdit = (product) => {
    setEditProduct(product);
    setValue("name", product.name);
    setValue("description", product.description);
    setValue("price", product.price);
    setValue("stock", product.stock);
    setValue("category", product.category);
    setShowForm(true);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (k !== "image" && v !== undefined && v !== "") formData.append(k, v);
      });
      if (data.image?.[0]) formData.append("image", data.image[0]);

      if (editProduct) {
        await updateProduct(editProduct.id, formData);
        toast.success("Product updated");
      } else {
        await createProduct(formData);
        toast.success("Product created");
      }

      reset();
      setShowForm(false);
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      setProducts((p) => p.filter((pr) => pr.id !== id));
    } catch {
      toast.error("Failed");
    }
  };

  const handleRestock = async (id) => {
    const qty = window.prompt("Add stock quantity:");
    if (!qty || isNaN(qty)) return;
    try {
      await restockProduct(id, { quantity: Number(qty) });
      toast.success("Stock updated");
      fetchProducts();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Products</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditProduct(null);
            reset();
          }}
        >
          {showForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="product-form">
          <h2>{editProduct ? "Edit Product" : "New Product"}</h2>
          <div className="form-group">
            <label>Name</label>
            <input
              {...register("name", { required: true })}
              placeholder="Product name"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Description"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                step="0.01"
                {...register("price", { required: true })}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                {...register("stock", { required: true })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Category</label>
            <input {...register("category")} placeholder="Category" />
          </div>
          <div className="form-group">
            <label>Image</label>
            <input type="file" accept="image/*" {...register("image")} />
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editProduct ? "Update" : "Create"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="page-loader">Loading...</div>
      ) : (
        <div className="product-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.imageUrl && (
                      <img
                        src={`${BASE}${p.imageUrl}`}
                        alt={p.name}
                        width={50}
                      />
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>{p.category || "—"}</td>
                  <td className="admin-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => openEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleRestock(p.id)}
                    >
                      Restock
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

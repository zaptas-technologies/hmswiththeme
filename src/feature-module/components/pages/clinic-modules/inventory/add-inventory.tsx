import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import {
  createInventory,
  updateInventory,
  fetchInventoryById,
  type Inventory,
} from "../../../../../api/inventory";

const AddInventory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<Inventory>>({
    Item_Name: "",
    Item_Code: "",
    Category: "",
    Manufacturer: "",
    Batch_Number: "",
    Expiry_Date: "",
    Quantity: 0,
    Unit: "pcs",
    Unit_Price: 0,
    Location: "",
    Supplier: "",
    Status: "Available",
    Notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      setLoadingData(true);
      fetchInventoryById(id)
        .then((data) => {
          setFormData({
            ...data,
            Expiry_Date: data.Expiry_Date ? new Date(data.Expiry_Date).toISOString().split("T")[0] : "",
          });
        })
        .catch((err) => {
          alert(`Failed to load inventory: ${err?.response?.data?.message || err?.message}`);
          navigate(all_routes.inventory);
        })
        .finally(() => setLoadingData(false));
    }
  }, [isEdit, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        Expiry_Date: formData.Expiry_Date ? new Date(formData.Expiry_Date as string) : new Date(),
        Quantity: Number(formData.Quantity) || 0,
        Unit_Price: Number(formData.Unit_Price) || 0,
      };

      if (isEdit && id) {
        await updateInventory(id, submitData);
      } else {
        await createInventory(submitData);
      }
      navigate(all_routes.inventory);
    } catch (err: any) {
      alert(`Failed to ${isEdit ? "update" : "create"} inventory: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center p-5">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
          <div className="flex-grow-1">
            <h4 className="fw-semibold mb-0">{isEdit ? "Edit" : "Add"} Inventory Item</h4>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Item Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.Item_Name || ""}
                onChange={(e) => setFormData({ ...formData, Item_Name: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Item Code</label>
              <input
                type="text"
                className="form-control"
                value={formData.Item_Code || ""}
                onChange={(e) => setFormData({ ...formData, Item_Code: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-control"
                value={formData.Category || ""}
                onChange={(e) => setFormData({ ...formData, Category: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Manufacturer</label>
              <input
                type="text"
                className="form-control"
                value={formData.Manufacturer || ""}
                onChange={(e) => setFormData({ ...formData, Manufacturer: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Batch Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.Batch_Number || ""}
                onChange={(e) => setFormData({ ...formData, Batch_Number: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Expiry Date <span className="text-danger">*</span></label>
              <input
                type="date"
                className="form-control"
                value={formData.Expiry_Date as string || ""}
                onChange={(e) => setFormData({ ...formData, Expiry_Date: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Quantity <span className="text-danger">*</span></label>
              <input
                type="number"
                className="form-control"
                value={formData.Quantity || 0}
                onChange={(e) => setFormData({ ...formData, Quantity: Number(e.target.value) })}
                min="0"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Unit</label>
              <select
                className="form-control"
                value={formData.Unit || "pcs"}
                onChange={(e) => setFormData({ ...formData, Unit: e.target.value })}
              >
                <option value="pcs">Pieces</option>
                <option value="box">Box</option>
                <option value="bottle">Bottle</option>
                <option value="pack">Pack</option>
                <option value="kg">Kg</option>
                <option value="g">Gram</option>
                <option value="ml">ML</option>
                <option value="l">Liter</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Unit Price</label>
              <input
                type="number"
                className="form-control"
                value={formData.Unit_Price || 0}
                onChange={(e) => setFormData({ ...formData, Unit_Price: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-control"
                value={formData.Location || ""}
                onChange={(e) => setFormData({ ...formData, Location: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Supplier</label>
              <input
                type="text"
                className="form-control"
                value={formData.Supplier || ""}
                onChange={(e) => setFormData({ ...formData, Supplier: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.Status || "Available"}
                onChange={(e) => setFormData({ ...formData, Status: e.target.value as any })}
              >
                <option value="Available">Available</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.Notes || ""}
                onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
              />
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Create"} Item
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(all_routes.inventory)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventory;

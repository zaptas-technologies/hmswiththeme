import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import {
  createGRN,
  updateGRN,
  fetchGRNById,
  type GRN,
  type GRNItem,
} from "../../../../../api/grn";

const AddGRN = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<GRN>>({
    GRN_Number: `GRN-${Date.now()}`,
    GRN_Date: new Date().toISOString().split("T")[0],
    Supplier: "",
    Supplier_Invoice: "",
    Items: [],
    Total_Amount: 0,
    Status: "Draft",
    Received_By: "",
    Notes: "",
  });

  const [currentItem, setCurrentItem] = useState<Partial<GRNItem>>({
    Item_Name: "",
    Item_Code: "",
    Batch_Number: "",
    Expiry_Date: "",
    Quantity: 1,
    Unit: "pcs",
    Unit_Price: 0,
    Total_Price: 0,
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      setLoadingData(true);
      fetchGRNById(id)
        .then((data) => {
          setFormData({
            ...data,
            GRN_Date: data.GRN_Date ? new Date(data.GRN_Date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          });
        })
        .catch((err) => {
          alert(`Failed to load GRN: ${err?.response?.data?.message || err?.message}`);
          navigate(all_routes.grn);
        })
        .finally(() => setLoadingData(false));
    }
  }, [isEdit, id, navigate]);

  const addItem = () => {
    if (!currentItem.Item_Name || !currentItem.Expiry_Date || !currentItem.Quantity || !currentItem.Unit_Price) {
      alert("Please fill all required item fields");
      return;
    }

    const totalPrice = (currentItem.Quantity || 0) * (currentItem.Unit_Price || 0);
    const newItem: GRNItem = {
      ...currentItem,
      Total_Price: totalPrice,
      Expiry_Date: currentItem.Expiry_Date as string,
      Quantity: currentItem.Quantity || 0,
      Unit_Price: currentItem.Unit_Price || 0,
    } as GRNItem;

    const updatedItems = [...(formData.Items || []), newItem];
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.Total_Price, 0);

    setFormData({
      ...formData,
      Items: updatedItems,
      Total_Amount: totalAmount,
    });

    setCurrentItem({
      Item_Name: "",
      Item_Code: "",
      Batch_Number: "",
      Expiry_Date: "",
      Quantity: 1,
      Unit: "pcs",
      Unit_Price: 0,
      Total_Price: 0,
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.Items?.filter((_, i) => i !== index) || [];
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.Total_Price, 0);
    setFormData({
      ...formData,
      Items: updatedItems,
      Total_Amount: totalAmount,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.Items || formData.Items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        GRN_Date: formData.GRN_Date ? new Date(formData.GRN_Date as string) : new Date(),
        Items: formData.Items.map(item => ({
          ...item,
          Expiry_Date: new Date(item.Expiry_Date),
        })),
      };

      if (isEdit && id) {
        await updateGRN(id, submitData);
      } else {
        await createGRN(submitData);
      }
      navigate(all_routes.grn);
    } catch (err: any) {
      alert(`Failed to ${isEdit ? "update" : "create"} GRN: ${err?.response?.data?.message || err?.message}`);
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
            <h4 className="fw-semibold mb-0">{isEdit ? "Edit" : "Create"} GRN</h4>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <label className="form-label">GRN Number <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.GRN_Number || ""}
                onChange={(e) => setFormData({ ...formData, GRN_Number: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">GRN Date <span className="text-danger">*</span></label>
              <input
                type="date"
                className="form-control"
                value={formData.GRN_Date as string || ""}
                onChange={(e) => setFormData({ ...formData, GRN_Date: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Supplier <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.Supplier || ""}
                onChange={(e) => setFormData({ ...formData, Supplier: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Supplier Invoice</label>
              <input
                type="text"
                className="form-control"
                value={formData.Supplier_Invoice || ""}
                onChange={(e) => setFormData({ ...formData, Supplier_Invoice: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.Status || "Draft"}
                onChange={(e) => setFormData({ ...formData, Status: e.target.value as any })}
              >
                <option value="Draft">Draft</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Received By</label>
              <input
                type="text"
                className="form-control"
                value={formData.Received_By || ""}
                onChange={(e) => setFormData({ ...formData, Received_By: e.target.value })}
              />
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

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Add Items</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Item Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={currentItem.Item_Name || ""}
                    onChange={(e) => setCurrentItem({ ...currentItem, Item_Name: e.target.value })}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Item Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={currentItem.Item_Code || ""}
                    onChange={(e) => setCurrentItem({ ...currentItem, Item_Code: e.target.value })}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Batch Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={currentItem.Batch_Number || ""}
                    onChange={(e) => setCurrentItem({ ...currentItem, Batch_Number: e.target.value })}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Expiry Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={currentItem.Expiry_Date as string || ""}
                    onChange={(e) => setCurrentItem({ ...currentItem, Expiry_Date: e.target.value })}
                  />
                </div>
                <div className="col-md-1 mb-3">
                  <label className="form-label">Qty <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    value={currentItem.Quantity || 0}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      setCurrentItem({
                        ...currentItem,
                        Quantity: qty,
                        Total_Price: qty * (currentItem.Unit_Price || 0),
                      });
                    }}
                    min="1"
                  />
                </div>
                <div className="col-md-1 mb-3">
                  <label className="form-label">Unit</label>
                  <select
                    className="form-control"
                    value={currentItem.Unit || "pcs"}
                    onChange={(e) => setCurrentItem({ ...currentItem, Unit: e.target.value })}
                  >
                    <option value="pcs">pcs</option>
                    <option value="box">box</option>
                    <option value="bottle">bottle</option>
                    <option value="pack">pack</option>
                  </select>
                </div>
                <div className="col-md-1 mb-3">
                  <label className="form-label">Price <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    value={currentItem.Unit_Price || 0}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      setCurrentItem({
                        ...currentItem,
                        Unit_Price: price,
                        Total_Price: (currentItem.Quantity || 0) * price,
                      });
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={addItem}
              >
                Add Item
              </button>
            </div>
          </div>

          {formData.Items && formData.Items.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Items List</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Code</th>
                        <th>Batch</th>
                        <th>Expiry</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.Items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.Item_Name}</td>
                          <td>{item.Item_Code || "-"}</td>
                          <td>{item.Batch_Number || "-"}</td>
                          <td>{new Date(item.Expiry_Date).toLocaleDateString()}</td>
                          <td>{item.Quantity}</td>
                          <td>${item.Unit_Price.toFixed(2)}</td>
                          <td>${item.Total_Price.toFixed(2)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem(index)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} className="text-end fw-bold">Total Amount:</td>
                        <td className="fw-bold">${formData.Total_Amount?.toFixed(2) || "0.00"}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Create"} GRN
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(all_routes.grn)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGRN;

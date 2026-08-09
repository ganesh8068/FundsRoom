import React, { useState, useEffect } from "react";

export default function InventoryPage({ token, userRole }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [alertFilter, setAlertFilter] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    unit_price: "",
    current_stock: "",
    min_stock_alert: "",
    location: "",
    reason: "" // Used during edit/adjustment log
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const backendUrl = "http://localhost:8000/api";

  const fetchProducts = async () => {
    try {
      const res = await fetch(
        `${backendUrl}/products?search=${search}&category=${categoryFilter}&alert=${alertFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, alertFilter]);

  const selectProduct = async (prod) => {
    try {
      setSelectedProduct(prod);
      const res = await fetch(`${backendUrl}/products/${prod.id}/movements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMovements(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...formData,
        unit_price: parseFloat(formData.unit_price),
        current_stock: parseInt(formData.current_stock, 10),
        min_stock_alert: parseInt(formData.min_stock_alert, 10) || 0
      };

      const res = await fetch(`${backendUrl}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Product added successfully!");
        setShowAddModal(false);
        fetchProducts();
        // Reset
        setFormData({
          name: "",
          sku: "",
          category: "",
          unit_price: "",
          current_stock: "",
          min_stock_alert: "",
          location: "",
          reason: ""
        });
      } else {
        setError(data.error || "Failed to create product");
      }
    } catch (err) {
      setError("Network error occurred.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        unit_price: parseFloat(formData.unit_price),
        current_stock: parseInt(formData.current_stock, 10),
        min_stock_alert: parseInt(formData.min_stock_alert, 10) || 0,
        location: formData.location,
        reason: formData.reason
      };

      const res = await fetch(`${backendUrl}/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Product updated successfully!");
        setShowEditModal(false);
        selectProduct(data);
        fetchProducts();
      } else {
        setError(data.error || "Failed to update product");
      }
    } catch (err) {
      setError("Network error occurred.");
    }
  };

  const openEdit = () => {
    setFormData({
      name: selectedProduct.name,
      sku: selectedProduct.sku,
      category: selectedProduct.category,
      unit_price: selectedProduct.unit_price.toString(),
      current_stock: selectedProduct.current_stock.toString(),
      min_stock_alert: selectedProduct.min_stock_alert.toString(),
      location: selectedProduct.location,
      reason: ""
    });
    setShowEditModal(true);
  };

  const isWriteAllowed = userRole === "Admin" || userRole === "Warehouse";

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Product & Inventory Operations</h2>
          <p className="page-subtitle">Track stock counts, warehouse locations, and inward/outward movements.</p>
        </div>
        {isWriteAllowed && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Product
          </button>
        )}
      </div>

      {success && <div className="alert-bar alert-bar-success">{success}</div>}
      {error && <div className="alert-bar alert-bar-error">{error}</div>}

      <div className="detail-grid">
        {/* Product Table List */}
        <div className="content-card">
          <div className="table-controls">
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              className="form-control search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="text"
              placeholder="Category Filter"
              className="form-control select-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
            <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={alertFilter}
                onChange={(e) => setAlertFilter(e.target.checked)}
              />
              Show stock alerts only
            </label>
          </div>

          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Product SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Current Stock</th>
                  <th>Warehouse Location</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">No products found</td>
                  </tr>
                ) : (
                  products.map((prod) => {
                    const isAlert = prod.current_stock <= prod.min_stock_alert;
                    return (
                      <tr
                        key={prod.id}
                        onClick={() => selectProduct(prod)}
                        style={{ cursor: "pointer", background: selectedProduct?.id === prod.id ? "var(--bg-card-hover)" : "" }}
                      >
                        <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{prod.sku}</td>
                        <td>{prod.name}</td>
                        <td>{prod.category}</td>
                        <td>${parseFloat(prod.unit_price).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${isAlert ? "badge-error" : "badge-success"}`}>
                            {prod.current_stock} pcs {isAlert && "(Alert)"}
                          </span>
                        </td>
                        <td>{prod.location}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Movement Details Side panel */}
        <div className="detail-section">
          {selectedProduct ? (
            <div className="content-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 700 }}>{selectedProduct.name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", fontFamily: "monospace" }}>SKU: {selectedProduct.sku}</p>
                </div>
                {isWriteAllowed && (
                  <button className="btn btn-secondary" onClick={openEdit} style={{ padding: "6px 12px", fontSize: "12px" }}>
                    Edit / Adjust Stock
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <div><strong>Category:</strong> {selectedProduct.category}</div>
                <div><strong>Unit Price:</strong> ${parseFloat(selectedProduct.unit_price).toFixed(2)}</div>
                <div><strong>Location:</strong> {selectedProduct.location}</div>
                <div><strong>Minimum Alert Threshold:</strong> {selectedProduct.min_stock_alert} units</div>
                <div>
                  <strong>Stock Status:</strong>{" "}
                  <span className={`badge ${selectedProduct.current_stock <= selectedProduct.min_stock_alert ? "badge-error" : "badge-success"}`}>
                    {selectedProduct.current_stock} units available
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>Stock Movement Log</h4>
                <div className="notes-timeline">
                  {movements.length === 0 ? (
                    <div className="no-data" style={{ padding: "20px" }}>No stock movements recorded yet.</div>
                  ) : (
                    movements.map((log) => (
                      <div key={log.id} className="note-item" style={{ borderLeft: `4px solid ${log.movement_type === "IN" ? "var(--success)" : "var(--error)"}` }}>
                        <div className="note-meta">
                          <span style={{ fontWeight: 600, color: log.movement_type === "IN" ? "var(--success)" : "var(--error)" }}>
                            {log.movement_type} (+{log.quantity_changed})
                          </span>
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="note-content" style={{ marginTop: "4px" }}>
                          <strong>Reason:</strong> {log.reason}<br />
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Logged by: {log.created_by}</span>
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="content-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
              <p style={{ color: "var(--text-muted)" }}>Select a product to view stock history & location logs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Add New Product</h3>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ padding: "6px 12px" }}>X</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU / Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PROD-MS-123"
                      className="form-control"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Electronics, Furniture"
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="form-control"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Initial Stock Count</label>
                    <input
                      type="number"
                      required
                      className="form-control"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock Alert Threshold</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.min_stock_alert}
                      onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Warehouse Storage Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shelf A-3, Floor 2"
                    className="form-control"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product & Adjust Stock Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Edit Product & Adjust Stock</h3>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)} style={{ padding: "6px 12px" }}>X</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU / Code</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="form-control"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Current Stock Count</label>
                    <input
                      type="number"
                      required
                      className="form-control"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock Alert Threshold</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.min_stock_alert}
                      onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Warehouse Storage Location</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Stock Adjustment (Only if Stock changed)</label>
                  <input
                    type="text"
                    placeholder="e.g. Stock Count audit, Damaged goods removal, Inward shipment"
                    className="form-control"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

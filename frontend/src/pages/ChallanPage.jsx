import React, { useState, useEffect } from "react";

export default function ChallanPage({ token, userRole }) {
  const [challans, setChallans] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [selectedChallanItems, setSelectedChallanItems] = useState([]);

  // Builder States
  const [showBuilder, setShowBuilder] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [lineItems, setLineItems] = useState([{ productId: "", quantity: 1 }]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  const fetchChallans = async () => {
    try {
      const res = await fetch(`${backendUrl}/challans?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setChallans(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomersAndProducts = async () => {
    try {
      const custRes = await fetch(`${backendUrl}/customers?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const custData = await custRes.json();
      if (custRes.ok) setCustomers(custData.data || []);

      const prodRes = await fetch(`${backendUrl}/products?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prodData = await prodRes.json();
      if (prodRes.ok) setProducts(prodData.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [statusFilter]);

  const selectChallan = async (chal) => {
    try {
      const res = await fetch(`${backendUrl}/challans/${chal.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedChallan(data.challan);
        setSelectedChallanItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { productId: "", quantity: 1 }]);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    if (field === "quantity") {
      updated[index][field] = parseInt(value, 10) || 1;
    } else {
      updated[index][field] = value;
    }
    setLineItems(updated);
  };

  const handleCreateChallan = async (status) => {
    setError("");
    setSuccess("");
    if (!selectedCustomerId) {
      setError("Please select a customer.");
      return;
    }

    const validItems = lineItems.filter(item => item.productId !== "");
    if (validItems.length === 0) {
      setError("Please add at least one product line item.");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/challans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: parseInt(selectedCustomerId, 10),
          status,
          products: validItems
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Challan ${data.challan_number} created successfully as ${status}!`);
        setShowBuilder(false);
        setLineItems([{ productId: "", quantity: 1 }]);
        setSelectedCustomerId("");
        fetchChallans();
      } else {
        setError(data.error || "Failed to create challan");
      }
    } catch (err) {
      setError("Network error occurred.");
    }
  };

  const updateChallanStatus = async (challanId, newStatus) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${backendUrl}/challans/${challanId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Challan updated to ${newStatus}!`);
        // Refresh details
        selectChallan(data);
        fetchChallans();
      } else {
        setError(data.error || "Failed to update challan status");
      }
    } catch (err) {
      setError("Network error occurred.");
    }
  };

  const openBuilder = () => {
    fetchCustomersAndProducts();
    setShowBuilder(true);
  };

  const isSalesOrAdmin = userRole === "Admin" || userRole === "Sales";

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Sales Challans & Delivery</h2>
          <p className="page-subtitle">Generate dispatch challans, manage drafts, and verify inventory allocation.</p>
        </div>
        {isSalesOrAdmin && (
          <button className="btn btn-primary" onClick={openBuilder}>
            + Create New Challan
          </button>
        )}
      </div>

      {success && <div className="alert-bar alert-bar-success">{success}</div>}
      {error && <div className="alert-bar alert-bar-error">{error}</div>}

      <div className="detail-grid">
        {/* Challans List */}
        <div className="content-card">
          <div className="table-controls">
            <select
              className="form-control select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Customer Name</th>
                  <th>Total Qty</th>
                  <th>Created By</th>
                  <th>Created Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {challans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">No challans found</td>
                  </tr>
                ) : (
                  challans.map((chal) => (
                    <tr
                      key={chal.id}
                      onClick={() => selectChallan(chal)}
                      style={{ cursor: "pointer", background: selectedChallan?.id === chal.id ? "var(--bg-card-hover)" : "" }}
                    >
                      <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{chal.challan_number}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{chal.customer_business}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{chal.customer_name}</div>
                      </td>
                      <td>{chal.total_quantity} pcs</td>
                      <td>{chal.created_by}</td>
                      <td>{new Date(chal.created_at).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`badge ${chal.status === "Confirmed"
                              ? "badge-success"
                              : chal.status === "Cancelled"
                                ? "badge-error"
                                : "badge-warning"
                            }`}
                        >
                          {chal.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Challan Detail Side Panel */}
        <div className="detail-section">
          {selectedChallan ? (
            <div className="content-card">
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, fontFamily: "monospace" }}>{selectedChallan.challan_number}</h3>
                  <span className={`badge ${selectedChallan.status === "Confirmed" ? "badge-success" : selectedChallan.status === "Cancelled" ? "badge-error" : "badge-warning"}`}>
                    {selectedChallan.status}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Created on: {new Date(selectedChallan.created_at).toLocaleString()} by {selectedChallan.created_by}
                </div>
              </div>

              <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "16px" }}>
                <h4 style={{ fontWeight: 600, fontSize: "15px" }}>Customer Details</h4>
                <div><strong>Business Name:</strong> {selectedChallan.customer_business}</div>
                <div><strong>Contact:</strong> {selectedChallan.customer_name} ({selectedChallan.customer_mobile})</div>
                <div><strong>Email:</strong> {selectedChallan.customer_email}</div>
                <div><strong>GST Number:</strong> {selectedChallan.customer_gst || "N/A"}</div>
                <div><strong>Delivery Address:</strong> {selectedChallan.customer_address}</div>
              </div>

              <div>
                <h4 style={{ fontWeight: 600, fontSize: "15px", marginBottom: "12px" }}>Products Shipped Snapshot</h4>
                <div className="table-responsive" style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                  <table className="table-custom" style={{ fontSize: "13px" }}>
                    <thead>
                      <tr>
                        <th>Product SKU</th>
                        <th>Name</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedChallanItems.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontFamily: "monospace" }}>{item.sku_snapshot}</td>
                          <td>{item.product_name_snapshot}</td>
                          <td>{item.quantity}</td>
                          <td>${parseFloat(item.unit_price_snapshot).toFixed(2)}</td>
                          <td style={{ fontWeight: 600 }}>
                            ${(item.quantity * parseFloat(item.unit_price_snapshot)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action buttons based on status & role */}
              <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                {selectedChallan.status === "Draft" && (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => updateChallanStatus(selectedChallan.id, "Confirmed")}
                    >
                      Confirm & Dispatch (Reduce Stock)
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => updateChallanStatus(selectedChallan.id, "Cancelled")}
                    >
                      Cancel Draft
                    </button>
                  </>
                )}
                {selectedChallan.status === "Confirmed" && (
                  <button
                    className="btn btn-danger"
                    onClick={() => updateChallanStatus(selectedChallan.id, "Cancelled")}
                  >
                    Cancel & Return Stock to Warehouse
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="content-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
              <p style={{ color: "var(--text-muted)" }}>Select a sales challan to inspect delivery snapshots & status actions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Challan Builder Overlay Modal */}
      {showBuilder && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: "800px" }}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Generate Delivery Challan</h3>
              <button className="btn btn-secondary" onClick={() => setShowBuilder(false)} style={{ padding: "6px 12px" }}>X</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label">Select Customer</label>
                <select
                  required
                  className="form-control"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Select CRM Business --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business_name} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <h4 style={{ fontWeight: 600, fontSize: "15px", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                Product Dispatch List
              </h4>

              <div className="item-row-header">
                <div>Product</div>
                <div>Quantity</div>
                <div>Available Stock</div>
                <div></div>
              </div>

              {lineItems.map((item, index) => {
                const selectedProd = products.find(p => p.id === parseInt(item.productId, 10));
                const available = selectedProd ? selectedProd.current_stock : 0;
                return (
                  <div key={index} className="item-row">
                    <select
                      className="form-control"
                      value={item.productId}
                      onChange={(e) => handleLineItemChange(index, "productId", e.target.value)}
                    >
                      <option value="">-- Choose Product SKU --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name} (${parseFloat(p.unit_price).toFixed(2)})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                    />

                    <div style={{ fontSize: "14px", fontWeight: 600, color: available < item.quantity ? "var(--error)" : "var(--success)" }}>
                      {available} units
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: "8px 12px" }}
                      onClick={() => removeLineItem(index)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}

              <button type="button" className="btn btn-secondary" onClick={addLineItem} style={{ marginTop: "12px" }}>
                + Add Line Item
              </button>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowBuilder(false)}>Cancel</button>
              <button type="button" className="btn btn-secondary" style={{ borderColor: "var(--warning)" }} onClick={() => handleCreateChallan("Draft")}>
                Save as Draft
              </button>
              <button type="button" className="btn btn-primary" onClick={() => handleCreateChallan("Confirmed")}>
                Confirm & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

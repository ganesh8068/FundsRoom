import React, { useState, useEffect } from "react";

export default function CRMPage({ token, userRole }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    business_name: "",
    gst_number: "",
    type: "Retail",
    address: "",
    status: "Lead",
    follow_up_date: "",
    notes: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const backendUrl = "http://localhost:8000/api";

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${backendUrl}/customers?search=${search}&type=${typeFilter}&status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter, statusFilter]);

  const selectCustomer = async (cust) => {
    try {
      const res = await fetch(`${backendUrl}/customers/${cust.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedCustomer(data.customer);
        setNotes(data.notes || []);
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
      const res = await fetch(`${backendUrl}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Customer created successfully!");
        setShowAddModal(false);
        fetchCustomers();
        // Reset form
        setFormData({
          name: "",
          mobile: "",
          email: "",
          business_name: "",
          gst_number: "",
          type: "Retail",
          address: "",
          status: "Lead",
          follow_up_date: "",
          notes: ""
        });
      } else {
        setError(data.error || "Failed to create customer");
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
      const res = await fetch(`${backendUrl}/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Customer updated successfully!");
        setShowEditModal(false);
        selectCustomer(data);
        fetchCustomers();
      } else {
        setError(data.error || "Failed to update customer");
      }
    } catch (err) {
      setError("Network error occurred.");
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`${backendUrl}/customers/${selectedCustomer.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note: newNote })
      });
      if (res.ok) {
        const added = await res.json();
        setNotes([added, ...notes]);
        setNewNote("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = () => {
    setFormData({
      name: selectedCustomer.name,
      mobile: selectedCustomer.mobile,
      email: selectedCustomer.email,
      business_name: selectedCustomer.business_name,
      gst_number: selectedCustomer.gst_number || "",
      type: selectedCustomer.type,
      address: selectedCustomer.address,
      status: selectedCustomer.status,
      follow_up_date: selectedCustomer.follow_up_date ? selectedCustomer.follow_up_date.slice(0, 10) : "",
      notes: selectedCustomer.notes || ""
    });
    setShowEditModal(true);
  };

  const isWriteAllowed = userRole === "Admin" || userRole === "Sales";

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Customer Relationship Management</h2>
          <p className="page-subtitle">Manage retail, wholesale, and distributor client operations.</p>
        </div>
        {isWriteAllowed && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Customer
          </button>
        )}
      </div>

      {success && <div className="alert-bar alert-bar-success">{success}</div>}
      {error && <div className="alert-bar alert-bar-error">{error}</div>}

      <div className="detail-grid">
        {/* Customer List Section */}
        <div className="content-card">
          <div className="table-controls">
            <input
              type="text"
              placeholder="Search by name, business, mobile, email..."
              className="form-control search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="form-control select-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Distributor">Distributor</option>
            </select>
            <select
              className="form-control select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Customer Name</th>
                  <th>Contact info</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Next Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">No customers found</td>
                  </tr>
                ) : (
                  customers.map((cust) => (
                    <tr
                      key={cust.id}
                      onClick={() => selectCustomer(cust)}
                      style={{ cursor: "pointer", background: selectedCustomer?.id === cust.id ? "var(--bg-card-hover)" : "" }}
                    >
                      <td style={{ fontWeight: 600 }}>{cust.business_name}</td>
                      <td>{cust.name}</td>
                      <td>
                        <div style={{ fontSize: "13px" }}>{cust.mobile}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{cust.email}</div>
                      </td>
                      <td>
                        <span className={`badge badge-info`}>{cust.type}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            cust.status === "Active"
                              ? "badge-success"
                              : cust.status === "Inactive"
                              ? "badge-error"
                              : "badge-warning"
                          }`}
                        >
                          {cust.status}
                        </span>
                      </td>
                      <td>
                        {cust.follow_up_date
                          ? new Date(cust.follow_up_date).toLocaleDateString()
                          : "Not scheduled"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Detail Side Panel */}
        <div className="detail-section">
          {selectedCustomer ? (
            <div className="content-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 700 }}>{selectedCustomer.business_name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>{selectedCustomer.name}</p>
                </div>
                {isWriteAllowed && (
                  <button className="btn btn-secondary" onClick={openEdit} style={{ padding: "6px 12px", fontSize: "12px" }}>
                    Edit
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <div><strong>Email:</strong> {selectedCustomer.email}</div>
                <div><strong>Mobile:</strong> {selectedCustomer.mobile}</div>
                <div><strong>GST Number:</strong> {selectedCustomer.gst_number || "N/A"}</div>
                <div><strong>Address:</strong> {selectedCustomer.address}</div>
                <div><strong>Status:</strong> <span className={`badge ${selectedCustomer.status === "Active" ? "badge-success" : selectedCustomer.status === "Inactive" ? "badge-error" : "badge-warning"}`}>{selectedCustomer.status}</span></div>
                {selectedCustomer.follow_up_date && (
                  <div><strong>Follow-up:</strong> {new Date(selectedCustomer.follow_up_date).toLocaleDateString()}</div>
                )}
                {selectedCustomer.notes && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>General Notes:</strong>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "20px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>Follow-up Interaction Log</h4>
                <form onSubmit={handleAddNote} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <input
                    type="text"
                    placeholder="Type a new follow-up update..."
                    className="form-control"
                    style={{ flexGrow: 1 }}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: "10px 16px" }}>
                    Add
                  </button>
                </form>

                <div className="notes-timeline">
                  {notes.length === 0 ? (
                    <div className="no-data" style={{ padding: "20px" }}>No follow-up log recorded yet.</div>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="note-item">
                        <div className="note-meta">
                          <span>By: {note.created_by}</span>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <p className="note-content">{note.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="content-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
              <p style={{ color: "var(--text-muted)" }}>Select a customer to view details & logs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Add New Customer</h3>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ padding: "6px 12px" }}>X</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Business Name</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person Name</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      required
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">GST Number (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Type</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                      <option value="Distributor">Distributor</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    required
                    rows="3"
                    className="form-control"
                    style={{ resize: "none" }}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">CRM Status</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Lead">Lead</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next Follow-up Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">General CRM Notes</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    style={{ resize: "none" }}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Edit Customer</h3>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)} style={{ padding: "6px 12px" }}>X</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Business Name</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person Name</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      required
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">GST Number (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Type</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                      <option value="Distributor">Distributor</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    required
                    rows="3"
                    className="form-control"
                    style={{ resize: "none" }}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">CRM Status</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Lead">Lead</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next Follow-up Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">General CRM Notes</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    style={{ resize: "none" }}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

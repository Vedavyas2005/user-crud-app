import React, { useEffect, useState } from "react";
import { Container, Row, Col, Nav, Form, Button, Table, Modal } from "react-bootstrap";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Sidebar() {
  return (
    <Nav className="flex-column bg-dark vh-100 text-white p-3" style={{ minWidth: "220px" }}>
      <Nav.Item className="mb-3 fs-4 text-center">Dashboard</Nav.Item>
      <Nav.Item><Nav.Link as={Link} to="/profile" className="text-white">User Profile</Nav.Link></Nav.Item>
      <Nav.Item><Nav.Link as={Link} to="/notifications" className="text-white">Notifications</Nav.Link></Nav.Item>
      <Nav.Item><Nav.Link as={Link} to="/billing" className="text-white">Billing & Invoices</Nav.Link></Nav.Item>
      <Nav.Item><Nav.Link as={Link} to="/plans" className="text-white">Plans & Add-ons</Nav.Link></Nav.Item>
    </Nav>
  );
}

function UserProfile() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: ""
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch(`${API_BASE_URL}/users`)
      .then(res => res.json())
      .then(setUsers)
      .catch(() => setError("Failed to load users."));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (editingUser) {
      const bodyData = { ...formData };
      if (!bodyData.password) delete bodyData.password;
      fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      }).then(res => {
        if (!res.ok) return res.json().then(j => { throw new Error(j.detail || "Error") });
        return res.json();
      }).then(() => {
        setShowModal(false);
        fetchUsers();
      }).catch(e => setError(e.message));
    } else {
      fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }).then(res => {
        if (!res.ok) return res.json().then(j => { throw new Error(j.detail || "Error") });
        return res.json();
      }).then(() => {
        setFormData({ email: "", first_name: "", last_name: "", password: "" });
        fetchUsers();
      }).catch(e => setError(e.message));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: ""
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      fetch(`${API_BASE_URL}/users/${id}`, { method: "DELETE" })
        .then(() => fetchUsers())
        .catch(() => setError("Failed to delete user."));
    }
  };

  const resetModal = () => {
    setEditingUser(null);
    setFormData({ email: "", first_name: "", last_name: "", password: "" });
    setError("");
  };

  return (
    <Container>
      <h2>User Profile Management</h2>
      <Button variant="primary" onClick={() => { resetModal(); setShowModal(true); }}>Create New User</Button>
      {error && <div className="alert alert-danger mt-2">{error}</div>}
      <Table striped bordered hover responsive className="mt-3">
        <thead>
          <tr><th>ID</th><th>Email</th><th>First Name</th><th>Last Name</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.length === 0 && <tr><td colSpan="5" className="text-center">No users found.</td></tr>}
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.first_name}</td>
              <td>{u.last_name}</td>
              <td>
                <Button size="sm" variant="warning" onClick={() => handleEdit(u)} className="me-2">Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(u.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal for Create/Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} onExited={resetModal}>
        <Modal.Header closeButton><Modal.Title>{editingUser ? `Edit User #${editingUser.id}` : "Create New User"}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control type="email" name="email" required value={formData.email} onChange={handleFormChange} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formFirstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control type="text" name="first_name" required value={formData.first_name} onChange={handleFormChange} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formLastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control type="text" name="last_name" required value={formData.last_name} onChange={handleFormChange} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>{editingUser ? "New Password (leave blank to keep current)" : "Password"}</Form.Label>
              <Form.Control type="password" name="password" {...(editingUser ? {} : { required: true })} value={formData.password} onChange={handleFormChange} />
            </Form.Group>
            <Button variant="primary" type="submit">{editingUser ? "Update User" : "Create User"}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

function Notifications() {
  const notifications = [
    { id: 1, message: "Your billing statement is ready.", date: "2025-10-24" },
    { id: 2, message: "Password changed successfully.", date: "2025-10-20" },
  ];

  return (
    <Container>
      <h2>Notifications</h2>
      <Table striped bordered hover>
        <thead><tr><th>Date</th><th>Message</th></tr></thead>
        <tbody>
          {notifications.map(n => (
            <tr key={n.id}><td>{n.date}</td><td>{n.message}</td></tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

function Billing() {
  return (
    <Container>
      <h2>Billing & Invoices</h2>
      <Form>
        <Form.Group className="mb-3" controlId="cardNumber">
          <Form.Label>Credit Card Number</Form.Label>
          <Form.Control type="text" placeholder="Card number" />
        </Form.Group>
        <Row>
          <Form.Group as={Col} md={6} className="mb-3" controlId="expiryDate">
            <Form.Label>Expiry Date</Form.Label>
            <Form.Control type="text" placeholder="MM/YY" />
          </Form.Group>
          <Form.Group as={Col} md={6} className="mb-3" controlId="cvv">
            <Form.Label>CVV</Form.Label>
            <Form.Control type="password" placeholder="CVV" />
          </Form.Group>
        </Row>
        <Form.Group className="mb-3" controlId="billingAddress">
          <Form.Label>Billing Address</Form.Label>
          <Form.Control as="textarea" rows={3} />
        </Form.Group>
        <Button variant="success" type="submit">Submit Payment</Button>
      </Form>
    </Container>
  );
}

function Plans() {
  return (
    <Container>
      <h2>Plans & Add-ons</h2>
      <Form>
        <Form.Group className="mb-3" controlId="selectPlan">
          <Form.Label>Select Plan</Form.Label>
          <Form.Select>
            <option>Basic</option>
            <option>Pro</option>
            <option>Enterprise</option>
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3" controlId="addOns">
          <Form.Label>Add-ons</Form.Label>
          <Form.Check type="checkbox" label="Extra storage" />
          <Form.Check type="checkbox" label="Priority support" />
          <Form.Check type="checkbox" label="Custom branding" />
        </Form.Group>
        <Button variant="primary" type="submit">Update Plan</Button>
      </Form>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <Container fluid>
        <Row>
          <Col xs={3} className="p-0">
            <Sidebar />
          </Col>
          <Col xs={9} className="p-4">
            <Routes>
              <Route path="/" element={<Navigate to="/profile" replace />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/plans" element={<Plans />} />
            </Routes>
          </Col>
        </Row>
      </Container>
    </Router>
  );
}

export default App;

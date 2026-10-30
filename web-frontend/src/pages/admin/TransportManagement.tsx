import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/Sidebar";
import apiClient from '../../api/client';
import { Search, Plus, Bus, MapPin, ArrowLeft, Phone, User, Edit2, Trash2, X, Car, Users, Clock } from 'lucide-react';
import './Directory.css';

interface RouteData {
  id: string;
  route_name: string;
  driver_name: string;
  driver_phone: string;
  vehicle_number: string;
  vehicle_type: 'bus' | 'van' | 'private';
  capacity: number;
  assigned_students_count?: number;
}

const VEHICLE_TYPES = {
  bus: { icon: <Bus size={20} />, label: 'Bus', color: '#3B82F6', bg: '#EFF6FF' },
  van: { icon: <Car size={20} />, label: 'Van', color: '#F59E0B', bg: '#FFFBEB' },
  private: { icon: <Car size={20} />, label: 'Private', color: '#8B5CF6', bg: '#F3E8FF' }
};

const TransportManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State for Route
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modal State for Student Assignment
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({
    grade: '',
    student_id: '',
    route_id: '',
    pickup_point: '',
    pickup_time: '08:30',
    drop_time: '13:30'
  });
  const [assigning, setAssigning] = useState(false);

  // Modal State for Viewing Route Students
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [routeStudents, setRouteStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const emptyForm = { 
    id: '',
    route_name: '', 
    vehicle_number: '', 
    driver_name: '', 
    driver_phone: '', 
    capacity: '',
    vehicle_type: 'bus' as 'bus' | 'van' | 'private'
  };
  
  const [formData, setFormData] = useState(emptyForm);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/transport/routes');
      setRoutes(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch transport routes', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndClasses = async () => {
    try {
      const [stRes, clsRes] = await Promise.all([
        apiClient.get('/admin/students'),
        apiClient.get('/classes')
      ]);
      setStudents(stRes.data?.data || stRes.data || []);
      setClasses(clsRes.data?.data || clsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch students & classes', err);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (route: RouteData) => {
    setIsEditing(true);
    setFormData({
      id: route.id,
      route_name: route.route_name,
      vehicle_number: route.vehicle_number,
      driver_name: route.driver_name,
      driver_phone: route.driver_phone,
      capacity: route.capacity.toString(),
      vehicle_type: route.vehicle_type || 'bus'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        route_name: formData.route_name,
        driver_name: formData.driver_name,
        driver_phone: formData.driver_phone,
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        capacity: parseInt(formData.capacity, 10) || 15
      };

      if (isEditing) {
        await apiClient.put(`/transport/routes/${formData.id}`, payload);
        alert('Route updated successfully');
      } else {
        await apiClient.post('/transport/routes', payload);
        alert('Route added successfully');
      }
      setIsModalOpen(false);
      fetchRoutes();
    } catch (error: any) {
      console.error('Failed to save route', error);
      alert(error.response?.data?.error || 'Could not save transport route');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the route "${name}"?`)) return;
    try {
      await apiClient.delete(`/transport/routes/${id}`);
      fetchRoutes();
    } catch (error) {
      console.error('Failed to delete route', error);
      alert('Error deleting route');
    }
  };

  const openAssignModal = (preselectedRouteId?: string) => {
    fetchStudentsAndClasses();
    setAssignForm({
      grade: '',
      student_id: '',
      route_id: preselectedRouteId || (routes.length > 0 ? routes[0].id : ''),
      pickup_point: '',
      pickup_time: '08:30',
      drop_time: '13:30'
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.student_id || !assignForm.route_id || !assignForm.pickup_point) {
      alert('Please select student, route, and enter pickup point');
      return;
    }
    setAssigning(true);
    try {
      await apiClient.post('/transport/assign', {
        student_id: assignForm.student_id,
        route_id: assignForm.route_id,
        pickup_point: assignForm.pickup_point,
        pickup_time: assignForm.pickup_time,
        drop_time: assignForm.drop_time
      });
      alert('Student assigned to transport route successfully!');
      setIsAssignModalOpen(false);
      fetchRoutes();
      if (selectedRoute && selectedRoute.id === assignForm.route_id) {
        openRouteStudentsModal(selectedRoute);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign student to transport');
    } finally {
      setAssigning(false);
    }
  };

  const openRouteStudentsModal = async (route: RouteData) => {
    setSelectedRoute(route);
    setIsStudentsModalOpen(true);
    setLoadingStudents(true);
    try {
      const res = await apiClient.get(`/transport/routes/${route.id}/students`);
      setRouteStudents(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch route students', err);
      setRouteStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this route?`)) return;
    try {
      await apiClient.delete(`/transport/assign/${studentId}`);
      if (selectedRoute) {
        openRouteStudentsModal(selectedRoute);
      }
      fetchRoutes();
    } catch (err) {
      alert('Failed to remove student from route');
    }
  };

  const filteredRoutes = routes.filter(route => 
    route.route_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    route.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCapacity = routes.reduce((sum, route) => sum + (route.capacity || 0), 0);
  const totalAssignedStudents = routes.reduce((sum, route) => sum + (route.assigned_students_count || 0), 0);
  const activeVehicles = routes.length;

  const filteredStudentsForAssign = assignForm.grade
    ? students.filter(s => s.grade === assignForm.grade)
    : students;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text">Transport Management</h1>
              <p className="date-text">Manage school bus fleet, routes, drivers, and student seat assignments</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn-secondary" 
              onClick={() => openAssignModal()} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', fontWeight: 800, padding: '0.65rem 1.25rem', borderRadius: '0.75rem' }}
            >
              <Users size={18} /> Assign Student
            </button>
            <button 
              className="btn-primary" 
              onClick={openAddModal} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F43F5E', boxShadow: '0 4px 6px -1px rgba(244, 63, 94, 0.2)', fontWeight: 800, padding: '0.65rem 1.25rem', borderRadius: '0.75rem' }}
            >
              <Plus size={20} /> Add Vehicle
            </button>
          </div>
        </header>

        {/* Dynamic Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #E0E7FF' }}>
            <div style={{ padding: '1rem', background: '#EEF2FF', color: '#6366F1', borderRadius: '1rem' }}>
              <MapPin size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#6366F1', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Routes</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#312E81', fontSize: '1.75rem', fontWeight: 900 }}>{routes.length}</h3>
            </div>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #FFE4E6' }}>
            <div style={{ padding: '1rem', background: '#FFF1F2', color: '#F43F5E', borderRadius: '1rem' }}>
              <Bus size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#F43F5E', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Active Vehicles</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#881337', fontSize: '1.75rem', fontWeight: 900 }}>{activeVehicles}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #D1FAE5' }}>
            <div style={{ padding: '1rem', background: '#ECFDF5', color: '#059669', borderRadius: '1rem' }}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#059669', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Assigned Students / Capacity</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#064E3B', fontSize: '1.75rem', fontWeight: 900 }}>{totalAssignedStudents} / {totalCapacity}</h3>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="glass-card table-container" style={{ padding: '1.5rem' }}>
          <div className="table-header flex-between" style={{ marginBottom: '1.5rem' }}>
            <div className="search-box" style={{ width: '350px' }}>
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search route, driver or vehicle no..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex-center py-8 text-muted">Loading transport routes...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle Details</th>
                    <th>Route Name</th>
                    <th>Driver Info</th>
                    <th>Students & Capacity</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.length > 0 ? (
                    filteredRoutes.map((route) => {
                      const vType = VEHICLE_TYPES[route.vehicle_type || 'bus'] || VEHICLE_TYPES.bus;
                      const capacity = route.capacity || 0;
                      const occupied = route.assigned_students_count || 0;
                      const availableSeats = capacity - occupied;

                      return (
                        <tr key={route.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: vType.bg, color: vType.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {vType.icon}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '1rem' }}>{route.vehicle_number}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, marginTop: '2px', textTransform: 'capitalize' }}>
                                  {vType.label}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0F172A' }}>
                              <MapPin size={16} color="#F43F5E" />
                              {route.route_name}
                            </div>
                          </td>
                          <td>
                            <div>
                              <div style={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={14} color="#64748B" /> {route.driver_name}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={14} color="#64748B" /> {route.driver_phone}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <button
                                onClick={() => openRouteStudentsModal(route)}
                                style={{
                                  background: '#EEF2FF',
                                  color: '#4F46E5',
                                  border: '1px solid #C7D2FE',
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  cursor: 'pointer'
                                }}
                                title="Click to view assigned students"
                              >
                                <Users size={14} /> {occupied} Students
                              </button>
                              
                              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>
                                / {capacity}
                              </span>

                              {availableSeats <= 0 ? (
                                <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800 }}>Full</span>
                              ) : (
                                <span style={{ background: '#ECFDF5', color: '#059669', padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800 }}>{availableSeats} Left</span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button 
                                className="icon-btn" 
                                onClick={() => openAssignModal(route.id)} 
                                title="Assign Student to this Vehicle"
                                style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}
                              >
                                <Plus size={16} />
                              </button>
                              <button className="icon-btn text-blue" onClick={() => openEditModal(route)} title="Edit Route" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                <Edit2 size={16} />
                              </button>
                              <button className="icon-btn text-red" onClick={() => handleDelete(route.id, route.route_name)} title="Delete Route" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted" style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <Bus size={48} color="#CBD5E1" />
                          No transport routes found.
                          <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Click "Add Vehicle" to create a new route.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── MODAL 1: Add/Edit Route Modal ────────────────────────────────────── */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#1E293B', margin: 0 }}>{isEditing ? 'Edit Route' : 'Add Vehicle / Route'}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>Configure transport vehicle, driver, and capacity</p>
                </div>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Route Name / Area *</label>
                    <input type="text" name="route_name" className="input-field" placeholder="e.g. Route A - Sambhajinagar Zoo Chowk" value={formData.route_name} onChange={handleInputChange} required style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Driver Name *</label>
                    <input type="text" name="driver_name" className="input-field" placeholder="e.g. Ramesh Patil" value={formData.driver_name} onChange={handleInputChange} required style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Driver Phone *</label>
                    <input type="text" name="driver_phone" className="input-field" placeholder="e.g. 9876543210" value={formData.driver_phone} onChange={handleInputChange} required style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Vehicle Number *</label>
                    <input type="text" name="vehicle_number" className="input-field" placeholder="e.g. MH 14 GH 4521" value={formData.vehicle_number} onChange={handleInputChange} required style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Total Capacity *</label>
                    <input type="number" name="capacity" className="input-field" placeholder="e.g. 15" min="1" value={formData.capacity} onChange={handleInputChange} required style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Vehicle Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      {(['bus', 'van', 'private'] as const).map(type => {
                        const isSelected = formData.vehicle_type === type;
                        const conf = VEHICLE_TYPES[type];
                        return (
                          <div 
                            key={type} 
                            onClick={() => setFormData({ ...formData, vehicle_type: type })}
                            style={{ 
                              border: `2px solid ${isSelected ? conf.color : '#E2E8F0'}`, 
                              background: isSelected ? conf.bg : 'white',
                              borderRadius: '0.75rem',
                              padding: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ color: isSelected ? conf.color : '#64748B' }}>{conf.icon}</span>
                            <span style={{ fontWeight: 800, color: isSelected ? conf.color : '#475569' }}>{conf.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#F43F5E', padding: '0.8rem 2rem', fontSize: '1rem' }}>
                    {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Route')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL 2: Assign Student to Transport Modal ──────────────────────── */}
        {isAssignModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '620px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#EEF2FF' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: '#312E81', margin: 0 }}>Assign Student to Transport</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#6366F1', fontSize: '0.85rem' }}>Select Class, Student, and assign to a Vehicle Route</p>
                </div>
                <button className="icon-btn" onClick={() => setIsAssignModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} style={{ padding: '2rem' }}>
                
                {/* 1. Filter by Class / Grade */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Class / Grade</label>
                    <select
                      className="input-field"
                      value={assignForm.grade}
                      onChange={(e) => setAssignForm({ ...assignForm, grade: e.target.value, student_id: '' })}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.65rem' }}
                    >
                      <option value="">All Classes</option>
                      {classes.map(c => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Select Student */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Student Name *</label>
                    <select
                      className="input-field"
                      value={assignForm.student_id}
                      onChange={(e) => setAssignForm({ ...assignForm, student_id: e.target.value })}
                      required
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.65rem', fontWeight: 700 }}
                    >
                      <option value="">-- Choose Student --</option>
                      {filteredStudentsForAssign.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.last_name} ({s.grade || 'No Class'}) - ADM: {s.admission_number || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Select Vehicle / Route */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Select Vehicle / Route *</label>
                  <select
                    className="input-field"
                    value={assignForm.route_id}
                    onChange={(e) => setAssignForm({ ...assignForm, route_id: e.target.value })}
                    required
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.65rem', fontWeight: 700 }}
                  >
                    <option value="">-- Choose Route --</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.route_name} - {r.vehicle_number} (Driver: {r.driver_name}) [{r.assigned_students_count || 0}/{r.capacity} seats]
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Pickup Point */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Pickup / Drop Point (Bus Stop) *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Sambhajinagar Zoo Chowk, Main Gate"
                    value={assignForm.pickup_point}
                    onChange={(e) => setAssignForm({ ...assignForm, pickup_point: e.target.value })}
                    required
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.65rem' }}
                  />
                </div>

                {/* 5. Pickup & Drop Times */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} /> Morning Pickup Time
                    </label>
                    <input
                      type="time"
                      className="input-field"
                      value={assignForm.pickup_time}
                      onChange={(e) => setAssignForm({ ...assignForm, pickup_time: e.target.value })}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.65rem' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} /> Afternoon Drop Time
                    </label>
                    <input
                      type="time"
                      className="input-field"
                      value={assignForm.drop_time}
                      onChange={(e) => setAssignForm({ ...assignForm, drop_time: e.target.value })}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.65rem' }}
                    />
                  </div>
                </div>

                <div className="modal-actions" style={{ paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={assigning} className="btn-primary" style={{ background: '#4F46E5', padding: '0.75rem 2rem' }}>
                    {assigning ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL 3: View Route Assigned Students Modal ────────────────────── */}
        {isStudentsModalOpen && selectedRoute && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: '#1E293B', margin: 0 }}>
                    Students on {selectedRoute.route_name}
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                    Vehicle: {selectedRoute.vehicle_number} | Driver: {selectedRoute.driver_name} ({selectedRoute.driver_phone})
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    className="btn-primary" 
                    onClick={() => { setIsStudentsModalOpen(false); openAssignModal(selectedRoute.id); }}
                    style={{ background: '#059669', padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Plus size={16} /> Add Student
                  </button>
                  <button className="icon-btn" onClick={() => setIsStudentsModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                    <X size={20} color="#64748B" />
                  </button>
                </div>
              </div>

              <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {loadingStudents ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Loading assigned students...</div>
                ) : routeStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                    <Users size={40} color="#CBD5E1" style={{ margin: '0 auto 0.75rem auto', display: 'block' }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>No students assigned to this route yet.</p>
                    <button 
                      onClick={() => { setIsStudentsModalOpen(false); openAssignModal(selectedRoute.id); }}
                      style={{ marginTop: '0.75rem', background: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      + Assign First Student
                    </button>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Class / Grade</th>
                        <th>Pickup Point / Stop</th>
                        <th>Pickup & Drop Time</th>
                        <th>Parent Phone</th>
                        <th style={{ textAlign: 'right' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeStudents.map(st => (
                        <tr key={st.student_id}>
                          <td>
                            <div style={{ fontWeight: 800, color: '#1E293B' }}>
                              {st.first_name} {st.last_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              ADM: {st.admission_number || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem' }}>
                              {st.grade || 'Nursery'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#334155' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <MapPin size={14} color="#F43F5E" />
                              {st.pickup_point || '-'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 700 }}>
                              Pickup: {st.pickup_time || '-'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              Drop: {st.drop_time || '-'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                              {st.parent_name || 'Parent'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              {st.parent_phone || '-'}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="icon-btn text-red"
                              onClick={() => handleRemoveStudent(st.student_id, `${st.first_name} ${st.last_name}`)}
                              title="Remove from Route"
                              style={{ background: '#FEF2F2', color: '#DC2626' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{ padding: '1rem 2rem', borderTop: '1px solid #E2E8F0', textAlign: 'right', background: '#F8FAFC' }}>
                <button className="btn-secondary" onClick={() => setIsStudentsModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default TransportManagement;

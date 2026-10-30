import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Sidebar from '../../components/Sidebar';
import { Search, Plus, Trash2, Users, ArrowLeft, X, Edit2 } from 'lucide-react';
import './Directory.css';

interface ClassItem {
  id: string;
  name: string;
  section?: string;
  capacity?: number;
  description?: string;
  enrolled_count?: number;
  vacant_seats?: number;
  class_teacher_id?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
}

const ClassesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', section: 'A', capacity: 30, description: '', class_teacher_id: '' });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', section: 'A', capacity: 30, description: '', class_teacher_id: '' });

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const isSuperAdmin = loggedUser?.role === 'super_admin' || loggedUser?.role === 'owner' || loggedUser?.email === 'admin@edunive.com';

  const userBranch = (() => {
    if (loggedUser?.branchName) return loggedUser.branchName;
    if (loggedUser?.school_name) return loggedUser.school_name;
    const str = `${loggedUser?.firstName || ''} ${loggedUser?.lastName || ''} ${loggedUser?.email || ''}`.toLowerCase();
    if (str.includes('chikhali')) return 'Chikhali Branch';
    if (str.includes('dudulgaon')) return 'Dudulgaon Branch';
    return 'Chinchwad Branch';
  })();

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(isSuperAdmin ? 'All' : userBranch);
  const [dbBranches, setDbBranches] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/franchise/branches').then(res => {
      if (res.data?.data) setDbBranches(res.data.data);
    }).catch(() => {});

    apiClient.get('/admin/staff').then(res => {
      const list = res.data || [];
      setTeachersList(list);
    }).catch(err => {
      console.error('Failed to fetch teachers for class assignment', err);
    });
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const selectedBranchObj = dbBranches.find(b => b.name === selectedBranchFilter || b.name?.toLowerCase().includes(selectedBranchFilter.toLowerCase().replace(' branch', '')));
      let schoolId = selectedBranchObj?.id || loggedUser?.school_id;
      const params = (selectedBranchFilter !== 'All' || !isSuperAdmin) ? (schoolId ? { school_id: schoolId } : {}) : {};

      const response = await apiClient.get('/classes', { params });
      setClasses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch classes', error);
    } finally {
      setLoading(false);
    }
  }, [dbBranches, selectedBranchFilter, isSuperAdmin, loggedUser?.school_id]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filteredClasses = classes.filter(c => 
    `${c.name} ${c.section || ''} ${c.description || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 30), 0);
  const totalEnrolled = classes.reduce((sum, c) => sum + (c.enrolled_count || 0), 0);
  const totalVacant = Math.max(totalCapacity - totalEnrolled, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.name === 'capacity' ? Number(e.target.value) : e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/classes', formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', section: 'A', capacity: 30, description: '', class_teacher_id: '' });
      fetchClasses();
    } catch (error) {
      console.error('Failed to create class', error);
      alert('Failed to add class');
    }
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditingClassId(cls.id);
    setEditFormData({
      name: cls.name || '',
      section: cls.section || 'A',
      capacity: cls.capacity || 30,
      description: cls.description || '',
      class_teacher_id: cls.class_teacher_id || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.name === 'capacity' ? Number(e.target.value) : e.target.value });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassId) return;
    try {
      await apiClient.put(`/classes/${editingClassId}`, editFormData);
      setIsEditModalOpen(false);
      setEditingClassId(null);
      fetchClasses();
    } catch (error) {
      console.error('Failed to update class', error);
      alert('Failed to update class details');
    }
  };

  const handleDeleteClass = async (id: string, className: string) => {
    if (!window.confirm(`Are you sure you want to delete ${className}?`)) return;
    try {
      await apiClient.delete(`/classes/${id}`);
      fetchClasses();
    } catch (error) {
      console.error('Failed to delete class', error);
      alert('Could not delete class');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">Classes & Available Seats</h1>
              <p className="date-text">Track class wise enrolled admissions, available vacant seats, and max class capacities</p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={20} /> Add New Class
          </button>
        </header>

        {/* Dynamic Admission Seats Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.9rem', background: '#EFF6FF', color: '#2563EB', borderRadius: '0.75rem' }}>
              <Users size={26} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#2563EB', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Total School Seats Capacity</p>
              <h3 style={{ margin: '0.2rem 0 0 0', color: '#1E40AF', fontSize: '1.6rem', fontWeight: 900 }}>{totalCapacity} Seats</h3>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid #E0E7FF', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.9rem', background: '#EEF2FF', color: '#4F46E5', borderRadius: '0.75rem' }}>
              <Users size={26} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#4F46E5', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Admitted Students Enrolled</p>
              <h3 style={{ margin: '0.2rem 0 0 0', color: '#312E81', fontSize: '1.6rem', fontWeight: 900 }}>{totalEnrolled} Students</h3>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.9rem', background: '#F0FDF4', color: '#16A34A', borderRadius: '0.75rem' }}>
              <Users size={26} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#16A34A', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Vacant Seats for Admission</p>
              <h3 style={{ margin: '0.2rem 0 0 0', color: '#15803D', fontSize: '1.6rem', fontWeight: 900 }}>{totalVacant} Seats Available 🟢</h3>
            </div>
          </div>
        </div>

        <div className="glass-card table-container" style={{ padding: '1.5rem' }}>
          <div className="table-header flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="search-box" style={{ width: '350px' }}>
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search classes by name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Branch Isolation Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F8FAFC', padding: '0.4rem 0.8rem', borderRadius: '0.85rem', border: '1px solid #CBD5E1' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>📍 BRANCH:</span>
              <select 
                value={selectedBranchFilter} 
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                disabled={!isSuperAdmin}
                style={{ border: 'none', background: 'transparent', fontWeight: 800, color: '#1E293B', outline: 'none', cursor: isSuperAdmin ? 'pointer' : 'not-allowed', fontSize: '0.85rem' }}
              >
                {isSuperAdmin && <option value="All">All Franchise Branches</option>}
                {dbBranches.length > 0 ? (
                  dbBranches
                    .filter((b: any) => isSuperAdmin || b.name?.toLowerCase().includes(userBranch.toLowerCase().replace(' branch', '')))
                    .map((b: any) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))
                ) : (
                  userBranch !== 'All' ? (
                    <option value={userBranch}>{userBranch}</option>
                  ) : (
                    <option value="All">Loading Branches...</option>
                  )
                )}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex-center py-8">Loading classes & vacant seats...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class & Description</th>
                  <th>Section</th>
                  <th>Class Teacher</th>
                  <th>Total Capacity</th>
                  <th>Enrolled Students</th>
                  <th>Vacant Seats (Remaining)</th>
                  <th>Occupancy</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls) => {
                    const capacity = cls.capacity || 30;
                    const enrolled = cls.enrolled_count || 0;
                    const vacant = Math.max(capacity - enrolled, 0);
                    const fillPercent = Math.min(Math.round((enrolled / capacity) * 100), 100);

                    return (
                      <tr key={cls.id}>
                        <td>
                          <div className="font-bold text-main" style={{ fontSize: '1.1rem', color: '#0F172A' }}>
                            {cls.name}
                          </div>
                          {cls.description && (
                            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                              {cls.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="section-badge">{cls.section || 'A'}</span>
                        </td>
                        <td>
                          {cls.teacher_first_name ? (
                            <span style={{ fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '0.35rem 0.65rem', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', border: '1px solid #C7D2FE', fontSize: '0.825rem' }}>
                              👩‍🏫 {cls.teacher_first_name} {cls.teacher_last_name || ''}
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleOpenEdit(cls)} 
                              style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', color: '#64748B', padding: '0.25rem 0.55rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              title="Click to assign teacher"
                            >
                              + Assign Teacher
                            </button>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#334155' }}>
                            {capacity} Seats
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '0.3rem 0.6rem', borderRadius: '0.5rem' }}>
                            👨‍🎓 {enrolled} Enrolled
                          </span>
                        </td>
                        <td>
                          {vacant > 0 ? (
                            <span style={{ fontWeight: 800, color: '#16A34A', background: '#F0FDF4', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              🟢 {vacant} Vacant Seats Available
                            </span>
                          ) : (
                            <span style={{ fontWeight: 800, color: '#DC2626', background: '#FEF2F2', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #FECACA', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              🔴 FULL (0 Seats Left)
                            </span>
                          )}
                        </td>
                        <td style={{ minWidth: '130px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, background: '#E2E8F0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  width: `${fillPercent}%`, 
                                  height: '100%', 
                                  background: fillPercent >= 100 ? '#EF4444' : fillPercent >= 80 ? '#F59E0B' : '#10B981',
                                  transition: 'width 0.3s ease'
                                }} 
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>{fillPercent}%</span>
                          </div>
                        </td>
                        <td>
                          <div className="actions-cell" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button 
                              className="icon-btn" 
                              title="Edit Class & Seats" 
                              onClick={() => handleOpenEdit(cls)}
                              style={{ color: '#2563EB', background: '#EFF6FF', borderRadius: '0.5rem', padding: '0.45rem', border: '1px solid #DBEAFE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="icon-btn text-red" 
                              title="Delete Class" 
                              onClick={() => handleDeleteClass(cls.id, cls.name)}
                              style={{ color: '#DC2626', background: '#FEF2F2', borderRadius: '0.5rem', padding: '0.45rem', border: '1px solid #FECACA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted">
                      No classes found matching search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Add New Class</h2>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Class Name</label>
                  <input type="text" name="name" className="input-field" value={formData.name} onChange={handleInputChange} placeholder="e.g. Nursery, Junior KG, Senior KG" required />
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <input type="text" name="section" className="input-field" value={formData.section} onChange={handleInputChange} placeholder="e.g. A, B, Morning" required />
                </div>
                <div className="form-group">
                  <label>Assign Class Teacher</label>
                  <select 
                    name="class_teacher_id" 
                    className="input-field" 
                    value={formData.class_teacher_id} 
                    onChange={handleInputChange as any}
                  >
                    <option value="">-- No Teacher Assigned --</option>
                    {teachersList.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name || ''} ({t.email || t.role || 'Teacher'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Seats Capacity</label>
                  <input type="number" name="capacity" className="input-field" value={formData.capacity} onChange={handleInputChange} required min="1" max="200" placeholder="e.g. 30" />
                </div>
                <div className="form-group">
                  <label>Description / Age Group</label>
                  <input type="text" name="description" className="input-field" value={formData.description} onChange={handleInputChange} placeholder="e.g. Nursery (2.5 - 3.5 yrs)" />
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Class</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edit Class & Available Seats</h2>
                <button className="icon-btn" onClick={() => setIsEditModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateSubmit} className="modal-form">
                <div className="form-group">
                  <label>Class Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="input-field" 
                    value={editFormData.name} 
                    onChange={handleEditInputChange} 
                    placeholder="e.g. Nursery, Junior KG, Senior KG" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <input 
                    type="text" 
                    name="section" 
                    className="input-field" 
                    value={editFormData.section} 
                    onChange={handleEditInputChange} 
                    placeholder="e.g. A, B, Morning" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Assign Class Teacher</label>
                  <select 
                    name="class_teacher_id" 
                    className="input-field" 
                    value={editFormData.class_teacher_id} 
                    onChange={handleEditInputChange}
                  >
                    <option value="">-- No Teacher Assigned --</option>
                    {teachersList.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name || ''} ({t.email || t.role || 'Teacher'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Seats Capacity</label>
                  <input 
                    type="number" 
                    name="capacity" 
                    className="input-field" 
                    value={editFormData.capacity} 
                    onChange={handleEditInputChange} 
                    required 
                    min="1" 
                    max="200" 
                    placeholder="e.g. 30" 
                  />
                </div>
                <div className="form-group">
                  <label>Description / Age Group</label>
                  <input 
                    type="text" 
                    name="description" 
                    className="input-field" 
                    value={editFormData.description} 
                    onChange={handleEditInputChange} 
                    placeholder="e.g. Nursery (2.5 - 3.5 yrs)" 
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: '#2563EB' }}>Update Class Details</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClassesManagement;

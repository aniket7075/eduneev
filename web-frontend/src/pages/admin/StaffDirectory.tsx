import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Sidebar from '../../components/Sidebar';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Users, Briefcase, UserCheck, ShieldCheck, Key, CheckSquare, Square, X } from 'lucide-react';
import './Directory.css';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number: string;
  email?: string;
  department?: string;
  designation?: string;
  employee_id?: string;
  base_salary?: string | number;
}

const DEPARTMENTS = ['Teaching', 'Administration', 'Support Staff', 'Transport', 'Daycare', 'General'];

const ALL_MODULE_SCREENS = [
  { title: 'Students Directory', path: '/admin/students', icon: '🎓', cat: 'Academic' },
  { title: 'Staff Directory', path: '/admin/staff', icon: '👩‍🏫', cat: 'Academic' },
  { title: 'Classes Management', path: '/admin/classes', icon: '🏫', cat: 'Academic' },
  { title: 'Homework & Notes', path: '/admin/homework', icon: '📚', cat: 'Academic' },
  { title: 'Admission Enquiries', path: '/admin/enquiries', icon: '📝', cat: 'Leads' },
  { title: 'Daycare Management', path: '/admin/daycare', icon: '👶', cat: 'Leads' },
  { title: 'Fees & Payments', path: '/admin/fees', icon: '💰', cat: 'Finance' },
  { title: 'Expenses & Payroll', path: '/admin/expenses', icon: '🧾', cat: 'Finance' },
  { title: 'Transport Routes', path: '/admin/transport', icon: '🚌', cat: 'Operations' },
  { title: 'Inventory & Supplies', path: '/admin/inventory', icon: '📦', cat: 'Operations' },
  { title: 'Digital Attendance', path: '/admin/attendance', icon: 'ScanLine', cat: 'Operations' },
  { title: 'Story Feed & Media', path: '/admin/stories', icon: '📸', cat: 'Communication' },
  { title: 'Notices & Chat', path: '/admin/notices', icon: '📢', cat: 'Communication' },
  { title: 'CCTV Access', path: '/admin/cctv', icon: '📹', cat: 'Security' },
];

const StaffDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedStaffForPermissions, setSelectedStaffForPermissions] = useState<Staff | null>(null);
  const [allowedScreens, setAllowedScreens] = useState<string[]>([]);
  
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const initialFormState = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'teacher',
    department: 'Teaching',
    designation: '',
    phoneNumber: '',
    employee_id: '',
    base_salary: '25000',
    school_id: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/hr/staff');
      setStaffList(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch staff', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const loggedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (loggedUser?.role?.toLowerCase() === 'teacher') {
        alert('Access Restricted: Teachers do not have permission to view Staff Directory and Salaries.');
        navigate('/admin/dashboard');
        return;
      }
    } catch (e) {
      // ignore
    }
    fetchStaff();
  }, [navigate]);

  const fetchNextEmpId = async (targetSchoolId?: string) => {
    try {
      const res = await apiClient.get('/hr/staff/next-employee-id', {
        params: { school_id: targetSchoolId || formData.school_id }
      });
      if (res.data?.employee_id) {
        setFormData(prev => ({ ...prev, employee_id: res.data.employee_id }));
      }
    } catch (err) {
      console.error('Failed to auto-generate employee ID', err);
    }
  };

  const handleSyncAllEmpIds = async () => {
    if (!window.confirm('All staff members will be assigned systematic, branch-wise Employee IDs (EMP-CHW-..., EMP-CHK-..., EMP-DUD-...). Proceed?')) return;
    try {
      setLoading(true);
      const res = await apiClient.post('/hr/staff/auto-assign-ids');
      alert(`✅ ${res.data.message || 'All Employee IDs standardized successfully!'}`);
      fetchStaff();
    } catch (err) {
      console.error('Sync failed', err);
      alert('Failed to standardize Employee IDs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'school_id' && value) {
      fetchNextEmpId(value);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient.post('/admin/staff', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password || 'Password@123',
        role: formData.role,
        department: formData.department,
        designation: formData.designation,
        phoneNumber: formData.phoneNumber,
        employee_id: formData.employee_id || 'auto',
        school_id: formData.school_id || null
      });
      
      const userId = res.data?.id;
      if (userId) {
        await apiClient.post('/hr/staff/profile', {
          user_id: userId,
          employee_id: formData.employee_id || res.data?.employee_id || 'auto',
          department: formData.department,
          designation: formData.designation,
          base_salary: parseFloat(formData.base_salary) || 0,
          school_id: formData.school_id || null
        });
      }

      setIsAddModalOpen(false);
      fetchStaff();
      setFormData(initialFormState);
      alert('Staff added successfully with Branch Employee ID!');
    } catch (error: any) {
      console.error('Failed to add staff', error);
      alert(error.response?.data?.error || 'Error adding staff');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (member: Staff) => {
    setCurrentStaff(member);
    setFormData({
      firstName: member.first_name || '',
      lastName: member.last_name || '',
      email: member.email || '',
      password: '',
      role: member.role || 'teacher',
      department: member.department || 'Teaching',
      designation: member.designation || '',
      phoneNumber: member.phone_number || '',
      employee_id: member.employee_id || '',
      base_salary: member.base_salary?.toString() || '25000',
      school_id: (member as any).school_id || ''
    });
    setIsEditModalOpen(true);
  };

  const openPermissionsModal = (staffMember: Staff) => {
    setSelectedStaffForPermissions(staffMember);
    const raw = (staffMember as any).allowed_screens;
    let parsed: string[] = [];
    if (raw) {
      try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        parsed = [];
      }
    }
    if (Array.isArray(parsed) && parsed.length > 0) {
      setAllowedScreens(parsed);
    } else if (staffMember.role === 'school_admin' || staffMember.designation?.toLowerCase().includes('principal')) {
      setAllowedScreens(ALL_MODULE_SCREENS.map(s => s.path));
    } else {
      setAllowedScreens(['/admin/students', '/admin/classes', '/admin/attendance', '/admin/homework']);
    }
    setIsPermissionModalOpen(true);
  };

  const toggleScreenPermission = (path: string) => {
    setAllowedScreens(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleSelectAllScreens = () => {
    setAllowedScreens(ALL_MODULE_SCREENS.map(s => s.path));
  };

  const handleDeselectAllScreens = () => {
    setAllowedScreens([]);
  };

  const handleSavePermissions = async () => {
    if (!selectedStaffForPermissions) return;
    setSaving(true);
    const updatedScreensJson = JSON.stringify(allowedScreens);
    try {
      await apiClient.put(`/admin/staff/${selectedStaffForPermissions.id}`, {
        allowed_screens: updatedScreensJson
      });

      setStaffList(prev => prev.map(s => s.id === selectedStaffForPermissions.id ? { ...s, allowed_screens: updatedScreensJson } : s));

      setIsPermissionModalOpen(false);
      alert(`Permissions granted! ${selectedStaffForPermissions.first_name} (${selectedStaffForPermissions.designation || selectedStaffForPermissions.role}) now has access to ${allowedScreens.length} selected screens.`);
    } catch (err) {
      setStaffList(prev => prev.map(s => s.id === selectedStaffForPermissions.id ? { ...s, allowed_screens: updatedScreensJson } : s));
      setIsPermissionModalOpen(false);
      alert(`Permissions updated for ${selectedStaffForPermissions.first_name}!`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) return;
    setSaving(true);
    try {
      await apiClient.put(`/admin/staff/${currentStaff.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        designation: formData.designation,
        phoneNumber: formData.phoneNumber,
        school_id: formData.school_id || null
      });
      
      await apiClient.post('/hr/staff/profile', {
        user_id: currentStaff.id,
        employee_id: formData.employee_id || `EMP-${Date.now().toString().slice(-4)}`,
        department: formData.department,
        designation: formData.designation,
        base_salary: parseFloat(formData.base_salary) || 0,
        school_id: formData.school_id || null
      });
      setIsEditModalOpen(false);
      fetchStaff();
      alert('Staff updated successfully!');
    } catch (error: any) {
      console.error('Failed to update staff', error);
      alert(error.response?.data?.error || 'Error updating staff');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await apiClient.delete(`/admin/staff/${id}`);
      fetchStaff();
    } catch (error) {
      console.error('Failed to delete staff', error);
      alert('Error deactivating staff');
    }
  };

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const isSuperAdmin = loggedUser?.role === 'super_admin';

  const userBranch = (() => {
    if (loggedUser?.branchName) return loggedUser.branchName;
    if (loggedUser?.school_name) return loggedUser.school_name;
    const str = `${loggedUser?.firstName || ''} ${loggedUser?.lastName || ''} ${loggedUser?.email || ''}`.toLowerCase();
    if (str.includes('chikhali')) return 'Chikhali Branch';
    if (str.includes('dudulgaon')) return 'Dudulgaon Branch';
    if (str.includes('chinchwad')) return 'Chinchwad Branch';
    return isSuperAdmin ? 'All' : 'Chinchwad Branch';
  })();

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(() => {
    if (isSuperAdmin) return 'All';
    return userBranch;
  });

  const [dbBranches, setDbBranches] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/franchise/branches').then(res => {
      if (res.data?.data) setDbBranches(res.data.data);
    }).catch(() => {});
  }, []);

  const filteredStaff = staffList.filter(s => {
    // Exclude super_admin explicitly
    if (s.role === 'super_admin' || (s.email && s.email.toLowerCase().includes('admin@prescole.com'))) return false;

    const matchesSearch = `${s.first_name} ${s.last_name} ${s.employee_id || ''} ${s.email || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || s.role === roleFilter;

    const rawBranch = (s as any).school_name || (s as any).branch_name || (s as any).branchName || '';
    const emailLower = (s.email || '').toLowerCase();

    let staffBranch = rawBranch;
    if (!staffBranch) {
      if (emailLower.includes('chikhali')) staffBranch = 'Chikhali Branch';
      else if (emailLower.includes('dudulgaon')) staffBranch = 'Dudulgaon Branch';
      else staffBranch = 'Chinchwad Branch';
    }
    const staffBranchLower = staffBranch.toLowerCase();
    const filterBranchLower = selectedBranchFilter.toLowerCase();

    let matchesBranch = true;
    if (selectedBranchFilter !== 'All') {
      if (filterBranchLower.includes('chinchwad')) matchesBranch = staffBranchLower.includes('chinchwad');
      else if (filterBranchLower.includes('chikhali')) matchesBranch = staffBranchLower.includes('chikhali');
      else if (filterBranchLower.includes('dudulgaon')) matchesBranch = staffBranchLower.includes('dudulgaon');
      else matchesBranch = staffBranchLower.includes(filterBranchLower);
    }

    return matchesSearch && matchesRole && matchesBranch;
  });

  const teachersCount = filteredStaff.filter(s => s.role === 'teacher').length;
  const adminsCount = filteredStaff.filter(s => s.role === 'admin' || s.role === 'school_admin').length;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10 }}>
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">Staff Directory & Role Permissions</h1>
              <p className="date-text">Manage staff profiles and delegate screen access permissions to Principals and Teachers</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-secondary"
              onClick={handleSyncAllEmpIds}
              title="Auto-Assign and Standardize all Employee IDs per branch"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#1E293B', fontWeight: 800, padding: '0.6rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              🔄 Standardize Employee IDs
            </button>
            <button 
              className="btn-primary" 
              onClick={() => {
                const currentBranchObj = dbBranches.find((b: any) => b.name === selectedBranchFilter);
                const targetSchoolId = currentBranchObj?.id || (dbBranches.length > 0 ? dbBranches[0].id : '');
                setFormData({
                  ...initialFormState,
                  school_id: targetSchoolId
                });
                setIsAddModalOpen(true);
                if (targetSchoolId) {
                  fetchNextEmpId(targetSchoolId);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#6366F1', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)' }}
            >
              <Plus size={20} /> Register Staff / Principal
            </button>
          </div>
        </header>

        {/* Dynamic Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #DBEAFE' }}>
            <div style={{ padding: '1rem', background: '#EFF6FF', color: '#3B82F6', borderRadius: '1rem' }}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#3B82F6', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Staff</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#1E40AF', fontSize: '1.75rem', fontWeight: 900 }}>{filteredStaff.length}</h3>
            </div>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #E0E7FF' }}>
            <div style={{ padding: '1rem', background: '#EEF2FF', color: '#4F46E5', borderRadius: '1rem' }}>
              <Briefcase size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#4F46E5', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Active Teachers</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#312E81', fontSize: '1.75rem', fontWeight: 900 }}>{teachersCount}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #FCE7F3' }}>
            <div style={{ padding: '1rem', background: '#FDF2F8', color: '#DB2777', borderRadius: '1rem' }}>
              <UserCheck size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#DB2777', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Principals & Admins</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#831843', fontSize: '1.75rem', fontWeight: 900 }}>{adminsCount}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="search-box" style={{ width: '300px' }}>
                <Search size={18} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Search staff by name or EMP ID..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>

              {/* Branch Isolation Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.45rem 0.8rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 800 }}>📍 BRANCH:</span>
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
            
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {['All', 'teacher', 'school_admin', 'non_teaching_staff'].map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '99px', fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: roleFilter === role ? '#6366F1' : '#F1F5F9',
                    color: roleFilter === role ? 'white' : '#475569',
                    fontSize: '0.85rem', transition: 'all 0.2s', textTransform: 'capitalize'
                  }}
                >
                  {role.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex-center py-8">Loading staff directory...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Role & Dept</th>
                    <th>Contact Info</th>
                    <th>Salary (Base)</th>
                    <th style={{ textAlign: 'right' }}>Actions & Screen Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: member.role === 'teacher' ? '#EEF2FF' : '#FDF2F8', color: member.role === 'teacher' ? '#4F46E5' : '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', border: `1px solid ${member.role === 'teacher' ? '#C7D2FE' : '#FBCFE8'}` }}>
                              {(member.first_name?.[0] || 'S')}{(member.last_name?.[0] || '')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '1rem' }}>{member.first_name} {member.last_name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px', flexWrap: 'wrap' }}>
                                <span style={{ 
                                  fontSize: '0.78rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                                  background: (member.employee_id || '').includes('CHW') ? '#EEF2FF' : (member.employee_id || '').includes('CHK') ? '#ECFDF5' : '#FEF3C7',
                                  color: (member.employee_id || '').includes('CHW') ? '#4F46E5' : (member.employee_id || '').includes('CHK') ? '#059669' : '#D97706',
                                  border: `1px solid ${(member.employee_id || '').includes('CHW') ? '#C7D2FE' : (member.employee_id || '').includes('CHK') ? '#A7F3D0' : '#FDE68A'}`
                                }}>
                                  🆔 {member.employee_id || 'Not Assigned'}
                                </span>
                                <span style={{ fontSize: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                  📍 {(member as any).school_name || (member as any).branch_name || 'Chinchwad Branch'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                            <span className="role-badge" style={{ background: member.role === 'teacher' ? '#EFF6FF' : '#FFFBEB', color: member.role === 'teacher' ? '#2563EB' : '#D97706', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                              {member.role?.replace(/_/g, ' ')}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                              {member.designation || 'Staff'} • {member.department || 'General'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{member.phone_number || 'N/A'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{member.email || 'N/A'}</div>
                        </td>
                        <td style={{ fontWeight: 800, color: '#059669' }}>
                          ₹ {parseFloat(member.base_salary?.toString() || '0').toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button 
                              className="icon-btn" 
                              title="Manage Screen Access Permissions 🛡️" 
                              onClick={() => openPermissionsModal(member)} 
                              style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '0.4rem 0.75rem', width: 'auto', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                              <ShieldCheck size={16} /> Permissions 🛡️
                            </button>
                            <button className="icon-btn" title="Edit Staff Profile" onClick={() => openEditModal(member)} style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                              <Edit2 size={16} />
                            </button>
                            <button className="icon-btn text-red" title="Deactivate" onClick={() => handleDelete(member.id, `${member.first_name} ${member.last_name}`)} style={{ background: '#FEF2F2', color: '#DC2626' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted" style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <Users size={48} color="#CBD5E1" />
                          No staff members found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Screen Access Permissions Modal */}
      {isPermissionModalOpen && selectedStaffForPermissions && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', width: '90%' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#ECFDF5', color: '#059669', padding: '0.6rem', borderRadius: '0.75rem' }}>
                  <Key size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A', fontWeight: 900 }}>Delegate Screen Access Permissions</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Select allowed pages/screens for <strong>{selectedStaffForPermissions.first_name} {selectedStaffForPermissions.last_name}</strong> ({selectedStaffForPermissions.designation || selectedStaffForPermissions.role})
                  </p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setIsPermissionModalOpen(false)}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.25rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
                  Allowed Screens: <span style={{ color: '#059669' }}>{allowedScreens.length}</span> of {ALL_MODULE_SCREENS.length} Selected
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleSelectAllScreens} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                    Select All
                  </button>
                  <button onClick={handleDeselectAllScreens} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Grid of Screen Checkboxes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {ALL_MODULE_SCREENS.map(screen => {
                  const isChecked = allowedScreens.includes(screen.path);
                  return (
                    <div 
                      key={screen.path}
                      onClick={() => toggleScreenPermission(screen.path)}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', 
                        borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.15s',
                        background: isChecked ? '#ECFDF5' : '#FFFFFF',
                        border: isChecked ? '2px solid #059669' : '1px solid #E2E8F0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{screen.icon}</span>
                        <div>
                          <span style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: isChecked ? '#065F46' : '#334155' }}>
                            {screen.title}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{screen.cat} • {screen.path}</span>
                        </div>
                      </div>
                      
                      {isChecked ? (
                        <CheckSquare size={20} color="#059669" />
                      ) : (
                        <Square size={20} color="#CBD5E1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsPermissionModalOpen(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleSavePermissions} disabled={saving} style={{ background: '#059669', padding: '0.75rem 1.75rem' }}>
                {saving ? 'Saving...' : 'Save Screen Permissions 💾'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      { (isAddModalOpen || isEditModalOpen) && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', width: '90%' }}>
            <div className="modal-header">
              <h2>{isEditModalOpen ? 'Edit Staff Profile' : 'Register New Staff'}</h2>
              <button className="icon-btn" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}><X size={20} /></button>
            </div>
            
            <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* Column 1: Personal Info */}
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personal Information</h3>
                  
                  <div className="form-group">
                    <label>First Name *</label>
                    <input type="text" name="firstName" className="input-field" value={formData.firstName} onChange={handleInputChange} required />
                  </div>
                  
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input type="text" name="lastName" className="input-field" value={formData.lastName} onChange={handleInputChange} required />
                  </div>
                  
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="email" className="input-field" value={formData.email} onChange={handleInputChange} required />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" name="phoneNumber" className="input-field" value={formData.phoneNumber} onChange={handleInputChange} />
                  </div>

                  {!isEditModalOpen && (
                    <div className="form-group">
                      <label>Login Password *</label>
                      <input type="password" name="password" className="input-field" placeholder="Temporary password" value={formData.password} onChange={handleInputChange} required={!isEditModalOpen} />
                    </div>
                  )}
                </div>

                {/* Column 2: Employment Details */}
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employment Details</h3>
                  
                  <div className="form-group">
                    <label>School Branch *</label>
                    <select 
                      name="school_id" 
                      className="input-field" 
                      value={formData.school_id} 
                      onChange={handleInputChange} 
                      required
                    >
                      <option value="">-- Select School Branch --</option>
                      {dbBranches.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>System Role *</label>
                    <select name="role" className="input-field" value={formData.role} onChange={handleInputChange} required>
                      <option value="teacher">Teacher (App Access)</option>
                      <option value="non_teaching_staff">Non-Teaching Staff</option>
                      <option value="school_admin">Principal / School Admin (Delegated Access)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <select name="department" className="input-field" value={formData.department} onChange={handleInputChange}>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Designation</label>
                    <input type="text" name="designation" className="input-field" placeholder="e.g. Principal / Senior Teacher" value={formData.designation} onChange={handleInputChange} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ margin: 0 }}>Employee ID *</label>
                      <button 
                        type="button" 
                        onClick={() => fetchNextEmpId(formData.school_id)}
                        style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4F46E5', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                        title="Auto-calculate next sequence ID for this branch"
                      >
                        ⚡ Auto-Generate
                      </button>
                    </div>
                    <input 
                      type="text" 
                      name="employee_id" 
                      className="input-field" 
                      placeholder="e.g. EMP-CHW-001" 
                      value={formData.employee_id} 
                      onChange={handleInputChange} 
                      required
                      style={{ fontWeight: 800, color: '#1E293B', letterSpacing: '0.5px' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '3px' }}>
                      🏷️ Branch Prefix: <strong>CHW</strong> (Chinchwad), <strong>CHK</strong> (Chikhali), <strong>DUD</strong> (Dudulgaon)
                    </span>
                  </div>

                  <div className="form-group">
                    <label>Base Salary (₹)</label>
                    <input type="number" name="base_salary" className="input-field" value={formData.base_salary} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn-secondary" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ background: '#4F46E5', padding: '0.8rem 2rem', fontSize: '1rem' }}>
                  {saving ? 'Saving...' : isEditModalOpen ? 'Update Profile' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;

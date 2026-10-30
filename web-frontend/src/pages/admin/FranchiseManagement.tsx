// EduNeev Franchise Management - Clean Verified
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Sidebar from '../../components/Sidebar';
import { ArrowLeft, Plus, CloudUpload, X, Building, Users, Shirt, BookOpen, PackageCheck, Send, CheckCircle2, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import './Directory.css';

const FranchiseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'royalty' | 'kits'>('overview');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.email === 'admin@edunive.com' || currentUser.role === 'owner';

  const userBranchName = (() => {
    if (currentUser?.branchName) return currentUser.branchName;
    if (currentUser?.school_name) return currentUser.school_name;
    const str = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''} ${currentUser?.email || ''}`.toLowerCase();
    if (str.includes('chikhali')) return 'Chikhali Branch';
    if (str.includes('dudulgaon')) return 'Dudulgaon Branch';
    return 'Chinchwad Branch';
  })();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isRoyaltyModalOpen, setIsRoyaltyModalOpen] = useState(false);
  const [selectedBranchForRoyalty, setSelectedBranchForRoyalty] = useState<any>(null);
  const [royaltyPercentageInput, setRoyaltyPercentageInput] = useState('10');

  const [saving, setSaving] = useState(false);
  const [inventoryStock, setInventoryStock] = useState<any[]>([]);
  const [branchInventory, setBranchInventory] = useState<any[]>([]);
  const [selectedBranchStockFilter, setSelectedBranchStockFilter] = useState(isSuperAdmin ? 'ALL' : userBranchName);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(isSuperAdmin ? 'ALL' : userBranchName);

  const [formData, setFormData] = useState({
    name: '', address: '', city: '', state: '', royalty_percentage: '10', brand_name: 'Preschool'
  });

  const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false);
  const [selectedBranchToEdit, setSelectedBranchToEdit] = useState<any>(null);
  const [editBranchForm, setEditBranchForm] = useState({
    name: '', address: '', city: '', state: '', royalty_percentage: '10', brand_name: 'Preschool'
  });

  const [pushForm, setPushForm] = useState({ type: 'Curriculum Update', payload: '' });

  // Branch Staff Management Modal States
  const [isBranchStaffModalOpen, setIsBranchStaffModalOpen] = useState(false);
  const [selectedBranchForStaff, setSelectedBranchForStaff] = useState<any>(null);
  const [branchStaffList, setBranchStaffList] = useState<any[]>([]);
  const [loadingBranchStaff, setLoadingBranchStaff] = useState(false);
  const [isQuickAddStaffOpen, setIsQuickAddStaffOpen] = useState(false);
  const [quickStaffForm, setQuickStaffForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'teacher',
    department: 'Teaching',
    designation: '',
    base_salary: '25000'
  });

  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [isInspectSizeManifestOpen, setIsInspectSizeManifestOpen] = useState(false);
  const [selectedSizeManifest, setSelectedSizeManifest] = useState<any>(null);

  const [demandForm, setDemandForm] = useState({
    branch_name: isSuperAdmin ? '' : userBranchName,
    item_type: 'School Uniform & Shoe Set',
    quantity: '',
    urgency: 'Normal',
    notes: '',
    size_22_s: '0',
    size_24_m: '0',
    size_26_l: '0',
    size_28_xl: '0',
    shoe_5: '0',
    shoe_6: '0',
    shoe_7: '0',
    shoe_8: '0',
    // Class-wise Book sets
    pg_books: '0',
    nursery_books: '0',
    jrkg_books: '0',
    srkg_books: '0',
    daycare_books: '0',
    student_list: []
  });

  const [dispatchForm, setDispatchForm] = useState({
    branch_name: '',
    item_type: 'School Uniform / Dress Code',
    uniform_size: 'Size 24 (Medium)',
    shoe_size: 'Size 6',
    book_class: 'Nursery Book Set',
    quantity: '10',
    status: 'Delivered ✅',
    notes: ''
  });

  const [isSubmitRoyaltyProofOpen, setIsSubmitRoyaltyProofOpen] = useState(false);
  const [isVerifyProofModalOpen, setIsVerifyProofModalOpen] = useState(false);
  const [selectedProofForVerify, setSelectedProofForVerify] = useState<any>(null);

  const [uploadProofForm, setUploadProofForm] = useState({
    branch_name: isSuperAdmin ? '' : userBranchName,
    month: '',
    amount_paid: '',
    payment_method: 'Online Transfer',
    ref_number: '',
    proof_url: ''
  });

  const [royaltyPayments, setRoyaltyPayments] = useState<any[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [historyBranchFilter, setHistoryBranchFilter] = useState('ALL');

  const [dispatchHistory, setDispatchHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [historyYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [branchRes, statsRes, royaltyRes, supplyRes, invRes, branchInvRes, revHistoryRes] = await Promise.all([
        apiClient.get('/franchise/branches').catch(() => ({ data: { data: [] } })),
        apiClient.get('/franchise/stats').catch(() => ({ data: { data: null } })),
        apiClient.get('/franchise/royalty').catch(() => ({ data: { data: [] } })),
        apiClient.get('/franchise/supplies').catch(() => ({ data: { data: [] } })),
        apiClient.get('/franchise/inventory').catch(() => ({ data: { data: [] } })),
        apiClient.get('/franchise/branch-inventory').catch(() => ({ data: { data: [] } })),
        apiClient.get('/franchise/revenue-history', { params: { year: historyYear } }).catch(() => ({ data: { data: [] } }))
      ]);
      const fetchedBranches = branchRes.data?.data || [];
      setBranches(fetchedBranches);
      setStats(statsRes.data?.data || null);
      if (royaltyRes.data?.data) {
        setRoyaltyPayments(royaltyRes.data.data);
      }
      if (revHistoryRes.data?.data) {
        setRevenueHistory(revHistoryRes.data.data);
      }
      if (supplyRes.data?.data) {
        setDispatchHistory(supplyRes.data.data);
      }
      if (invRes.data?.data) {
        setInventoryStock(invRes.data.data);
      }
      if (branchInvRes.data?.data) {
        setBranchInventory(branchInvRes.data.data);
      }
      if (fetchedBranches.length > 0) {
        setDemandForm(prev => prev.branch_name ? prev : { ...prev, branch_name: fetchedBranches[0].name });
        setDispatchForm(prev => prev.branch_name ? prev : { ...prev, branch_name: fetchedBranches[0].name });
        setUploadProofForm(prev => prev.branch_name ? prev : { ...prev, branch_name: fetchedBranches[0].name });
      }
    } catch (error) {
      console.error('Failed to fetch franchise data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/franchise/branches', formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', address: '', city: '', state: '', royalty_percentage: '10', brand_name: 'Preschool' });
      fetchData();
      alert('Branch created successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create branch');
    } finally {
      setSaving(false);
    }
  };

  const openEditBranchModal = (branch: any) => {
    setSelectedBranchToEdit(branch);
    setEditBranchForm({
      name: branch.name || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      royalty_percentage: branch.royalty_percentage ? String(branch.royalty_percentage) : '10',
      brand_name: branch.brand_name || 'Preschool'
    });
    setIsEditBranchModalOpen(true);
  };

  const handleEditBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchToEdit) return;
    setSaving(true);
    try {
      await apiClient.put(`/franchise/branches/${selectedBranchToEdit.id}`, editBranchForm);
      setIsEditBranchModalOpen(false);
      fetchData();
      alert(`Branch "${editBranchForm.name}" updated successfully!`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (branch: any) => {
    if (!window.confirm(`Are you sure you want to delete franchise branch "${branch.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiClient.delete(`/franchise/branches/${branch.id}`);
      alert(`Branch "${branch.name}" deleted successfully!`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete branch');
    }
  };

  const handlePushSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/franchise/global-push', pushForm);
      setIsPushModalOpen(false);
      setPushForm({ type: 'Curriculum Update', payload: '' });
      alert(`Successfully pushed ${pushForm.type} to all branches!`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to global push');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const branchObj = branches.find(b => b.name === dispatchForm.branch_name);
      
      const sizeBreakdown: any = {};
      let fullItemName = dispatchForm.item_type;

      if (dispatchForm.item_type.includes('Uniform') && dispatchForm.uniform_size !== 'All Assorted') {
        sizeBreakdown.uniforms = { [dispatchForm.uniform_size]: parseInt(dispatchForm.quantity) || 1 };
        fullItemName = `${dispatchForm.item_type} (${dispatchForm.uniform_size})`;
      } else if (dispatchForm.item_type.includes('Shoe') && dispatchForm.shoe_size !== 'All Assorted') {
        sizeBreakdown.shoes = { [dispatchForm.shoe_size]: parseInt(dispatchForm.quantity) || 1 };
        fullItemName = `${dispatchForm.item_type} (${dispatchForm.shoe_size})`;
      } else if (dispatchForm.item_type.includes('Book') || dispatchForm.item_type.includes('Kit') || dispatchForm.book_class) {
        fullItemName = `${dispatchForm.item_type} (${dispatchForm.book_class || 'Class Set'})`;
      }

      await apiClient.post('/franchise/supplies', {
        school_id: branchObj?.id,
        branch_name: dispatchForm.branch_name,
        item_name: fullItemName,
        quantity: parseInt(dispatchForm.quantity) || 1,
        urgency: 'Normal',
        status: dispatchForm.status || 'Delivered ✅',
        added_by: 'Admin',
        size_breakdown: sizeBreakdown,
        notes: dispatchForm.notes ? dispatchForm.notes : `Admin Direct Dispatch to ${dispatchForm.branch_name}`
      });

      await fetchData();
      setIsDispatchModalOpen(false);
      alert(`✅ Dispatched ${dispatchForm.quantity} x ${fullItemName} to ${dispatchForm.branch_name}!\nStatus: ${dispatchForm.status || 'Delivered ✅'}\nReal-time stock updated in Central Head Office & Branch.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record dispatch');
    } finally {
      setSaving(false);
    }
  };

  const exportRevenueHistoryCSV = () => {
    if (revenueHistory.length === 0) {
      alert('No franchise revenue records to export');
      return;
    }
    const filtered = revenueHistory.filter(r => 
      historyBranchFilter === 'ALL' || r.school_name === historyBranchFilter || r.school_id === historyBranchFilter
    );
    const headers = ['Period Month', 'Period Year', 'Branch Name', 'City', 'Total Revenue (INR)', 'Royalty Share %', 'Royalty Payable (INR)', 'Status', 'Payment Method', 'Reference / UTR'];
    const rows = filtered.map(r => [
      `"${r.month_name?.trim() || `Month ${r.period_month}`}"`,
      r.period_year,
      `"${r.school_name || 'Branch'}"`,
      `"${r.city || '-'}"`,
      r.total_revenue || 0,
      `${r.royalty_percentage || 10}%`,
      r.royalty_amount || 0,
      `"${r.status || 'PENDING'}"`,
      `"${r.payment_method || '-'}"`,
      `"${r.payment_reference || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.setAttribute('download', `EduNeev_Franchise_Revenue_History_${historyYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openBranchStaffModal = async (branch: any) => {
    setSelectedBranchForStaff(branch);
    setIsBranchStaffModalOpen(true);
    setIsQuickAddStaffOpen(false);
    setLoadingBranchStaff(true);
    try {
      const res = await apiClient.get('/hr/staff');
      const allStaff = res.data?.data || [];
      const filtered = allStaff.filter((s: any) => {
        return (
          s.school_id === branch.id ||
          (s.school_name && s.school_name.toLowerCase().includes(branch.name.toLowerCase())) ||
          (s.branch_name && s.branch_name.toLowerCase().includes(branch.name.toLowerCase()))
        );
      });
      setBranchStaffList(filtered);
    } catch (err) {
      console.error('Failed to load branch staff:', err);
    } finally {
      setLoadingBranchStaff(false);
    }
  };

  const handleQuickAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchForStaff) return;
    setSaving(true);
    try {
      const payload = {
        firstName: quickStaffForm.firstName,
        lastName: quickStaffForm.lastName,
        email: quickStaffForm.email,
        phoneNumber: quickStaffForm.phoneNumber,
        password: quickStaffForm.password || 'Staff@123',
        role: quickStaffForm.role,
        department: quickStaffForm.department,
        designation: quickStaffForm.designation || 'Teacher',
        school_id: selectedBranchForStaff.id
      };

      const res = await apiClient.post('/admin/staff', payload);
      const newUserId = res.data?.data?.id;

      try {
        await apiClient.post('/hr/staff/profile', {
          user_id: newUserId,
          school_id: selectedBranchForStaff.id,
          department: quickStaffForm.department,
          designation: quickStaffForm.designation || 'Teacher',
          base_salary: parseFloat(quickStaffForm.base_salary) || 25000
        });
      } catch (profileErr) {
        console.warn('Profile creation fallback', profileErr);
      }

      alert(`Staff member ${quickStaffForm.firstName} added to ${selectedBranchForStaff.name} successfully! ✅`);
      setQuickStaffForm({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'teacher',
        department: 'Teaching',
        designation: '',
        base_salary: '25000'
      });
      setIsQuickAddStaffOpen(false);
      await openBranchStaffModal(selectedBranchForStaff);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add staff member');
    } finally {
      setSaving(false);
    }
  };

  const displayBranches = branches.filter(b => {
    if (selectedBranchFilter === 'ALL') return true;
    return b.id === selectedBranchFilter || b.name === selectedBranchFilter || b.name.toLowerCase().includes(selectedBranchFilter.toLowerCase());
  });

  const displayRoyaltyPayments = royaltyPayments.filter(p => {
    if (selectedBranchFilter === 'ALL') return true;
    const name = p.school_name || p.branch_name || '';
    return name === selectedBranchFilter || name.toLowerCase().includes(selectedBranchFilter.toLowerCase());
  });

  const displayDispatchHistory = dispatchHistory.filter(h => {
    if (selectedBranchFilter === 'ALL') return true;
    const bName = h.branch || h.branch_name || '';
    return bName === selectedBranchFilter || bName.toLowerCase().includes(selectedBranchFilter.toLowerCase());
  });

  const totalStudents = displayBranches.reduce((acc, b) => acc + (parseInt(b.student_count) || 0), 0);
  const totalDressRequired = totalStudents * 2; // 2 Uniform sets per student
  const totalKitsRequired = totalStudents;     // 1 Admission Kit per student
  const totalBooksRequired = totalStudents;    // 1 Books & Bag set per student

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">{isSuperAdmin ? 'Franchise & Kit Distribution' : `Franchise Portal • ${userBranchName}`}</h1>
              <p className="date-text">{isSuperAdmin ? 'Track branch student counts, dress codes (uniforms), admission kits & supplies distribution' : 'Order Uniforms, Shoes, Books, Admission Kits & Track Royalty Share'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn-primary" 
              style={{ background: '#4F46E5', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }} 
              onClick={() => setIsDemandModalOpen(true)}
              title="Order Uniforms, Shoes, Books & Kits"
            >
              <PackageCheck size={18} /> 📦 Order Uniforms & Kits
            </button>

            {isSuperAdmin ? (
              <>
                <button className="btn-secondary" style={{ background: '#059669', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setIsDispatchModalOpen(true)}>
                  <Send size={18} /> Dispatch Items 📦
                </button>
                <button className="btn-secondary" style={{ background: '#10B981', color: 'white', border: 'none' }} onClick={() => setIsPushModalOpen(true)}>
                  <CloudUpload size={20} style={{ marginRight: '0.5rem' }} /> Global Push
                </button>
                <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
                  <Plus size={20} /> Add Branch
                </button>
              </>
            ) : (
              <button 
                className="btn-secondary" 
                style={{ background: '#059669', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }} 
                onClick={() => {
                  setActiveTab('royalty');
                  setIsSubmitRoyaltyProofOpen(true);
                }}
              >
                <CloudUpload size={18} /> 📤 Pay Royalty Proof
              </button>
            )}
          </div>
        </header>

        {/* Branch Filter Banner for Separate Franchise View */}
        <div style={{ background: '#F8FAFC', padding: '0.85rem 1.25rem', borderRadius: '1rem', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building size={22} color="#4F46E5" />
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Franchise Branch Selector</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                {selectedBranchFilter === 'ALL' ? '🌐 All Branches (Head Office Combined View)' : `📍 ${selectedBranchFilter}`}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>Filter Franchise:</label>
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              disabled={!isSuperAdmin}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '0.75rem',
                border: '2px solid #6366F1',
                fontWeight: 800,
                fontSize: '0.9rem',
                color: '#1E293B',
                background: 'white',
                cursor: isSuperAdmin ? 'pointer' : 'not-allowed',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)'
              }}
            >
              {isSuperAdmin && <option value="ALL">🌐 All Branches (Combined View)</option>}
              {branches
                .filter((b: any) => isSuperAdmin || b.name?.toLowerCase().includes(userBranchName.toLowerCase().replace(' branch', '')))
                .map(b => (
                  <option key={b.id} value={b.name}>📍 {b.name}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{ 
              background: 'none', border: 'none', padding: '0.6rem 1.2rem', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
              color: activeTab === 'overview' ? '#4F46E5' : '#64748B',
              borderBottom: activeTab === 'overview' ? '3px solid #4F46E5' : 'none',
              marginBottom: '-0.6rem'
            }}
          >
            🏢 Franchise Branches Overview
          </button>
          <button 
            onClick={() => setActiveTab('royalty')}
            style={{ 
              background: 'none', border: 'none', padding: '0.6rem 1.2rem', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
              color: activeTab === 'royalty' ? '#4F46E5' : '#64748B',
              borderBottom: activeTab === 'royalty' ? '3px solid #4F46E5' : 'none',
              marginBottom: '-0.6rem'
            }}
          >
            💰 Royalty & Revenue Management
          </button>
          <button 
            onClick={() => setActiveTab('kits')}
            style={{ 
              background: 'none', border: 'none', padding: '0.6rem 1.2rem', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
              color: activeTab === 'kits' ? '#4F46E5' : '#64748B',
              borderBottom: activeTab === 'kits' ? '3px solid #4F46E5' : 'none',
              marginBottom: '-0.6rem'
            }}
          >
            👗 Dress Code & Kit Distribution Tracker
          </button>
        </div>

        {/* Summary Metric Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#EFF6FF', padding: '0.85rem', borderRadius: '1rem', color: '#3B82F6' }}>
                <Building size={26} />
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Total Active Branches</p>
                <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 900 }}>{stats.total_branches || branches.length || 3}</h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#FEF2F2', padding: '0.85rem', borderRadius: '1rem', color: '#EF4444' }}>
                <Users size={26} />
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Total Enrolled Students</p>
                <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 900 }}>{totalStudents}</h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#FDF2F8', padding: '0.85rem', borderRadius: '1rem', color: '#EC4899' }}>
                <Shirt size={26} />
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Dress Code Sets Required</p>
                <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 900, color: '#EC4899' }}>{totalDressRequired} Sets</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>(2 Sets per Student)</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#FEF3C7', padding: '0.85rem', borderRadius: '1rem', color: '#D97706' }}>
                <BookOpen size={26} />
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Admission Kits Required</p>
                <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 900, color: '#D97706' }}>{totalKitsRequired} Kits</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>(1 Kit per Student)</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#ECFDF5', padding: '0.85rem', borderRadius: '1rem', color: '#059669' }}>
                <PackageCheck size={26} />
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Books & Bag Sets</p>
                <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 900, color: '#059669' }}>{totalBooksRequired} Sets</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>(1 Bag Set per Student)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="glass-card table-container">
            {loading ? (
              <div className="flex-center py-8">Loading branches...</div>
            ) : displayBranches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {displayBranches.map(branch => {
                  const isMainHQ = branch.name.includes('Chinchwad') || branch.is_main_branch;

                  return (
                    <div key={branch.id} style={{ border: isMainHQ ? '2px solid #F59E0B' : '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'white' }}>
                      <div className="flex-between">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>{branch.name}</h3>
                            {isMainHQ && (
                              <span style={{ background: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900, border: '1px solid #FCD34D', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                👑 Main HQ & Head Office
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>📍 {branch.city}, {branch.state}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ background: '#F5F3FF', color: '#8B5CF6', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.9rem' }}>
                            {isMainHQ ? 'Head Office HQ' : `${branch.royalty_percentage}% Royalty`}
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => openBranchStaffModal(branch)}
                              style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '0.45rem 0.75rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              title="Manage & Add Staff in this branch"
                            >
                              <Users size={14} /> Staff ({branch.teacher_count || 0})
                            </button>
                            {isSuperAdmin && (
                              <>
                                <button
                                  onClick={() => openEditBranchModal(branch)}
                                  style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '0.45rem 0.75rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                  title="Edit Branch Details"
                                >
                                  <Edit2 size={14} /> Edit
                                </button>
                                {!isMainHQ && (
                                  <button
                                    onClick={() => handleDeleteBranch(branch)}
                                    style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.45rem 0.75rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                    title="Delete Branch"
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Enrolled Students</p>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#2563EB' }}>🎓 {branch.student_count || 0} Students</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Dress Code Required</p>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#EC4899' }}>👗 {(parseInt(branch.student_count) || 0) * 2} Sets</p>
                        </div>
                        <div 
                          onClick={() => openBranchStaffModal(branch)}
                          style={{ cursor: 'pointer', background: '#F0FDF4', padding: '0.4rem 0.6rem', borderRadius: '0.6rem', border: '1px solid #BBF7D0' }}
                          title="Click to view & add staff for this branch"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>Staff / Teachers</p>
                            <span style={{ fontSize: '0.65rem', color: '#15803D', fontWeight: 700, textDecoration: 'underline' }}>Manage ↗</span>
                          </div>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>👩‍🏫 {branch.teacher_count || 0} Staff</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Monthly Rev</p>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#D97706' }}>₹{Number(branch.monthly_revenue || 0).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#F8FAFC', borderRadius: '1rem', border: '1px border #CBD5E1' }}>
                <Building size={32} color="#94A3B8" />
                <p style={{ margin: '0.5rem 0 0 0', fontWeight: 700, color: '#64748B' }}>No franchise branches match selected filter.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROYALTY & REVENUE MANAGEMENT */}
        {activeTab === 'royalty' && (
          <div className="glass-card" style={{ padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {isSuperAdmin ? 'SUPER ADMIN FINANCIAL SETTLEMENTS' : 'FRANCHISE BRANCH ROYALTY LEDGER'}
                </span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F172A', margin: '0.4rem 0 0 0' }}>Royalty & Franchise Revenue Share</h2>
              </div>
            </div>

            {!isSuperAdmin && (
              <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', border: '1px solid #C7D2FE', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    👑 Super Admin Franchise Agreement
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1E1B4B', margin: '0.2rem 0' }}>
                    Your Branch Royalty Share: <span style={{ color: '#4F46E5' }}>{displayBranches[0]?.royalty_percentage || 10}%</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                    This royalty percentage is set by Super Admin. Monthly royalty amount is calculated automatically from student fee collections.
                  </p>
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    const b = displayBranches[0];
                    const rev = b?.monthly_revenue ? parseFloat(b.monthly_revenue) : 0;
                    const pct = b?.royalty_percentage ? parseFloat(b.royalty_percentage) : 10;
                    const royaltyDue = Math.round((rev * pct) / 100);
                    setUploadProofForm(prev => ({
                      ...prev,
                      branch_name: b?.name || userBranchName,
                      amount_paid: royaltyDue.toString(),
                      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
                    }));
                    setIsSubmitRoyaltyProofOpen(true);
                  }}
                  style={{ background: '#4F46E5', padding: '0.6rem 1.25rem', fontSize: '0.9rem', fontWeight: 800 }}
                >
                  📤 Submit Royalty Payment Proof
                </button>
              </div>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Franchise Branch</th>
                  <th>Monthly Revenue (₹)</th>
                  <th>Royalty Share (%)</th>
                  <th>Royalty Amount Payable (₹)</th>
                  <th>Actions & Settlement</th>
                </tr>
              </thead>
              <tbody>
                {displayBranches.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                      No franchise branches match selected filter.
                    </td>
                  </tr>
                ) : (
                  displayBranches.map((b: any) => {
                    const rev = b.monthly_revenue !== undefined && b.monthly_revenue !== null ? parseFloat(b.monthly_revenue) : 0;
                    const pct = b.royalty_percentage !== undefined && b.royalty_percentage !== null ? parseFloat(b.royalty_percentage) : 10;
                    const royaltyDue = Math.round((rev * pct) / 100);

                    const handleMarkPaidLive = async () => {
                      try {
                        const currentMonth = new Date().getMonth() + 1;
                        const currentYear = new Date().getFullYear();
                        await apiClient.post('/franchise/royalty', {
                          school_id: b.id,
                          period_month: currentMonth,
                          period_year: currentYear,
                          total_revenue: rev,
                          payment_method: 'Direct Settlement',
                          payment_reference: `SETTLED-${Date.now()}`,
                          status: 'APPROVED'
                        });
                        alert(`Royalty settlement of ₹${royaltyDue.toLocaleString('en-IN')} for ${b.name} saved & marked as APPROVED ✅`);
                        fetchData();
                      } catch (err: any) {
                        alert(err.response?.data?.error || 'Failed to record settlement');
                      }
                    };

                    return (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '1rem' }}>📍 {b.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{b.city || b.address || 'Branch'}</div>
                        </td>
                        <td style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                          ₹ {rev.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '12px', fontWeight: 900 }}>
                            {pct}% Royalty
                          </span>
                        </td>
                        <td style={{ fontWeight: 900, color: '#4F46E5', fontSize: '1.15rem' }}>
                          ₹ {royaltyDue.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {isSuperAdmin ? (
                              <>
                                <button 
                                  className="btn-secondary" 
                                  onClick={() => {
                                    setSelectedBranchForRoyalty(b);
                                    setRoyaltyPercentageInput(pct.toString());
                                    setIsRoyaltyModalOpen(true);
                                  }}
                                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#F1F5F9', color: '#1E293B', fontWeight: 800 }}
                                >
                                  ✏️ Set Royalty %
                                </button>
                                <button 
                                  className="btn-primary"
                                  onClick={handleMarkPaidLive}
                                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#059669' }}
                                >
                                  Mark Paid ✅
                                </button>
                              </>
                            ) : (
                              <button 
                                className="btn-primary"
                                onClick={() => {
                                  setUploadProofForm(prev => ({
                                    ...prev,
                                    branch_name: b.name,
                                    amount_paid: royaltyDue.toString(),
                                    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
                                  }));
                                  setIsSubmitRoyaltyProofOpen(true);
                                }}
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#4F46E5', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              >
                                <CloudUpload size={14} /> Pay Royalty & Upload Proof
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Royalty Payment Submissions & Verification Proof Table */}
            <div style={{ marginTop: '2.5rem', borderTop: '2px dashed #E2E8F0', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1E293B', margin: 0 }}>
                    Royalty Payment Proofs & Approvals
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                    Uploaded UPI screenshots, NEFT receipts, and Cheque images submitted by Franchise Branches
                  </p>
                </div>
                <button 
                  className="btn-primary" 
                  onClick={() => setIsSubmitRoyaltyProofOpen(true)}
                  style={{ background: '#4F46E5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <CloudUpload size={16} /> Submit Royalty Proof 📤
                </button>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Month & Amount</th>
                    <th>Payment Method & Ref #</th>
                    <th>Uploaded Proof Image</th>
                    <th>Status</th>
                    {isSuperAdmin && <th>Admin Approval Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayRoyaltyPayments.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperAdmin ? 6 : 5} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>
                        No royalty records match selected franchise filter.
                      </td>
                    </tr>
                  ) : (
                    displayRoyaltyPayments.map((p) => {
                      const branchName = p.school_name || p.branch_name || 'Franchise Branch';
                      const monthStr = p.month_name || p.month || `Month ${p.period_month || 8}`;
                      const amountStr = p.royalty_amount || p.amount_due || 0;
                      const refStr = p.payment_reference || p.ref_number || 'Ref #N/A';
                      const methodStr = p.payment_method || 'Online Transfer';
                      
                      const statusUpper = String(p.status || '').toUpperCase();
                      const isApproved = statusUpper === 'APPROVED' || statusUpper === 'PAID';
                      const isRejected = statusUpper === 'REJECTED';
                      const isPending = statusUpper.includes('PENDING');

                      return (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>📍 {branchName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Ref: {p.id}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: '#4F46E5' }}>₹ {parseFloat(amountStr).toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{monthStr}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#1E293B' }}>{methodStr}</div>
                            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800 }}>{refStr}</div>
                          </td>
                          <td>
                            {p.proof_url ? (
                              <div 
                                onClick={() => { setSelectedProofForVerify(p); setIsVerifyProofModalOpen(true); }}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', width: 'fit-content' }}
                              >
                                <img src={p.proof_url} alt="Proof" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} />
                                <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 800, textDecoration: 'underline' }}>View Screenshot 🔍</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>No proof attached</span>
                            )}
                          </td>
                          <td>
                            <span style={{ 
                              background: isApproved ? '#DCFCE7' : isRejected ? '#FEE2E2' : '#FEF3C7',
                              color: isApproved ? '#166534' : isRejected ? '#991B1B' : '#92400E',
                              padding: '4px 10px', borderRadius: '12px', fontWeight: 900, fontSize: '0.75rem'
                            }}>
                              {isApproved ? 'APPROVED ✅' : isRejected ? 'REJECTED ❌' : 'PENDING APPROVAL ⏳'}
                            </span>
                          </td>
                          {isSuperAdmin && (
                            <td>
                              {isPending ? (
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await apiClient.put(`/franchise/royalty/${p.id}/pay`, { status: 'APPROVED' });
                                        alert(`Royalty Payment for ${branchName} has been APPROVED & AGREED by Admin! ✅`);
                                        fetchData();
                                      } catch (err: any) {
                                        alert(err.response?.data?.error || 'Failed to approve payment');
                                      }
                                    }}
                                    style={{ background: '#059669', color: 'white', border: 'none', padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                  >
                                    Agree & Approve ✅
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await apiClient.put(`/franchise/royalty/${p.id}/pay`, { status: 'REJECTED' });
                                        alert(`Royalty Payment for ${branchName} REJECTED. Branch notified to upload correct cheque/proof. ❌`);
                                        fetchData();
                                      } catch (err: any) {
                                        alert(err.response?.data?.error || 'Failed to reject payment');
                                      }
                                    }}
                                    style={{ background: '#EF4444', color: 'white', border: 'none', padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                  >
                                    Reject ❌
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => { setSelectedProofForVerify(p); setIsVerifyProofModalOpen(true); }}
                                  style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Inspect Proof 👁️
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Dedicated Franchise Revenue History Ledger */}
            <div style={{ marginTop: '2.5rem', borderTop: '2px solid #E2E8F0', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1E293B', margin: 0 }}>
                    📈 Franchise Revenue History & Settlements Ledger
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                    Historical month-by-month record of revenues collected and franchise royalty payouts
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <select 
                    className="input-field"
                    value={historyBranchFilter}
                    onChange={e => setHistoryBranchFilter(e.target.value)}
                    style={{ width: '160px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Branches</option>
                    {branches.map((b: any) => (
                      <option key={b.id || b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                  <select
                    className="input-field"
                    value={historyYear}
                    onChange={e => setHistoryYear(parseInt(e.target.value))}
                    style={{ width: '100px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                  <button
                    onClick={exportRevenueHistoryCSV}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.8rem', background: '#059669', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <CloudUpload size={14} /> Export CSV
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Period / Month</th>
                      <th>Branch & Location</th>
                      <th>Revenue Collected (₹)</th>
                      <th>Royalty Share (%)</th>
                      <th>Royalty Payable (₹)</th>
                      <th>Settlement Status</th>
                      <th>Payment Mode & UTR / Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueHistory
                      .filter(r => historyBranchFilter === 'ALL' || r.school_name === historyBranchFilter || r.school_id === historyBranchFilter)
                      .length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>
                          No revenue records found for {historyYear}.
                        </td>
                      </tr>
                    ) : (
                      revenueHistory
                        .filter(r => historyBranchFilter === 'ALL' || r.school_name === historyBranchFilter || r.school_id === historyBranchFilter)
                        .map((r, idx) => {
                          const rev = parseFloat(r.total_revenue || '0');
                          const royDue = parseFloat(r.royalty_amount || '0');
                          const isSettled = String(r.status || '').toUpperCase() === 'APPROVED' || String(r.status || '').toUpperCase() === 'PAID';
                          const isNil = rev === 0;

                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: 800, color: '#0F172A' }}>
                                📅 {r.month_name?.trim() || `Month ${r.period_month}`} {r.period_year}
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: '#1E293B' }}>📍 {r.school_name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{r.city || 'Pune'}</div>
                              </td>
                              <td style={{ fontWeight: 800, color: isNil ? '#94A3B8' : '#059669', fontSize: '0.95rem' }}>
                                ₹ {rev.toLocaleString('en-IN')}
                              </td>
                              <td>
                                <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                                  {r.royalty_percentage}%
                                </span>
                              </td>
                              <td style={{ fontWeight: 900, color: isNil ? '#94A3B8' : '#4F46E5', fontSize: '0.95rem' }}>
                                ₹ {royDue.toLocaleString('en-IN')}
                              </td>
                              <td>
                                <span style={{
                                  background: isSettled ? '#DCFCE7' : isNil ? '#F1F5F9' : '#FEF3C7',
                                  color: isSettled ? '#166534' : isNil ? '#64748B' : '#92400E',
                                  padding: '3px 8px',
                                  borderRadius: '10px',
                                  fontWeight: 800,
                                  fontSize: '0.75rem'
                                }}>
                                  {isSettled ? 'SETTLED ✅' : isNil ? 'NO REVENUE' : 'PENDING ⏳'}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 700 }}>{r.payment_method || '-'}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>{r.payment_reference || '-'}</div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DRESS CODE & KITS DISTRIBUTION TRACKER */}
        {activeTab === 'kits' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            
            {/* Detailed Branch Distribution Breakdown Table */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0, fontWeight: 900 }}>Branch-wise Dress Code & Supplies Required</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Shows items needed vs distributed across all EduNeev Kids branches</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setIsDemandModalOpen(true)} className="btn-primary" style={{ background: '#4F46E5', fontSize: '0.85rem' }}>
                    <PackageCheck size={16} /> Demand Supplies from Head Office 📦
                  </button>
                  {isSuperAdmin && (
                    <button onClick={() => setIsDispatchModalOpen(true)} className="btn-primary" style={{ background: '#059669', fontSize: '0.85rem' }}>
                      <Send size={16} /> Record Dispatch
                    </button>
                  )}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Branch Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Students Enrolled</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Dress Code (Req vs Given)</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Admission Kits (Req vs Given)</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Books & Bags (Req vs Given)</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Dispatch Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((b: any, i: number) => {
                      const studentCount = parseInt(b.student_count) || 0;
                      const bBranchInv = branchInventory.filter((bi: any) => bi.school_id === b.id || bi.branch_name === b.name);
                      const uniformGiven = bBranchInv.filter((bi: any) => bi.item_category === 'UNIFORM').reduce((acc: number, curr: any) => acc + (Number(curr.stock_quantity) || 0), 0);
                      const kitsGiven = bBranchInv.filter((bi: any) => bi.item_category === 'KITS').reduce((acc: number, curr: any) => acc + (Number(curr.stock_quantity) || 0), 0);
                      const booksGiven = bBranchInv.filter((bi: any) => bi.item_category === 'BOOKS').reduce((acc: number, curr: any) => acc + (Number(curr.stock_quantity) || 0), 0);

                      const dressReq = studentCount * 2;
                      const dressGiven = uniformGiven;
                      const dressPending = Math.max(0, dressReq - dressGiven);

                      const kitReq = studentCount;
                      const kitGiven = kitsGiven;
                      const kitPending = Math.max(0, kitReq - kitGiven);

                      const booksReq = studentCount;
                      const booksPending = Math.max(0, booksReq - booksGiven);

                      const isComplete = dressPending === 0 && kitPending === 0 && booksPending === 0;

                      return (
                        <tr key={b.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '1rem', fontWeight: 800, color: '#0F172A' }}>
                            📍 {b.name}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{b.city || 'Pune'}</span>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 900, color: '#2563EB' }}>
                            🎓 {studentCount} Students
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                                  Req: <strong>{dressReq}</strong> | In Stock: <strong>{dressGiven}</strong> Sets
                                </span>
                                {dressPending > 0 ? (
                                  <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                                    ⏳ {dressPending} Pending
                                  </span>
                                ) : (
                                  <span style={{ background: '#D1FAE5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                                    In Stock ✅
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                                  Req: <strong>{kitReq}</strong> | In Stock: <strong>{kitGiven}</strong> Kits
                                </span>
                                {kitPending > 0 ? (
                                  <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                                    ⏳ {kitPending} Pending
                                  </span>
                                ) : (
                                  <span style={{ background: '#D1FAE5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                                    In Stock ✅
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                                  Req: <strong>{booksReq}</strong> | In Stock: <strong>{booksGiven}</strong> Sets
                                </span>
                                {booksPending > 0 ? (
                                  <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                                    ⏳ {booksPending} Pending
                                  </span>
                                ) : (
                                  <span style={{ background: '#D1FAE5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                                    In Stock ✅
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {isComplete ? (
                              <span style={{ color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <CheckCircle2 size={16} /> Fully Stocked
                              </span>
                            ) : (
                              <span style={{ color: '#D97706', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <AlertCircle size={16} /> Dispatch Required
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Central Head Office Stock Inventory Matrix Card */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏭 Central Head Office Inventory Stock Matrix (Real-Time Subtraction)
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    When Head Office dispatches uniform or shoe orders, stock automatically subtracts (-) per size in real-time.
                  </p>
                </div>
                <span style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                  ⚡ Auto (-) Deduct Sync Active
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {inventoryStock.map((inv: any) => {
                  const avail = (inv.total_stock || 0) - (inv.dispatched_stock || 0);
                  return (
                    <div key={inv.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: inv.item_category === 'UNIFORM' ? '#4F46E5' : inv.item_category === 'SHOES' ? '#059669' : '#D97706', textTransform: 'uppercase' }}>
                          {inv.item_category}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: avail > 20 ? '#059669' : avail > 5 ? '#D97706' : '#DC2626' }}>
                          {avail > 20 ? 'In Stock 🟢' : avail > 5 ? 'Low Stock 🟡' : 'Refill Needed 🔴'}
                        </span>
                      </div>
                      <h4 style={{ margin: '0.3rem 0 0.5rem 0', fontSize: '1rem', color: '#0F172A', fontWeight: 800 }}>{inv.size_label}</h4>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', borderTop: '1px dashed #CBD5E1', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                        <span>Total Stock: <strong>{inv.total_stock}</strong></span>
                        <span style={{ color: '#DC2626' }}>Dispatched (-): <strong>{inv.dispatched_stock}</strong></span>
                      </div>
                      <div style={{ marginTop: '0.4rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: 900, color: '#0F172A' }}>
                        Net Stock: <span style={{ color: '#059669' }}>{avail}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Franchise Branches Stock Inventory Matrix Card */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏫 Franchise Branches Inventory Stock Matrix (Super Admin Branch Inspection)
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    Inspect exact uniform and shoe size quantities currently available locally at each franchise branch.
                  </p>
                </div>
                {isSuperAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>Filter Branch:</span>
                    <select
                      value={selectedBranchStockFilter}
                      onChange={(e) => setSelectedBranchStockFilter(e.target.value)}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', background: 'white' }}
                    >
                      <option value="ALL">All Franchise Branches 📍</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {branchInventory
                  .filter(b => selectedBranchStockFilter === 'ALL' || b.branch_name === selectedBranchStockFilter || b.school_name === selectedBranchStockFilter)
                  .map((b: any) => (
                    <div key={b.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#2563EB' }}>📍 {b.branch_name || b.school_name}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: b.item_category === 'UNIFORM' ? '#4F46E5' : '#059669' }}>{b.item_category}</span>
                      </div>
                      <h4 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '0.95rem', color: '#0F172A', fontWeight: 800 }}>{b.size_label}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px dashed #CBD5E1', paddingTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Local Available Stock:</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: b.stock_quantity > 10 ? '#059669' : b.stock_quantity > 3 ? '#D97706' : '#DC2626' }}>
                          {b.stock_quantity} {b.item_category === 'SHOES' ? 'Pairs' : 'Sets'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Admin Dispatch History Log */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0, fontWeight: 900 }}>Recent Dispatches & Supplies Sent</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>Live real-time feed of all demands and admin dispatches</p>
                </div>
                <button 
                  onClick={() => setIsDispatchModalOpen(true)}
                  className="btn-primary" 
                  style={{ background: '#059669', fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={15} /> + Record New Dispatch
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {displayDispatchHistory.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '42px', height: '42px', background: item.status?.includes('Delivered') ? '#DCFCE7' : '#EEF2FF', color: item.status?.includes('Delivered') ? '#166534' : '#4F46E5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PackageCheck size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0F172A', fontWeight: 800 }}>{item.item} ({item.qty} Qty)</h4>
                          {item.added_by && (
                            <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid #BFDBFE' }}>
                              ⚡ Added by {item.added_by}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                          Branch: <strong>{item.branch}</strong> • 
                          <span style={{ color: '#2563EB', fontWeight: 700, marginLeft: '0.35rem' }}>
                            🕒 {item.formatted_time || item.date}
                          </span>
                          {item.notes && <span style={{ display: 'block', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.2rem' }}>Note: {item.notes}</span>}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.size_breakdown && Object.keys(item.size_breakdown).length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedSizeManifest(item);
                            setIsInspectSizeManifestOpen(true);
                          }}
                          style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          📋 Inspect Size Manifest 🔍
                        </button>
                      )}
                      <span style={{ background: item.status.includes('Delivered') ? '#D1FAE5' : item.status.includes('DEMANDED') ? '#FEF3C7' : '#E0F2FE', color: item.status.includes('Delivered') ? '#059669' : item.status.includes('DEMANDED') ? '#D97706' : '#0284C7', padding: '4px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem' }}>
                        {item.status}
                      </span>
                      {item.status.includes('DEMANDED') && isSuperAdmin && (
                        <button 
                          onClick={async () => {
                            try {
                              await apiClient.put(`/franchise/supplies/${item.id}`, { status: 'Delivered ✅' });
                              alert(`Order ${item.item} (${item.qty} Qty) marked as Delivered ✅ to ${item.branch}! Real-time stock updated.`);
                              fetchData();
                            } catch (err: any) {
                              alert(err.response?.data?.error || 'Failed to update supply status');
                            }
                          }}
                          style={{ background: '#059669', color: 'white', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          Mark Delivered ✅
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Submit Royalty Payment Proof Modal */}
        {isSubmitRoyaltyProofOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2>Submit Royalty Payment Proof 📤</h2>
                <button className="icon-btn" onClick={() => setIsSubmitRoyaltyProofOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const targetBranch = branches.find((b: any) => b.name?.includes(uploadProofForm.branch_name) || uploadProofForm.branch_name?.includes(b.name)) || branches[0];
                  await apiClient.post('/franchise/royalty', {
                    school_id: targetBranch?.id,
                    period_month: new Date().getMonth() + 1,
                    period_year: new Date().getFullYear(),
                    total_revenue: uploadProofForm.amount_paid,
                    payment_method: uploadProofForm.payment_method,
                    payment_reference: uploadProofForm.ref_number || 'UPI Ref #98712399',
                    proof_url: uploadProofForm.proof_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
                  });
                  setIsSubmitRoyaltyProofOpen(false);
                  fetchData();
                  alert(`Royalty Payment Proof for ${uploadProofForm.branch_name} submitted successfully to Database! Awaiting Admin Approval. ⏳`);
                } catch (err: any) {
                  alert(err.response?.data?.error || 'Failed to submit royalty proof');
                }
              }} className="modal-form">
                <div className="form-group">
                  <label>Franchise Branch</label>
                  <select 
                    className="input-field" 
                    value={uploadProofForm.branch_name}
                    onChange={e => setUploadProofForm({ ...uploadProofForm, branch_name: e.target.value })}
                    disabled={!isSuperAdmin}
                  >
                    {isSuperAdmin ? (
                      branches.map(b => (
                        <option key={b.id || b.name} value={b.name}>{b.name} ({b.city || b.address || 'Branch'})</option>
                      ))
                    ) : (
                      <option value={userBranchName}>{userBranchName}</option>
                    )}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Amount Paid (₹) <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="number"
                      required
                      className="input-field"
                      value={uploadProofForm.amount_paid}
                      onChange={e => setUploadProofForm({ ...uploadProofForm, amount_paid: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select 
                      className="input-field"
                      value={uploadProofForm.payment_method}
                      onChange={e => setUploadProofForm({ ...uploadProofForm, payment_method: e.target.value })}
                    >
                      <option value="UPI / Online Transfer">UPI / GPay / PhonePe</option>
                      <option value="Cheque / Bank Draft">Cheque / Demand Draft</option>
                      <option value="Direct NEFT / RTGS">Direct NEFT / RTGS</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Transaction Ref / Cheque No. <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. UPI Ref #9872124501 or Cheque #004182"
                    value={uploadProofForm.ref_number}
                    onChange={e => setUploadProofForm({ ...uploadProofForm, ref_number: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Upload Payment Proof / Cheque Photo URL <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="text"
                    required
                    className="input-field"
                    placeholder="Paste image link or upload screenshot URL..."
                    value={uploadProofForm.proof_url}
                    onChange={e => setUploadProofForm({ ...uploadProofForm, proof_url: e.target.value })}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>e.g. UPI payment screenshot or cheque image for Admin inspection</span>
                </div>

                <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsSubmitRoyaltyProofOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: '#4F46E5' }}>Submit Proof 📤</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inspect & Verify Proof Modal */}
        {isVerifyProofModalOpen && selectedProofForVerify && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '580px', background: 'white' }}>
              <div className="modal-header">
                <h2>Inspect Payment Proof & Cheque 👁️</h2>
                <button className="icon-btn" onClick={() => setIsVerifyProofModalOpen(false)}><X size={20} /></button>
              </div>

              <div style={{ padding: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #E2E8F0' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>FRANCHISE BRANCH</span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: '#0F172A', fontWeight: 900 }}>📍 {selectedProofForVerify.branch_name}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#4F46E5', fontWeight: 700 }}>{selectedProofForVerify.payment_method} • {selectedProofForVerify.ref_number}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>ROYALTY AMOUNT</span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.3rem', color: '#059669', fontWeight: 900 }}>₹ {selectedProofForVerify.amount_due?.toLocaleString()}</h3>
                  </div>
                </div>

                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '0.5rem', background: '#F1F5F9', textAlign: 'center', marginBottom: '1.25rem' }}>
                  <img 
                    src={selectedProofForVerify.proof_url} 
                    alt="Royalty Proof" 
                    style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px', objectFit: 'contain' }} 
                  />
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Proof Image / Cheque Photo attached by Branch</p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setRoyaltyPayments(prev => prev.map(item => item.id === selectedProofForVerify.id ? { ...item, status: 'REJECTED' } : item));
                      setIsVerifyProofModalOpen(false);
                      alert(`Payment proof rejected. Branch notified to re-upload.`);
                    }}
                    style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}
                  >
                    Reject Payment Proof ❌
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={() => {
                      setRoyaltyPayments(prev => prev.map(item => item.id === selectedProofForVerify.id ? { ...item, status: 'APPROVED' } : item));
                      setIsVerifyProofModalOpen(false);
                      alert(`Royalty Payment ${selectedProofForVerify.id} for ${selectedProofForVerify.branch_name} has been APPROVED & AGREED by Admin! ✅`);
                    }}
                    style={{ background: '#059669' }}
                  >
                    Agree & Approve Royalty ✅
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Record Dispatch Modal */}
        {isDispatchModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={22} color="#059669" />
                  <h2>Record Dispatch to Branch</h2>
                </div>
                <button className="icon-btn" onClick={() => setIsDispatchModalOpen(false)}><X size={20} /></button>
              </div>

              <form onSubmit={handleDispatchSubmit} className="modal-form">
                <div style={{ background: '#ECFDF5', padding: '0.65rem 0.9rem', borderRadius: '0.6rem', border: '1px solid #A7F3D0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <span style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 800 }}>
                    ⚡ Real-Time Sync: Central Stock will auto-subtract and Branch Stock will be credited in real time.
                  </span>
                </div>

                <div className="form-group">
                  <label>Select Branch Center <span style={{ color: 'red' }}>*</span></label>
                  <select 
                    className="input-field"
                    value={dispatchForm.branch_name}
                    onChange={e => setDispatchForm({ ...dispatchForm, branch_name: e.target.value })}
                  >
                    {branches.map(b => (
                      <option key={b.id || b.name} value={b.name}>{b.name} ({b.city || b.address || 'Branch'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Supply / Item Type <span style={{ color: 'red' }}>*</span></label>
                  <select 
                    className="input-field"
                    value={dispatchForm.item_type}
                    onChange={e => setDispatchForm({ ...dispatchForm, item_type: e.target.value })}
                  >
                    <option value="School Uniform / Dress Code">School Uniform / Dress Code 👗</option>
                    <option value="School Shoes & Footwear">School Shoes & Footwear 👟</option>
                    <option value="Admission Welcome Kit">Admission Welcome Kit 🎒</option>
                    <option value="Books & Stationery Set">Books & Stationery Set 📚</option>
                    <option value="Student ID Card & Lanyard">Student ID Card & Lanyard 🪪</option>
                  </select>
                </div>

                {/* Conditional Size Selector */}
                {dispatchForm.item_type.includes('Uniform') && (
                  <div className="form-group">
                    <label>Uniform Size Specification</label>
                    <select
                      className="input-field"
                      value={dispatchForm.uniform_size}
                      onChange={e => setDispatchForm({ ...dispatchForm, uniform_size: e.target.value })}
                    >
                      <option value="Size 22 (Small)">Size 22 (Small)</option>
                      <option value="Size 24 (Medium)">Size 24 (Medium)</option>
                      <option value="Size 26 (Large)">Size 26 (Large)</option>
                      <option value="Size 28 (XL)">Size 28 (XL)</option>
                      <option value="All Assorted">All Assorted Sizes</option>
                    </select>
                  </div>
                )}

                {dispatchForm.item_type.includes('Shoe') && (
                  <div className="form-group">
                    <label>Shoe Size Specification</label>
                    <select
                      className="input-field"
                      value={dispatchForm.shoe_size}
                      onChange={e => setDispatchForm({ ...dispatchForm, shoe_size: e.target.value })}
                    >
                      <option value="Size 5">Size 5</option>
                      <option value="Size 6">Size 6</option>
                      <option value="Size 7">Size 7</option>
                      <option value="Size 8">Size 8</option>
                      <option value="All Assorted">All Assorted Sizes</option>
                    </select>
                  </div>
                )}

                {(dispatchForm.item_type.includes('Book') || dispatchForm.item_type.includes('Stationery')) && (
                  <div className="form-group">
                    <label>Book Class / Grade Specification</label>
                    <select
                      className="input-field"
                      value={dispatchForm.book_class}
                      onChange={e => setDispatchForm({ ...dispatchForm, book_class: e.target.value })}
                    >
                      <option value="Playgroup Book Set">Playgroup Book Set (Level 1)</option>
                      <option value="Nursery Book Set">Nursery Book Set (Level 2)</option>
                      <option value="Jr KG Book Set">Jr KG Book Set (Level 3)</option>
                      <option value="Sr KG Book Set">Sr KG Book Set (Level 4)</option>
                      <option value="Daycare Activity Books">Daycare Activity Books</option>
                      <option value="All Classes Assorted">All Classes Assorted</option>
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Quantity to Dispatch <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      className="input-field"
                      value={dispatchForm.quantity}
                      onChange={e => setDispatchForm({ ...dispatchForm, quantity: e.target.value })}
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div className="form-group">
                    <label>Dispatch Status</label>
                    <select
                      className="input-field"
                      value={dispatchForm.status}
                      onChange={e => setDispatchForm({ ...dispatchForm, status: e.target.value })}
                    >
                      <option value="Delivered ✅">Delivered ✅ (Instant Deliver)</option>
                      <option value="Dispatched 🚚">Dispatched 🚚 (In Dispatch)</option>
                      <option value="In Transit 🚚">In Transit 🚚</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Dispatch Notes</label>
                  <input 
                    type="text"
                    className="input-field"
                    value={dispatchForm.notes}
                    onChange={e => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
                    placeholder="e.g. Admin direct batch dispatch, courier #..."
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsDispatchModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#059669' }}>
                    {saving ? 'Processing...' : 'Confirm Real-Time Dispatch 📦'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Royalty % Modal */}
        {isRoyaltyModalOpen && selectedBranchForRoyalty && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '420px' }}>
              <div className="modal-header">
                <h2>Configure Branch Royalty</h2>
                <button className="icon-btn" onClick={() => setIsRoyaltyModalOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiClient.put(`/franchise/branches/${selectedBranchForRoyalty.id}`, {
                    royalty_percentage: parseFloat(royaltyPercentageInput)
                  });
                  alert(`Royalty for ${selectedBranchForRoyalty.name} updated to ${royaltyPercentageInput}%!`);
                  setIsRoyaltyModalOpen(false);
                  fetchData();
                } catch (err: any) {
                  alert(err.response?.data?.error || 'Failed to update royalty percentage');
                }
              }} className="modal-form">
                <div style={{ background: '#EEF2FF', padding: '0.85rem 1rem', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid #C7D2FE' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#4338CA', fontWeight: 800 }}>BRANCH NAME</p>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: '#1E1B4B', fontWeight: 900 }}>{selectedBranchForRoyalty.name}</p>
                </div>

                <div className="form-group">
                  <label>Royalty Share Percentage (%) <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    className="input-field"
                    style={{ fontSize: '1.2rem', fontWeight: 900, padding: '0.6rem' }}
                    value={royaltyPercentageInput}
                    onChange={e => setRoyaltyPercentageInput(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsRoyaltyModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: '#4F46E5' }}>Save Royalty %</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Branch Modal */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Add Franchise Branch</h2>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddSubmit} className="modal-form">
                <div className="form-group">
                  <label>Branch Name</label>
                  <input type="text" name="name" className="input-field" value={formData.name} onChange={handleInputChange} placeholder="e.g. Sunshine Preschool Center" required />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input type="text" name="address" className="input-field" value={formData.address} onChange={handleInputChange} placeholder="e.g. Main Street, Sector 4" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" name="city" className="input-field" value={formData.city} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" name="state" className="input-field" value={formData.state} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Royalty Percentage (%)</label>
                  <input type="number" name="royalty_percentage" className="input-field" value={formData.royalty_percentage} onChange={handleInputChange} required min="0" max="100" />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Branch'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Push Modal */}
        {isPushModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CloudUpload size={24} color="#10B981" />
                  <h2>Global Push</h2>
                </div>
                <button className="icon-btn" onClick={() => setIsPushModalOpen(false)}><X size={20} /></button>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Push Curriculum, SOPs, or Announcements to ALL franchise branches simultaneously.
              </p>
              <form onSubmit={handlePushSubmit} className="modal-form">
                <div className="form-group">
                  <label>Push Type</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {['Curriculum Update', 'SOP Notice', 'Timetable Sync'].map(t => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setPushForm({ ...pushForm, type: t })}
                        style={{
                          flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                          background: pushForm.type === t ? '#10B981' : '#F1F5F9',
                          color: pushForm.type === t ? 'white' : 'var(--text-muted)'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Content / Payload Link</label>
                  <textarea className="input-field" rows={4} placeholder="Enter message or link to PDF..." value={pushForm.payload} onChange={(e) => setPushForm({ ...pushForm, payload: e.target.value })} required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsPushModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: '#10B981' }} disabled={saving}>{saving ? 'Pushing...' : 'Push to All Branches'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Demand Supplies / Request Stock Modal */}
        {isDemandModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '580px' }}>
              <div className="modal-header">
                <h2>Demand Supplies from Head Office 📦</h2>
                <button className="icon-btn" onClick={() => setIsDemandModalOpen(false)}><X size={20} /></button>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>
                Request Dress Codes (Uniforms), Shoes, Books & Bags, or Admission Kits from Super Admin with exact student size breakdown.
              </p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const totalUniforms = (parseInt(demandForm.size_22_s) || 0) + (parseInt(demandForm.size_24_m) || 0) + (parseInt(demandForm.size_26_l) || 0) + (parseInt(demandForm.size_28_xl) || 0);
                  const totalShoes = (parseInt(demandForm.shoe_5) || 0) + (parseInt(demandForm.shoe_6) || 0) + (parseInt(demandForm.shoe_7) || 0) + (parseInt(demandForm.shoe_8) || 0);
                  const totalBooks = (parseInt(demandForm.pg_books) || 0) + (parseInt(demandForm.nursery_books) || 0) + (parseInt(demandForm.jrkg_books) || 0) + (parseInt(demandForm.srkg_books) || 0) + (parseInt(demandForm.daycare_books) || 0);
                  const finalQty = Math.max(parseInt(demandForm.quantity) || 1, totalUniforms || totalShoes || totalBooks || 1);
                  const targetBranch = branches.find((b: any) => b.name?.includes(demandForm.branch_name) || demandForm.branch_name?.includes(b.name)) || branches[0];

                  await apiClient.post('/franchise/supplies', {
                    school_id: targetBranch?.id,
                    branch_name: demandForm.branch_name,
                    item_name: `${demandForm.item_type} (${demandForm.urgency})`,
                    quantity: finalQty,
                    urgency: demandForm.urgency,
                    notes: demandForm.notes || 'Student size and class matrix breakdown attached',
                    size_breakdown: {
                      uniforms: {
                        'Size 22 (Small)': parseInt(demandForm.size_22_s) || 0,
                        'Size 24 (Medium)': parseInt(demandForm.size_24_m) || 0,
                        'Size 26 (Large)': parseInt(demandForm.size_26_l) || 0,
                        'Size 28 (XL)': parseInt(demandForm.size_28_xl) || 0,
                      },
                      shoes: {
                        'Size 5': parseInt(demandForm.shoe_5) || 0,
                        'Size 6': parseInt(demandForm.shoe_6) || 0,
                        'Size 7': parseInt(demandForm.shoe_7) || 0,
                        'Size 8': parseInt(demandForm.shoe_8) || 0,
                      },
                      books: {
                        'Playgroup': parseInt(demandForm.pg_books) || 0,
                        'Nursery': parseInt(demandForm.nursery_books) || 0,
                        'Jr KG': parseInt(demandForm.jrkg_books) || 0,
                        'Sr KG': parseInt(demandForm.srkg_books) || 0,
                        'Daycare': parseInt(demandForm.daycare_books) || 0,
                      }
                    },
                    student_list: demandForm.student_list
                  });

                  setIsDemandModalOpen(false);
                  fetchData();
                  alert(`Supply Demand for ${finalQty} x ${demandForm.item_type} with Student Size Matrix submitted to Database! 📦`);
                } catch (err: any) {
                  alert(err.response?.data?.error || 'Failed to submit supply demand');
                }
              }} className="modal-form">
                <div className="form-group">
                  <label>Franchise Branch <span style={{ color: 'red' }}>*</span></label>
                  <select 
                    className="input-field"
                    value={demandForm.branch_name}
                    onChange={e => setDemandForm({ ...demandForm, branch_name: e.target.value })}
                    disabled={!isSuperAdmin}
                  >
                    {branches
                      .filter((b: any) => isSuperAdmin || b.name?.toLowerCase().includes(userBranchName.toLowerCase().replace(' branch', '')))
                      .map((b: any) => (
                        <option key={b.id || b.name} value={b.name}>{b.name}</option>
                      ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Supply / Item Type <span style={{ color: 'red' }}>*</span></label>
                    <select 
                      className="input-field"
                      value={demandForm.item_type}
                      onChange={e => setDemandForm({ ...demandForm, item_type: e.target.value })}
                    >
                      <option value="School Uniform & Shoe Set">👔👟 School Uniform & Shoe Set</option>
                      <option value="School Shoes & Socks">👟 School Shoes & Socks</option>
                      <option value="School Uniform / Dress Code">👔 School Uniform / Dress Code</option>
                      <option value="Books & Bag Set">📚 Books, Bags & Stationary Set</option>
                      <option value="Admission Welcome Kit">🎒 Admission Welcome Kit</option>
                      <option value="ID Cards & Lanyards">🪪 Student ID Cards & Lanyards</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Total Quantity <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="number"
                      required
                      min="1"
                      className="input-field"
                      value={demandForm.quantity}
                      onChange={e => setDemandForm({ ...demandForm, quantity: e.target.value })}
                    />
                  </div>
                </div>

                {/* Student Dress & Shoe Size Breakdown Grid */}
                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#1E293B', fontWeight: 800 }}>
                    👕 Student Uniform Size Matrix Breakdown
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Size 22 (S)</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.size_22_s} onChange={e => setDemandForm({ ...demandForm, size_22_s: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Size 24 (M)</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.size_24_m} onChange={e => setDemandForm({ ...demandForm, size_24_m: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Size 26 (L)</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.size_26_l} onChange={e => setDemandForm({ ...demandForm, size_26_l: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Size 28 (XL)</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.size_28_xl} onChange={e => setDemandForm({ ...demandForm, size_28_xl: e.target.value })} />
                    </div>
                  </div>

                  <h4 style={{ margin: '0.75rem 0 0.5rem 0', fontSize: '0.85rem', color: '#1E293B', fontWeight: 800 }}>
                    👟 Student Shoe Size Matrix Breakdown
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Shoe Size 5</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.shoe_5} onChange={e => setDemandForm({ ...demandForm, shoe_5: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Shoe Size 6</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.shoe_6} onChange={e => setDemandForm({ ...demandForm, shoe_6: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Shoe Size 7</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.shoe_7} onChange={e => setDemandForm({ ...demandForm, shoe_7: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Shoe Size 8</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.shoe_8} onChange={e => setDemandForm({ ...demandForm, shoe_8: e.target.value })} />
                    </div>
                  </div>

                  <h4 style={{ margin: '0.75rem 0 0.5rem 0', fontSize: '0.85rem', color: '#1E293B', fontWeight: 800 }}>
                    📚 Books by Class Matrix Breakdown (Book Sets Required per Class)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Playgroup</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.pg_books} onChange={e => setDemandForm({ ...demandForm, pg_books: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Nursery</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.nursery_books} onChange={e => setDemandForm({ ...demandForm, nursery_books: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Jr KG</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.jrkg_books} onChange={e => setDemandForm({ ...demandForm, jrkg_books: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Sr KG</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.srkg_books} onChange={e => setDemandForm({ ...demandForm, srkg_books: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Daycare</label>
                      <input type="number" min="0" className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={demandForm.daycare_books} onChange={e => setDemandForm({ ...demandForm, daycare_books: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Urgency Level</label>
                  <select 
                    className="input-field"
                    value={demandForm.urgency}
                    onChange={e => setDemandForm({ ...demandForm, urgency: e.target.value })}
                  >
                    <option value="Normal">Normal Request</option>
                    <option value="Urgent (New Admissions)">🚨 Urgent (New Admissions Batch)</option>
                    <option value="Emergency Stock Out">🔥 Emergency Stock Out</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes / Specification Details</label>
                  <textarea 
                    className="input-field"
                    rows={2}
                    placeholder="e.g. Junior KG new batch admission sizes attached..."
                    value={demandForm.notes}
                    onChange={e => setDemandForm({ ...demandForm, notes: e.target.value })}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsDemandModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: '#4F46E5' }}>Submit Demand & Size Matrix 📦</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inspect Student Size Manifest Modal */}
        {isInspectSizeManifestOpen && selectedSizeManifest && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '580px', background: 'white' }}>
              <div className="modal-header">
                <h2>Student Size Manifest & Order Report 📋</h2>
                <button className="icon-btn" onClick={() => setIsInspectSizeManifestOpen(false)}><X size={20} /></button>
              </div>

              <div style={{ padding: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #E2E8F0' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>DEMANDING BRANCH</span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: '#0F172A', fontWeight: 900 }}>📍 {selectedSizeManifest.branch}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#4F46E5', fontWeight: 700 }}>Requested: {selectedSizeManifest.item}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>TOTAL QUANTITY</span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.3rem', color: '#059669', fontWeight: 900 }}>{selectedSizeManifest.qty} Sets</h3>
                  </div>
                </div>

                {selectedSizeManifest.notes && (
                  <div style={{ background: '#FEF3C7', borderLeft: '4px solid #F59E0B', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', color: '#92400E', fontWeight: 700, marginBottom: '1rem' }}>
                    📝 Note: {selectedSizeManifest.notes}
                  </div>
                )}

                {/* Uniform Sizes Table */}
                {selectedSizeManifest.size_breakdown?.uniforms && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#0F172A', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      👕 Uniform Size Breakdown Manifest
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Uniform Size</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Quantity Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedSizeManifest.size_breakdown.uniforms).map(([sz, qty]) => (
                          <tr key={sz} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 700, color: '#334155' }}>{sz}</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 900, color: '#4F46E5' }}>{qty as number} Sets</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Shoe Sizes Table */}
                {selectedSizeManifest.size_breakdown?.shoes && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#0F172A', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      👟 Shoe Size Breakdown Manifest
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Shoe Size</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Quantity Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedSizeManifest.size_breakdown.shoes).map(([sz, qty]) => (
                          <tr key={sz} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 700, color: '#334155' }}>{sz}</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 900, color: '#059669' }}>{qty as number} Pairs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Student-by-Student Roster Measurement List */}
                {selectedSizeManifest.student_list && selectedSizeManifest.student_list.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#0F172A', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      👦👧 Individual Student-by-Student Measurement Roster ({selectedSizeManifest.student_list.length} Students)
                    </h4>
                    <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #CBD5E1', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#EEF2FF', color: '#3730A3', zIndex: 1 }}>
                          <tr>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Student Name</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Class</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Uniform Size</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Shoe Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSizeManifest.student_list.map((st: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                              <td style={{ padding: '0.45rem 0.75rem', fontWeight: 800, color: '#0F172A' }}>
                                👤 {st.student_name}
                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748B' }}>Roll #{st.roll_no}</span>
                              </td>
                              <td style={{ padding: '0.45rem 0.75rem', fontWeight: 700, color: '#2563EB' }}>{st.class_name}</td>
                              <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', fontWeight: 900, color: '#4F46E5' }}>{st.uniform_size}</td>
                              <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', fontWeight: 900, color: '#059669' }}>{st.shoe_size}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsInspectSizeManifestOpen(false)}>Close</button>
                {selectedSizeManifest.status?.includes('DEMANDED') && isSuperAdmin && (
                  <button 
                    onClick={() => {
                      setDispatchHistory(prev => prev.map(d => d.id === selectedSizeManifest.id ? { ...d, status: 'Dispatched ✅' } : d));
                      setIsInspectSizeManifestOpen(false);
                      alert(`Stock Manifest for ${selectedSizeManifest.branch} APPROVED & DISPATCHED! 🚚`);
                    }}
                    className="btn-primary" 
                    style={{ background: '#059669' }}
                  >
                    Approve Order & Dispatch Stock 🚚
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* EDIT FRANCHISE BRANCH MODAL */}
        {isEditBranchModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  ✏️ Edit Franchise Branch
                </h2>
                <button onClick={() => setIsEditBranchModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditBranchSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                      Branch Center Name *
                    </label>
                    <input 
                      type="text" 
                      value={editBranchForm.name}
                      onChange={(e) => setEditBranchForm({ ...editBranchForm, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                        City / Location
                      </label>
                      <input 
                        type="text" 
                        value={editBranchForm.city}
                        onChange={(e) => setEditBranchForm({ ...editBranchForm, city: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                        Royalty Share (%)
                      </label>
                      <input 
                        type="number" 
                        value={editBranchForm.royalty_percentage}
                        onChange={(e) => setEditBranchForm({ ...editBranchForm, royalty_percentage: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                      Address / Location Area
                    </label>
                    <input 
                      type="text" 
                      value={editBranchForm.address}
                      onChange={(e) => setEditBranchForm({ ...editBranchForm, address: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setIsEditBranchModalOpen(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="btn-primary"
                      style={{ background: '#2563EB' }}
                    >
                      {saving ? 'Saving...' : 'Save Changes ✅'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* BRANCH STAFF MANAGEMENT MODAL */}
        {isBranchStaffModalOpen && selectedBranchForStaff && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '1.25rem', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0' }}>
              
              {/* Modal Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', borderTopLeftRadius: '1.25rem', borderTopRightRadius: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#DCFCE7', color: '#166534', padding: '0.6rem', borderRadius: '0.75rem' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>
                      {selectedBranchForStaff.name} — Staff & Teachers
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                      Manage staff members and teachers registered directly to this branch
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.85rem', padding: '0.35rem 0.75rem', borderRadius: '1rem', border: '1px solid #BBF7D0' }}>
                    {branchStaffList.length} Staff Members
                  </span>
                  <button 
                    onClick={() => setIsBranchStaffModalOpen(false)}
                    style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '1.5rem' }}>
                
                {/* Top Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>
                    Branch Staff Directory
                  </p>
                  <button
                    onClick={() => setIsQuickAddStaffOpen(!isQuickAddStaffOpen)}
                    style={{
                      background: isQuickAddStaffOpen ? '#F1F5F9' : '#059669',
                      color: isQuickAddStaffOpen ? '#475569' : 'white',
                      border: 'none',
                      padding: '0.55rem 1rem',
                      borderRadius: '0.75rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    {isQuickAddStaffOpen ? <X size={16} /> : <Plus size={16} />}
                    {isQuickAddStaffOpen ? 'Cancel' : `+ Add New Staff to ${selectedBranchForStaff.name}`}
                  </button>
                </div>

                {/* Inline Add Staff Form */}
                {isQuickAddStaffOpen && (
                  <form onSubmit={handleQuickAddStaffSubmit} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <CheckCircle2 size={18} color="#059669" />
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#065F46' }}>
                        Register New Staff Member to {selectedBranchForStaff.name}
                      </h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '0.3rem' }}>First Name *</label>
                        <input
                          type="text"
                          required
                          value={quickStaffForm.firstName}
                          onChange={(e) => setQuickStaffForm({ ...quickStaffForm, firstName: e.target.value })}
                          placeholder="e.g. Priya"
                          style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #86EFAC', fontSize: '0.85rem', fontWeight: 600 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '0.3rem' }}>Last Name *</label>
                        <input
                          type="text"
                          required
                          value={quickStaffForm.lastName}
                          onChange={(e) => setQuickStaffForm({ ...quickStaffForm, lastName: e.target.value })}
                          placeholder="e.g. Patil"
                          style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #86EFAC', fontSize: '0.85rem', fontWeight: 600 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '0.3rem' }}>Email Address *</label>
                        <input
                          type="email"
                          required
                          value={quickStaffForm.email}
                          onChange={(e) => setQuickStaffForm({ ...quickStaffForm, email: e.target.value })}
                          placeholder="teacher@edunive.com"
                          style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #86EFAC', fontSize: '0.85rem', fontWeight: 600 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '0.3rem' }}>Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={quickStaffForm.phoneNumber}
                          onChange={(e) => setQuickStaffForm({ ...quickStaffForm, phoneNumber: e.target.value })}
                          placeholder="9876543210"
                          style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #86EFAC', fontSize: '0.85rem', fontWeight: 600 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '0.3rem' }}>Role</label>
                        <select
                          value={quickStaffForm.role}
                          onChange={(e) => setQuickStaffForm({ ...quickStaffForm, role: e.target.value })}
                          style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #86EFAC', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <option value="teacher">Teacher</option>
                          <option value="non_teaching_staff">Non-Teaching Staff</option>
                          <option value="school_admin">Branch Admin</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '0.3rem' }}>Department</label>
                        <select
                          value={quickStaffForm.department}
                          onChange={(e) => setQuickStaffForm({ ...quickStaffForm, department: e.target.value })}
                          style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #86EFAC', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <option value="Teaching">Teaching</option>
                          <option value="Administration">Administration</option>
                          <option value="Support">Support / Caretaker</option>
                          <option value="Accounts">Accounts</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '0.3rem' }}>Designation</label>
                        <input
                          type="text"
                          value={quickStaffForm.designation}
                          onChange={(e) => setQuickStaffForm({ ...quickStaffForm, designation: e.target.value })}
                          placeholder="e.g. Preschool Teacher"
                          style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #86EFAC', fontSize: '0.85rem', fontWeight: 600 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsQuickAddStaffOpen(false)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#059669', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        {saving ? 'Adding Staff...' : `Add Staff to ${selectedBranchForStaff.name} ✅`}
                      </button>
                    </div>
                  </form>
                )}

                {/* Staff List Table */}
                {loadingBranchStaff ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                    <div style={{ fontWeight: 700 }}>Loading staff members...</div>
                  </div>
                ) : branchStaffList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#F8FAFC', borderRadius: '1rem', border: '2px dashed #CBD5E1' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👩‍🏫</div>
                    <h4 style={{ margin: 0, fontWeight: 800, color: '#334155' }}>No staff members added to this branch yet</h4>
                    <p style={{ margin: '0.4rem 0 1rem 0', color: '#64748B', fontSize: '0.85rem' }}>
                      No staff members or teachers are currently registered to {selectedBranchForStaff.name}.
                    </p>
                    <button
                      onClick={() => setIsQuickAddStaffOpen(true)}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      + Add First Staff Member Now
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '0.75rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Name & ID</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Department / Designation</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Contact</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branchStaffList.map((staff, idx) => (
                          <tr key={staff.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ fontWeight: 800, color: '#0F172A' }}>
                                {staff.firstName} {staff.lastName}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                {staff.employee_id || staff.email}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: staff.role === 'teacher' ? '#EFF6FF' : '#F1F5F9',
                                color: staff.role === 'teacher' ? '#2563EB' : '#475569'
                              }}>
                                {staff.role?.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ fontWeight: 700, color: '#334155' }}>{staff.designation || 'Teacher'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{staff.department || 'Teaching'}</div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ color: '#0F172A', fontWeight: 600 }}>{staff.phoneNumber || staff.phone || '—'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{staff.email}</div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                Active ✅
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FranchiseManagement;

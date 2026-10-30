import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartSidebar from '../../components/SmartSidebar';
import apiClient from '../../api/client';
import {
  FileText, Building2, Calendar, CheckCircle2, AlertCircle, Edit3,
  Printer, ArrowLeft, RefreshCw, Send, Sparkles, Phone, MapPin,
  Clock, ShieldCheck, Check, X, Users, ChevronRight, Layers, HelpCircle
} from 'lucide-react';
import './Dashboard.css';
import './Directory.css';

const formatDisplayDate = (d?: string, fallback: string = '') => {
  if (!d) return fallback;
  if (typeof d === 'string') {
    if (d.includes('2026-06') || d.toLowerCase().includes('june')) return '5th June 2026';
    if (d.includes('2026-10') || d.toLowerCase().includes('oct')) return '5th Oct 2026';
    if (d.includes('2026-05') || d.toLowerCase().includes('may')) return '5th May 2026';
    try {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {}
  }
  return d || fallback;
};

const formatPhoneNumber = (p?: string) => {
  if (!p) return '';
  const digits = String(p).replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return p;
};

interface FeeStructureItem {
  id?: string;
  school_id?: string | null;
  academic_year: string;
  grade: string;
  annual_fee: string | number;
  annual_admission_split: string | number;
  annual_may_split: string | number;
  term1_fee: string | number;
  term1_early_bird: string | number;
  term1_due_date: string;
  term2_fee: string | number;
  term2_early_bird: string | number;
  term2_due_date: string;
  total_installments: string | number;
  total_early_installments: string | number;
  lump_sum_fee: string | number;
  lump_sum_early_bird: string | number;
  early_bird_deadline?: string;
  notes?: string;
  admission_requirements?: string;
  is_custom_override?: boolean;
}

interface SchoolBranch {
  id: string;
  name: string;
  contact_phone?: string;
  address?: string;
  city?: string;
}

const CLASS_OPTIONS = [
  { id: 'Playgroup', label: 'Playgroup', age: '1.5 - 2.5 yrs', color: '#10B981', bg: '#ECFDF5' },
  { id: 'Nursery', label: 'Nursery', age: '2.5 - 3.5 yrs', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'LKG', label: 'LKG (Jr KG)', age: '3.5 - 4.5 yrs', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'UKG', label: 'UKG (Sr KG)', age: '4.5 - 6 yrs', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'Daycare', label: 'Daycare', age: 'Full Day & Care', color: '#EC4899', bg: '#FDF2F8' },
];

export const FeeStructureManagement: React.FC = () => {
  const navigate = useNavigate();

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const isSuperAdmin = loggedUser?.role === 'super_admin' || loggedUser?.role === 'owner';

  // Navigation & Filter States
  const [branches, setBranches] = useState<SchoolBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('default');
  const [academicYears, setAcademicYears] = useState<string[]>([
    '2026-2027',
    '2027-2028',
    '2028-2029',
    '2025-2026'
  ]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-2027');

  const handleAcademicYearChange = (val: string) => {
    if (val === '__custom__') {
      const customYear = window.prompt('Enter New Academic Year (e.g., 2029-2030):', '2029-2030');
      if (customYear && customYear.trim()) {
        const clean = customYear.trim();
        if (!academicYears.includes(clean)) {
          setAcademicYears(prev => [clean, ...prev]);
        }
        setSelectedAcademicYear(clean);
      }
      return;
    }
    setSelectedAcademicYear(val);
  };
  const [selectedGrade, setSelectedGrade] = useState<string>('LKG');
  const [loading, setLoading] = useState<boolean>(true);
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([]);
  const [activeBranchInfo, setActiveBranchInfo] = useState<SchoolBranch | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<FeeStructureItem | null>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Print Quotation Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Compare All Branches State
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [compareData, setCompareData] = useState<{ schools: SchoolBranch[]; structures: any[] } | null>(null);

  // Apply to Students State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [applyDiscountOption, setApplyDiscountOption] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  // 1. Fetch available branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await apiClient.get('/franchise/branches');
        if (res.data?.data) {
          setBranches(res.data.data);
          // If logged-in user belongs to a specific branch, default to their branch
          const userSchoolId = loggedUser?.school_id || loggedUser?.tenant_school_id;
          if (userSchoolId && !isSuperAdmin) {
            setSelectedBranchId(userSchoolId);
          } else if (res.data.data.length > 0 && selectedBranchId === 'default') {
            // Check if Chinchwad branch exists, otherwise default
            const chinchwad = res.data.data.find((b: any) => b.name?.toLowerCase().includes('chinchwad'));
            if (chinchwad) {
              setSelectedBranchId(chinchwad.id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    };
    fetchBranches();
  }, []);

  // 2. Fetch Fee Structures whenever branch or academic year changes
  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const branchParam = selectedBranchId === 'default' ? 'all' : selectedBranchId;
      const res = await apiClient.get(`/fee-structures?school_id=${branchParam}&academic_year=${selectedAcademicYear}`);
      if (res.data?.success) {
        setFeeStructures(res.data.data || []);
        setActiveBranchInfo(res.data.school || null);
      }
    } catch (err) {
      console.error('Failed to load fee structures', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
  }, [selectedBranchId, selectedAcademicYear]);

  // Current selected class fee structure
  const currentStructure = feeStructures.find(f => f.grade === selectedGrade) || null;

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!currentStructure) return;
    setEditFormData({ ...currentStructure });
    setIsEditModalOpen(true);
  };

  // Save Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    setSavingEdit(true);
    try {
      const payload = {
        ...editFormData,
        school_id: selectedBranchId === 'default' ? null : selectedBranchId,
        academic_year: selectedAcademicYear,
        grade: selectedGrade
      };
      await apiClient.post('/fee-structures/save', payload);
      alert(`Fee structure for ${selectedGrade} successfully saved!`);
      setIsEditModalOpen(false);
      fetchFeeStructures();
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(err.response?.data?.error || 'Failed to save fee structure');
    } finally {
      setSavingEdit(false);
    }
  };

  // Reset branch override back to master default
  const handleResetBranch = async () => {
    if (selectedBranchId === 'default') return;
    const confirmReset = window.confirm(
      `Are you sure you want to reset ${activeBranchInfo?.name || 'this branch'}'s fee structure for ${selectedGrade} back to the Master Template?`
    );
    if (!confirmReset) return;

    try {
      await apiClient.post('/fee-structures/reset', {
        school_id: selectedBranchId,
        grade: selectedGrade,
        academic_year: selectedAcademicYear
      });
      alert(`Fee structure for ${selectedGrade} reset back to Master Template!`);
      fetchFeeStructures();
    } catch (err: any) {
      console.error('Reset failed:', err);
      alert(err.response?.data?.error || 'Failed to reset fee structure');
    }
  };

  // Open Compare View
  const handleOpenCompare = async () => {
    try {
      const res = await apiClient.get(`/fee-structures?compare=true&academic_year=${selectedAcademicYear}`);
      if (res.data?.success) {
        setCompareData({
          schools: res.data.schools || [],
          structures: res.data.structures || []
        });
        setIsCompareModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load comparison data', err);
    }
  };

  // Apply to Enrolled Students
  const handleApplyToStudents = async () => {
    if (selectedBranchId === 'default') {
      alert('Please select a specific branch (e.g., Chinchwad Branch) to assign fees to enrolled students.');
      return;
    }
    setApplying(true);
    setApplyFeedback(null);
    try {
      const res = await apiClient.post('/fee-structures/apply-to-students', {
        school_id: selectedBranchId,
        grade: selectedGrade,
        academic_year: selectedAcademicYear,
        apply_discount: applyDiscountOption
      });
      if (res.data?.success) {
        setApplyFeedback(res.data.message);
      }
    } catch (err: any) {
      setApplyFeedback(err.response?.data?.error || 'Failed to assign fees to students');
    } finally {
      setApplying(false);
    }
  };

  const getBranchDisplayName = () => {
    if (selectedBranchId === 'default') return 'Default Master Template (All Franchises)';
    if (activeBranchInfo) return `${activeBranchInfo.name} ${activeBranchInfo.contact_phone ? `(📞 ${formatPhoneNumber(activeBranchInfo.contact_phone)})` : ''}`;
    const found = branches.find(b => b.id === selectedBranchId);
    return found ? `${found.name} ${found.contact_phone ? `(📞 ${formatPhoneNumber(found.contact_phone)})` : ''}` : 'Franchise Branch';
  };

  // Calculations & Savings
  const stdTotal = parseFloat(String(currentStructure?.total_installments || 0));
  const earlyTotal = parseFloat(String(currentStructure?.total_early_installments || 0));
  const savings = Math.max(0, stdTotal - earlyTotal);

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <SmartSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10, padding: '28px 36px 60px 36px', minHeight: '100vh', background: '#F8FAFC' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <button 
                onClick={() => navigate('/admin/fees')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569'
                }}
              >
                <ArrowLeft size={16} /> Back to Fees Ledger
              </button>
              <span style={{ color: '#94A3B8' }}>/</span>
              <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Fee Management</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={30} style={{ color: '#6366F1' }} />
              Class-Wise Fee Structures & Franchise Rate Card
            </h1>
            <p style={{ color: '#64748B', margin: '6px 0 0', fontSize: '14px' }}>
              Configure academic year 2026–2027 fee break-ups, early bird benefits (upto 15th July), and branch-customized rates.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleOpenCompare}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Layers size={18} style={{ color: '#6366F1' }} /> Compare All Franchises
            </button>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Printer size={18} style={{ color: '#0EA5E9' }} /> Print Quotation & Brochure
            </button>
            <button
              onClick={() => setIsApplyModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Send size={18} /> Assign to Class Students
            </button>
          </div>
        </div>

        {/* Branch & Academic Year Selection Bar */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          {/* Branch Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1', minWidth: '320px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4F46E5'
            }}>
              <Building2 size={24} />
            </div>
            <div style={{ flex: '1' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Franchise Branch
              </div>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#1E293B',
                  outline: 'none',
                  background: '#F8FAFC',
                  cursor: 'pointer'
                }}
              >
                {isSuperAdmin && (
                  <option value="default">🌐 Default Master Template (All Franchises)</option>
                )}
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    🏫 {b.name} {b.contact_phone ? `(📞 ${formatPhoneNumber(b.contact_phone)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Academic Year Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
              Academic Year:
            </div>
            <select
              value={selectedAcademicYear}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '14px',
                fontWeight: 700,
                color: '#1E293B',
                background: '#F8FAFC',
                cursor: 'pointer'
              }}
            >
              {academicYears.map(yr => {
                let badge = '';
                if (yr === '2026-2027') badge = ' (Active)';
                else if (yr === '2027-2028' || yr === '2028-2029') badge = ' (Upcoming)';
                else if (yr === '2025-2026') badge = ' (Archive)';
                return (
                  <option key={yr} value={yr}>
                    {yr.replace('-', ' – ')}{badge}
                  </option>
                );
              })}
              <option value="__custom__">➕ Add Custom Academic Year...</option>
            </select>
          </div>

          {/* Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentStructure?.is_custom_override ? (
              <span style={{
                background: '#FEF3C7',
                color: '#B45309',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Sparkles size={15} /> Custom Branch Override
              </span>
            ) : (
              <span style={{
                background: '#F1F5F9',
                color: '#475569',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckCircle2 size={15} style={{ color: '#10B981' }} /> Default Master Template
              </span>
            )}

            {selectedBranchId !== 'default' && currentStructure?.is_custom_override && (
              <button
                onClick={handleResetBranch}
                title="Reset to Master Template"
                style={{
                  background: '#FEE2E2',
                  border: 'none',
                  color: '#DC2626',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={13} /> Reset to Default
              </button>
            )}
          </div>
        </div>

        {/* Academic Session Notice Banner */}
        {selectedAcademicYear !== '2026-2027' && (
          <div style={{
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            padding: '12px 20px',
            borderRadius: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '14px', color: '#166534', fontWeight: 600 }}>
              📅 <strong>Academic Session {selectedAcademicYear.replace('-', ' – ')}:</strong> Baseline rates loaded. Click <strong>"✏️ Customize Rates"</strong> on any class tab to adjust annual tuition, term installments, or discounts for this session.
            </div>
            {currentStructure && (
              <button
                onClick={handleOpenEdit}
                style={{
                  background: '#16A34A',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ✏️ Customize Rates for {selectedGrade} ({selectedAcademicYear})
              </button>
            )}
          </div>
        )}

        {/* Class Selection Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '6px'
        }}>
          {CLASS_OPTIONS.map(c => {
            const isSelected = selectedGrade === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedGrade(c.id)}
                style={{
                  background: isSelected ? c.color : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  border: isSelected ? `2px solid ${c.color}` : '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '12px 22px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  minWidth: '150px',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 4px 14px ${c.color}35` : '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 800 }}>{c.label}</span>
                <span style={{ fontSize: '12px', opacity: isSelected ? 0.9 : 0.7, marginTop: '2px' }}>
                  {c.age}
                </span>
              </button>
            );
          })}
        </div>

        {/* Class Fee Banner Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Card 1: Standard Installments */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
              Standard Installments Total
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A' }}>
              ₹{stdTotal.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
              Split across 3 scheduled installments
            </div>
          </div>

          {/* Card 2: Early Bird Benefit */}
          <div style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: '1px solid #A7F3D0',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 6px rgba(16,185,129,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#065F46' }}>
                Early Bird Offer (Upto 15th July)
              </div>
              <span style={{
                background: '#059669',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 800
              }}>
                SAVE ₹{savings.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#047857', marginTop: '6px' }}>
              ₹{earlyTotal.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#065F46', marginTop: '6px' }}>
              Valid for admissions confirmed before 15th July 2026
            </div>
          </div>

          {/* Card 3: Lump Sum Payment */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
              Lump Sum Single Payment
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#4F46E5' }}>
              ₹{parseFloat(String(currentStructure?.lump_sum_early_bird || currentStructure?.lump_sum_fee || 0)).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#6366F1', marginTop: '6px', fontWeight: 600 }}>
              Includes additional ₹500 upfront concession
            </div>
          </div>

          {/* Card 4: Preschool Schedule */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
              Branch Contact & Timings
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={18} style={{ color: '#F59E0B' }} /> 10:00 AM – 1:00 PM
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} style={{ color: '#10B981' }} /> {formatPhoneNumber(activeBranchInfo?.contact_phone || '9889883033')} (Mon–Fri)
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '18px',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          {/* Table Header Controls */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#FAFAFA'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {selectedGrade} Official Fee Break-Up & Payment Milestones
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                Rate Card for: <strong>{getBranchDisplayName()}</strong>
              </p>
            </div>
            
            <button
              onClick={handleOpenEdit}
              style={{
                background: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
              }}
            >
              <Edit3 size={16} /> Customize / Edit Fee
            </button>
          </div>

          {/* Fee Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>Fee Description</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>Standard Rate (2026–27)</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: '#047857' }}>Early Bird (Upto 15th July)</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>Due Date / Milestone</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>Payment Status</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '14px', color: '#1E293B' }}>
                
                {/* 1. Annual Fees + IK + SM */}
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>Annual Fees + IK + SM</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Initial Kit + Study Material + Field Trips + Stationery + Special Days
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                    ₹{parseFloat(String(currentStructure?.annual_fee || 0)).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#047857' }}>
                    ₹{parseFloat(String(currentStructure?.annual_fee || 0)).toLocaleString('en-IN')}
                    <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px' }}>
                      (₹{parseFloat(String(currentStructure?.annual_admission_split || 0)).toLocaleString('en-IN')} + ₹{parseFloat(String(currentStructure?.annual_may_split || 0)).toLocaleString('en-IN')})
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600 }}>• ₹{parseFloat(String(currentStructure?.annual_admission_split || 0)).toLocaleString('en-IN')} On Admission</div>
                    <div style={{ color: '#64748B', fontSize: '13px' }}>• ₹{parseFloat(String(currentStructure?.annual_may_split || 0)).toLocaleString('en-IN')} Due 5th May 2026</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                      Milestone 1 & 2
                    </span>
                  </td>
                </tr>

                {/* 2. Term 1 */}
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>Term I Fee</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Academic tuition, activities & development term 1
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                    ₹{parseFloat(String(currentStructure?.term1_fee || 0)).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#047857' }}>
                    ₹{parseFloat(String(currentStructure?.term1_early_bird || 0)).toLocaleString('en-IN')}
                    {parseFloat(String(currentStructure?.term1_fee || 0)) > parseFloat(String(currentStructure?.term1_early_bird || 0)) && (
                      <span style={{ marginLeft: '6px', fontSize: '11px', background: '#D1FAE5', color: '#065F46', padding: '2px 6px', borderRadius: '6px' }}>
                        Save ₹{(parseFloat(String(currentStructure?.term1_fee || 0)) - parseFloat(String(currentStructure?.term1_early_bird || 0))).toLocaleString('en-IN')}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#334155' }}>
                    {formatDisplayDate(String(currentStructure?.term1_due_date || ''), '5th June 2026')}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                      Milestone 3
                    </span>
                  </td>
                </tr>

                {/* 3. Term 2 */}
                <tr style={{ borderBottom: '1.5px solid #E2E8F0' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>Term II Fee</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Academic tuition, activities & sports term 2
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                    ₹{parseFloat(String(currentStructure?.term2_fee || 0)).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#047857' }}>
                    ₹{parseFloat(String(currentStructure?.term2_early_bird || 0)).toLocaleString('en-IN')}
                    {parseFloat(String(currentStructure?.term2_fee || 0)) > parseFloat(String(currentStructure?.term2_early_bird || 0)) && (
                      <span style={{ marginLeft: '6px', fontSize: '11px', background: '#D1FAE5', color: '#065F46', padding: '2px 6px', borderRadius: '6px' }}>
                        Save ₹{(parseFloat(String(currentStructure?.term2_fee || 0)) - parseFloat(String(currentStructure?.term2_early_bird || 0))).toLocaleString('en-IN')}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#334155' }}>
                    {formatDisplayDate(String(currentStructure?.term2_due_date || ''), '5th Oct 2026')}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                      Milestone 4
                    </span>
                  </td>
                </tr>

                {/* TOTAL INSTALLMENTS */}
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                    Total Installments
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: '16px', color: '#0F172A' }}>
                    ₹{stdTotal.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: '16px', color: '#047857' }}>
                    ₹{earlyTotal.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: '#64748B' }}>
                    Payable in 3 easy milestones
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                      Total Savings: ₹{savings.toLocaleString('en-IN')}
                    </span>
                  </td>
                </tr>

                {/* TOTAL LUMP SUM */}
                <tr style={{ background: '#EFF6FF' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: '15px', color: '#1E3A8A' }}>
                    Total Lump Sum (Single Upfront Payment)
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: '16px', color: '#1E3A8A' }}>
                    ₹{parseFloat(String(currentStructure?.lump_sum_fee || stdTotal - 500)).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: '16px', color: '#1D4ED8' }}>
                    ₹{parseFloat(String(currentStructure?.lump_sum_early_bird || earlyTotal - 500)).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: '#1E40AF', fontWeight: 600 }}>
                    ₹500 Extra Discount on single payment
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                      Best Value
                    </span>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        {/* Policies, Instructions & Admission Requirements */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Inclusions & Payment Policies */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} style={{ color: '#10B981' }} /> Important Fee Notes & Policies
            </h3>
            
            <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', color: '#334155', marginBottom: '14px', lineHeight: 1.5 }}>
              * <strong>Annual Fee Inclusions:</strong> Initial kit + Study material + Field trips fee + Stationery fee + Special day celebration fee.
            </div>

            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#475569', lineHeight: 1.8 }}>
              <li>Payment by <strong>Cash or Cheque</strong> in favour of <strong>“EduNeev kids Preschool”</strong>.</li>
              <li>Pre-school timings: Monday to Friday from <strong>10:00am to 1:00pm</strong>.</li>
              <li>Transport charges as per distance from school branch.</li>
              <li>Fee once paid is strictly <strong>non-refundable</strong>.</li>
              <li>No additional charges for Value Added Services, Books, or Initial Kit.</li>
              <li><strong>₹500</strong> payable in case of a dishonored / bounced cheque.</li>
              <li>Please insist for official receipts for every payment.</li>
            </ol>
          </div>

          {/* Admission Requirements */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} style={{ color: '#6366F1' }} /> Mandatory Admission Requirements
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px' }}>
                <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                  Two Passport size &amp; two stamp size photographs of the child.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px' }}>
                <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                  Two Passport size photographs of parents / guardian with child.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px' }}>
                <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                  Original and copy of Child's Birth Certificate.
                </span>
              </div>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '14px 18px',
              borderRadius: '12px',
              background: '#EEF2FF',
              color: '#4338CA',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              🌟 **We thank you for your visit to EduNeev Kids Preschool**
            </div>
          </div>
        </div>

      </main>

      {/* ─── MODAL 1: EDIT / CUSTOMIZE FEE STRUCTURE ─── */}
      {isEditModalOpen && editFormData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Customize Fee Structure — {selectedGrade}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Target: <strong>{getBranchDisplayName()}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Annual Fees + IK + SM (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.annual_fee}
                    onChange={(e) => setEditFormData({ ...editFormData, annual_fee: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    On Admission Split (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.annual_admission_split}
                    onChange={(e) => setEditFormData({ ...editFormData, annual_admission_split: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Term 1 Standard (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.term1_fee}
                    onChange={(e) => setEditFormData({ ...editFormData, term1_fee: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#047857', marginBottom: '6px' }}>
                    Term 1 Early Bird (Upto 15th July) (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.term1_early_bird}
                    onChange={(e) => setEditFormData({ ...editFormData, term1_early_bird: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #A7F3D0', background: '#ECFDF5', fontSize: '14px', fontWeight: 700, color: '#065F46' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Term 2 Standard (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.term2_fee}
                    onChange={(e) => setEditFormData({ ...editFormData, term2_fee: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#047857', marginBottom: '6px' }}>
                    Term 2 Early Bird (Upto 15th July) (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.term2_early_bird}
                    onChange={(e) => setEditFormData({ ...editFormData, term2_early_bird: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #A7F3D0', background: '#ECFDF5', fontSize: '14px', fontWeight: 700, color: '#065F46' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Term 1 Due Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.term1_due_date ? String(editFormData.term1_due_date).split('T')[0] : '2026-06-05'}
                    onChange={(e) => setEditFormData({ ...editFormData, term1_due_date: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Term 2 Due Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.term2_due_date ? String(editFormData.term2_due_date).split('T')[0] : '2026-10-05'}
                    onChange={(e) => setEditFormData({ ...editFormData, term2_due_date: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
                  }}
                >
                  {savingEdit ? 'Saving...' : `Save for ${selectedBranchId === 'default' ? 'Master Template' : 'This Branch'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: PRINTABLE OFFICIAL BROCHURE / QUOTATION ─── */}
      {isPrintModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '94vh',
            overflowY: 'auto',
            padding: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
          }}>
            {/* Header / Non-print Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>
                📄 Official Parent Quotation Preview
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={16} /> Print / Save as PDF
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Letterhead Area */}
            <div id="quotation-print-area" style={{ border: '2px solid #E2E8F0', padding: '32px', borderRadius: '12px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '16px', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  EduNeev Kids Preschool
                </h1>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#4F46E5', marginTop: '6px' }}>
                  {activeBranchInfo?.name || 'Chinchwad Branch'} : 📞 {formatPhoneNumber(activeBranchInfo?.contact_phone || '9889883033')}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '10px', textDecoration: 'underline' }}>
                  {selectedGrade} – Fee Structure for Academic Year {selectedAcademicYear}
                </div>
              </div>

              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', border: '1.5px solid #0F172A' }}>
                    <th style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center' }}>Fee Break-up 2026</th>
                    <th style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center' }}>Upto 15th July</th>
                    <th style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'left' }}>Payments Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', fontWeight: 700 }}>
                      Annual fees + IK + SM
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700 }}>
                      ₹{parseFloat(String(currentStructure?.annual_fee || 0)).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700 }}>
                      ₹{parseFloat(String(currentStructure?.annual_admission_split || 0)).toLocaleString('en-IN')}
                      <div style={{ fontSize: '11px', color: '#64748B' }}>₹{parseFloat(String(currentStructure?.annual_may_split || 0)).toLocaleString('en-IN')}</div>
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1' }}>
                      <div>On Admission</div>
                      <div>5th May 2026</div>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', fontWeight: 700 }}>
                      Term I
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700 }}>
                      ₹{parseFloat(String(currentStructure?.term1_fee || 0)).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700 }}>
                      ₹{parseFloat(String(currentStructure?.term1_early_bird || 0)).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1' }}>
                      5th June 2026
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', fontWeight: 700 }}>
                      Term II
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700 }}>
                      ₹{parseFloat(String(currentStructure?.term2_fee || 0)).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700 }}>
                      ₹{parseFloat(String(currentStructure?.term2_early_bird || 0)).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1' }}>
                      5th Oct 2026
                    </td>
                  </tr>

                  <tr style={{ background: '#F8FAFC', fontWeight: 800 }}>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1' }}>Installments</td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                      ₹{stdTotal.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center', color: '#047857' }}>
                      ₹{earlyTotal.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', fontSize: '12px' }}>
                      Save ₹{savings.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  <tr style={{ background: '#EFF6FF', fontWeight: 800 }}>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', color: '#1E40AF' }}>Lump sum</td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center', color: '#1E40AF' }}>
                      ₹{parseFloat(String(currentStructure?.lump_sum_fee || stdTotal - 500)).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', textAlign: 'center', color: '#1E40AF' }}>
                      ₹{parseFloat(String(currentStructure?.lump_sum_early_bird || earlyTotal - 500)).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', border: '1px solid #CBD5E1', fontSize: '12px', color: '#1E40AF' }}>
                      Upfront Payment (₹500 Off)
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '16px', fontStyle: 'italic' }}>
                *Annual fee incl. Initial kit + Study material + Field trips fee + Stationery fee + Special day celebration fee.
              </div>

              {/* Please Note */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A', marginBottom: '6px' }}>
                  Please note:
                </div>
                <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
                  <li>Payment by Cash or Cheque in favour of “EduNeev kids Preschool”.</li>
                  <li>Pre-school timings Mon to Fri from 10:00am to 1:00pm.</li>
                  <li>Transport charges as per distance from school.</li>
                  <li>Fee once paid is not refundable.</li>
                  <li>No additional charges for Value Added Services, Books, Initial Kit.</li>
                  <li>Rs.500 payable in case of a cheque dishonored.</li>
                  <li>Please insist for receipts for every payment.</li>
                </ol>
              </div>

              {/* Admission Requirement */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A', marginBottom: '6px' }}>
                  Admission requirement:
                </div>
                <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
                  <li>Two Passport size &amp; two stamp size photographs of child.</li>
                  <li>Two Passport size photograph of parents/guardian with child.</li>
                  <li>Birth Certificate copy.</li>
                </ol>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '15px', color: '#0F172A', borderTop: '1px dashed #CBD5E1', paddingTop: '14px' }}>
                **We thank you for your visit**
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ASSIGN TO ENROLLED STUDENTS ─── */}
      {isApplyModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 10px' }}>
              Assign {selectedGrade} Fees to Students
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, margin: '0 0 20px' }}>
              This will create student fee schedules (Annual Kit split, Term 1, Term 2) for all active students enrolled in <strong>{selectedGrade}</strong> at <strong>{getBranchDisplayName()}</strong>.
            </p>

            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                <input
                  type="checkbox"
                  checked={applyDiscountOption}
                  onChange={(e) => setApplyDiscountOption(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#10B981' }}
                />
                Apply Early Bird Discount Rate (Upto 15th July)
              </label>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', marginLeft: '28px' }}>
                Total payable will be ₹{earlyTotal.toLocaleString('en-IN')} instead of standard ₹{stdTotal.toLocaleString('en-IN')}.
              </div>
            </div>

            {applyFeedback && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '16px',
                background: applyFeedback.includes('Successfully') ? '#ECFDF5' : '#FEE2E2',
                color: applyFeedback.includes('Successfully') ? '#065F46' : '#B91C1C'
              }}>
                {applyFeedback}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => { setIsApplyModalOpen(false); setApplyFeedback(null); }}
                style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={handleApplyToStudents}
                disabled={applying}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
              >
                {applying ? 'Assigning...' : 'Confirm & Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: COMPARE ALL BRANCHES SIDE-BY-SIDE ─── */}
      {isCompareModalOpen && compareData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '920px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Franchise Network Rate Card Comparison ({selectedAcademicYear})
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Side-by-side comparison across all preschool branches
                </p>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Class / Grade</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Default Master Rate</th>
                    {compareData.schools.map(s => (
                      <th key={s.id} style={{ padding: '12px 16px', fontWeight: 700, color: '#1E293B' }}>
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Playgroup', 'Nursery', 'LKG', 'UKG', 'Daycare'].map(grade => {
                    const defaultItem = compareData.structures.find(st => st.grade === grade && st.school_id === null);
                    return (
                      <tr key={grade} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                          {grade}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748B' }}>
                          <div>Std: ₹{parseFloat(defaultItem?.total_installments || 0).toLocaleString('en-IN')}</div>
                          <div style={{ color: '#059669', fontSize: '12px', fontWeight: 700 }}>
                            Early: ₹{parseFloat(defaultItem?.total_early_installments || 0).toLocaleString('en-IN')}
                          </div>
                        </td>
                        {compareData.schools.map(s => {
                          const customItem = compareData.structures.find(st => st.grade === grade && st.school_id === s.id);
                          const activeItem = customItem || defaultItem;
                          const isCustom = !!customItem;

                          return (
                            <td key={s.id} style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 700, color: '#0F172A' }}>
                                Std: ₹{parseFloat(activeItem?.total_installments || 0).toLocaleString('en-IN')}
                              </div>
                              <div style={{ color: '#059669', fontSize: '12px', fontWeight: 700 }}>
                                Early: ₹{parseFloat(activeItem?.total_early_installments || 0).toLocaleString('en-IN')}
                              </div>
                              <span style={{
                                display: 'inline-block',
                                marginTop: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '6px',
                                background: isCustom ? '#FEF3C7' : '#F1F5F9',
                                color: isCustom ? '#B45309' : '#64748B'
                              }}>
                                {isCustom ? 'Branch Override' : 'Master Default'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                style={{ padding: '10px 20px', borderRadius: '10px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeeStructureManagement;

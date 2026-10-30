import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Sidebar from '../../components/Sidebar';
import { Search, Plus, Phone, Mail, Calendar, CheckCircle, ArrowLeft, Trash2, UserPlus, TrendingUp, User, Users, Megaphone, DollarSign, X, GraduationCap, Eye, Edit3, QrCode, Copy, Printer, Download } from 'lucide-react';
import QRCode from 'qrcode';
import './Directory.css';

interface Enquiry {
  id: string; 
  child_name: string; 
  parent_name: string; 
  parent_phone: string;
  parent_email?: string;
  class_interested?: string; 
  lead_source: string; 
  status: string;
  remarks?: string;
  follow_up_date?: string; 
  created_at: string; 
  assigned_to_name?: string;
}

interface Stats {
  new_count: string; 
  contacted_count: string; 
  visited_count: string;
  enrolled_count: string; 
  lost_count: string; 
  total: string;
}

interface ConversionStats {
  conversion_rate_percentage: string;
}

const STATUS_COLORS: Record<string, { bg: string, text: string, label: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Pending' },
  new: { bg: '#FEF3C7', text: '#D97706', label: 'Pending' },
  interested: { bg: '#ECFDF5', text: '#059669', label: 'Interested' },
  not_interested: { bg: '#FEE2E2', text: '#DC2626', label: 'Not Interested' },
  contacted: { bg: '#DBEAFE', text: '#2563EB', label: 'Contacted' },
  visited: { bg: '#E0E7FF', text: '#4338CA', label: 'Visited School' },
  enrolled: { bg: '#D1FAE5', text: '#047857', label: 'Enrolled / Fixed' },
  lost: { bg: '#F1F5F9', text: '#64748B', label: 'Lost' },
};

const STATUS_LIST = ['all', 'pending', 'interested', 'not_interested', 'contacted', 'visited', 'enrolled', 'lost'];
const REFERRAL_SOURCES = [
  'Friends', 'Banner', 'Pamphlet', 'Internet', 'Newspaper ad', 'Auto backs', 
  'TV ad', 'Poster', 'Hoarding', 'Magazine ad', 'Kiosk', 'Bus advertisement', 'Other'
];

const CLASS_ORDER = ['Playgroup', 'Nursery', 'LKG', 'UKG', 'Daycare'];

const normalizeGradeName = (grade?: string): string => {
  if (!grade) return '';
  const g = grade.trim();
  if (/^jr[\.\s]*kg$/i.test(g) || /^junior[\.\s]*kg$/i.test(g) || g.toUpperCase() === 'LKG') return 'LKG';
  if (/^sr[\.\s]*kg$/i.test(g) || /^senior[\.\s]*kg$/i.test(g) || g.toUpperCase() === 'UKG') return 'UKG';
  if (/^play[\s\-_]*group$/i.test(g) || g.toUpperCase() === 'PG') return 'Playgroup';
  if (/^nursery$/i.test(g)) return 'Nursery';
  if (/^day[\s\-_]*care$/i.test(g)) return 'Daycare';
  return g;
};

const sortClasses = (classes: string[]): string[] => {
  const normalized = Array.from(new Set(classes.map(c => normalizeGradeName(c)).filter(Boolean)));
  return normalized.sort((a, b) => {
    const idxA = CLASS_ORDER.indexOf(a);
    const idxB = CLASS_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
};

const EnquiriesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [convStats, setConvStats] = useState<ConversionStats | null>(null);
  const [availableClasses, setAvailableClasses] = useState<string[]>(CLASS_ORDER);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [saving, setSaving] = useState(false);

  // QR Code for Easy Enquiry Form Access
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const handleOpenQrModal = async () => {
    try {
      const publicUrl = `${window.location.origin}/enquiry`;
      const dataUrl = await QRCode.toDataURL(publicUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: '#1E1B4B',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
      setIsQrModalOpen(true);
    } catch (err) {
      console.error('Failed to generate QR code', err);
      alert('Could not generate QR code');
    }
  };

  const handleCopyPublicUrl = () => {
    const publicUrl = `${window.location.origin}/enquiry`;
    navigator.clipboard.writeText(publicUrl);
    alert('✅ Public Enquiry Link copied to clipboard! You can share this via WhatsApp, SMS, or Social Media.');
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'EduNeev_Admission_Enquiry_QR_Code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintStandee = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const publicUrl = `${window.location.origin}/enquiry`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EduNeev Kids Preschool - Admission Enquiry QR Code Standee</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; text-align: center; color: #0F172A; padding: 20px; }
            .standee { border: 4px solid #4F46E5; border-radius: 24px; padding: 36px 24px; max-width: 500px; margin: 0 auto; background: #FFFFFF; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            .header-tag { display: inline-block; background: #EEF2FF; color: #4F46E5; padding: 6px 18px; border-radius: 99px; font-weight: 800; font-size: 13px; margin-bottom: 15px; }
            h1 { font-size: 28px; margin: 0 0 8px 0; color: #1E1B4B; text-transform: uppercase; }
            h3 { font-size: 16px; margin: 0 0 20px 0; color: #4F46E5; font-weight: 700; }
            .qr-box { background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 16px; padding: 20px; display: inline-block; margin: 10px 0 20px; }
            .qr-box img { width: 240px; height: 240px; display: block; margin: 0 auto; }
            .scan-instructions { font-size: 18px; font-weight: 800; color: #059669; margin: 0 0 10px 0; }
            .sub-desc { font-size: 13px; color: #64748B; margin: 0 0 15px 0; line-height: 1.5; }
            .url-box { font-family: monospace; font-size: 12px; background: #F1F5F9; padding: 8px 12px; border-radius: 8px; color: #334155; word-break: break-all; }
            .footer { margin-top: 25px; border-top: 1px solid #E2E8F0; padding-top: 12px; font-size: 11px; color: #94A3B8; }
          </style>
        </head>
        <body>
          <div class="standee">
            <span class="header-tag">✨ ADMISSIONS OPEN 2026 - 2027</span>
            <h1>EduNeev Kids International</h1>
            <h3>Preschool & Daycare Network</h3>
            <div class="qr-box">
              <img src="${qrDataUrl}" alt="Admission Enquiry QR Code" />
            </div>
            <p class="scan-instructions">📲 Scan with Phone Camera</p>
            <p class="sub-desc">Instant online admission enquiry form for Playgroup, Nursery, Jr KG, Sr KG & Daycare.</p>
            <div class="url-box">${publicUrl}</div>
            <div class="footer">EduNeev Preschool Network • Chinchwad • Chikhali • Dudulgaon</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Status & Remark Modal Form
  const [statusForm, setStatusForm] = useState({
    id: '',
    child_name: '',
    status: 'pending',
    follow_up_date: '',
    remarks: ''
  });
  
  // Enquiry Form State matching Official EduNeev Paper Form
  const initialEnquiryForm = {
    // Child Info
    firstName: '',
    lastName: '',
    grade: 'Nursery',
    gender: 'male',
    dateOfBirth: '',
    bloodGroup: '',

    // Parents Info
    fatherName: '',
    fatherOccupation: '',
    fatherPhone: '',
    motherName: '',
    motherOccupation: '',
    motherPhone: '',
    parentEmail: '',
    parentAddress: '',
    emergencyContactPhone: '',

    // Referral & Centre
    sourceOfEnquiry: 'Friends',
    enrolmentCentre: 'Chinchwad - Sambhajinagar',

    // Follow up & Status
    status: 'pending',
    followUpDate: '',
    notes: ''
  };

  const [form, setForm] = useState(initialEnquiryForm);
  const [editForm, setEditForm] = useState({ id: '', ...initialEnquiryForm });

  // Convert to Admission Form State
  const [convertForm, setConvertForm] = useState({
    firstName: '',
    lastName: '',
    admissionNumber: '',
    grade: 'Nursery',
    gender: 'male',
    dateOfBirth: '',
    bloodGroup: '',

    fatherName: '',
    fatherOccupation: '',
    fatherPhone: '',
    motherName: '',
    motherOccupation: '',
    motherPhone: '',
    parentEmail: '',
    parentAddress: '',
    emergencyContactPhone: '',

    sourceOfEnquiry: 'Friends',
    enrolmentCentre: 'Chinchwad - Sambhajinagar',

    totalFee: '',
    admissionFee: '',
    discountAmount: '',
    discountReason: '',
    amountPaid: '',
    receiptNo: '',
    dateOfEnrolment: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    identityCardNo: '',
    chequeDetails: '',
    balanceAmount: '',
    dueDates: '',
    admissionKit: 'Given',
    followUpNotes: ''
  });

  const [dbFeeStructures, setDbFeeStructures] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [enquiryRes, statsRes, convRes, classesRes, feeRes] = await Promise.all([
        apiClient.get('/enquiries', { params: { status: filterStatus === 'all' ? undefined : filterStatus } }),
        apiClient.get('/enquiries/stats').catch(() => ({ data: { summary: null } })),
        apiClient.get('/enquiries/conversion-analytics').catch(() => ({ data: null })),
        apiClient.get('/classes').catch(() => ({ data: [] })),
        apiClient.get('/fee-structures').catch(() => ({ data: { data: [] } }))
      ]);

      const fetchedList = Array.isArray(enquiryRes.data) ? enquiryRes.data : (enquiryRes.data?.data || []);
      setEnquiries(fetchedList);

      if (statsRes.data?.summary) setStats(statsRes.data.summary);
      if (convRes.data) setConvStats(convRes.data);
      if (Array.isArray(classesRes.data) && classesRes.data.length > 0) {
        const rawNames = classesRes.data.map((c: any) => c.name).filter(Boolean);
        const sorted = sortClasses(rawNames);
        setAvailableClasses(sorted.length > 0 ? sorted : CLASS_ORDER);
      }
      if (feeRes.data?.data && Array.isArray(feeRes.data.data)) {
        setDbFeeStructures(feeRes.data.data);
      }
    } catch (error) {
      console.error('Fetch enquiries error:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEnquiries = enquiries.filter(e => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      (e.child_name || '').toLowerCase().includes(term) ||
      (e.parent_name || '').toLowerCase().includes(term) ||
      (e.parent_phone || '').includes(term) ||
      (e.parent_email || '').toLowerCase().includes(term) ||
      (e.class_interested || '').toLowerCase().includes(term) ||
      (e.lead_source || '').toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string, enquiry?: Enquiry) => {
    const sKey = (status || 'pending').toLowerCase();
    const info = STATUS_COLORS[sKey] || STATUS_COLORS['pending'];
    return (
      <span 
        className="role-badge" 
        style={{ 
          background: info.bg, 
          color: info.text, 
          textTransform: 'capitalize', 
          fontWeight: 700, 
          padding: '4px 10px', 
          borderRadius: '12px', 
          cursor: enquiry ? 'pointer' : 'default', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px',
          border: '1px solid rgba(0,0,0,0.06)',
          fontSize: '0.8rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
        onClick={(e) => {
          if (enquiry) {
            e.stopPropagation();
            openStatusModal(enquiry);
          }
        }}
        title={enquiry ? "Click to quickly change Status & Remarks" : undefined}
      >
        {info.label} {enquiry ? '✏️' : ''}
      </span>
    );
  };

  const parseEnquiryRemarks = (remarksStr?: string) => {
    if (!remarksStr) return {};
    try {
      return JSON.parse(remarksStr);
    } catch (e) {
      return { notes: remarksStr };
    }
  };

  const fetchNextAdmissionNumberForConvert = async (selectedGrade: string) => {
    try {
      const admRes = await apiClient.get(`/admin/next-admission-number?grade=${encodeURIComponent(selectedGrade)}`);
      if (admRes.data?.nextNumber) {
        setConvertForm(prev => ({
          ...prev,
          grade: selectedGrade,
          admissionNumber: admRes.data.nextNumber
        }));
        return;
      }
    } catch (e) {
      console.warn('Failed to fetch next admission number for convert', e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const getClassFeeDetails = (grade: string, structures: any[] = dbFeeStructures) => {
    if (!structures || structures.length === 0) {
      return { total: 0, admission: 0 };
    }
    const cleanG = (grade || '').trim().toLowerCase();
    const matched = structures.find((s: any) => {
      const sg = (s.grade || '').trim().toLowerCase();
      if (sg === cleanG) return true;
      if (cleanG.includes('nursery') && sg.includes('nursery')) return true;
      if ((cleanG.includes('play') || cleanG === 'pg') && (sg.includes('play') || sg === 'pg')) return true;
      if ((cleanG.includes('jr') || cleanG.includes('lkg') || cleanG.includes('junior')) && (sg.includes('jr') || sg.includes('lkg'))) return true;
      if ((cleanG.includes('sr') || cleanG.includes('ukg') || cleanG.includes('senior')) && (sg.includes('sr') || sg.includes('ukg'))) return true;
      if (cleanG.includes('daycare') && sg.includes('daycare')) return true;
      return false;
    });

    if (matched) {
      const total = parseFloat(matched.total_installments || matched.lump_sum_fee || matched.annual_fee || 0);
      const admission = parseFloat(matched.annual_admission_split || matched.annual_fee || 0);
      return { total, admission };
    }
    return { total: 0, admission: 0 };
  };

  const handleConvertInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'grade') {
      fetchNextAdmissionNumberForConvert(value);
      const feeInfo = getClassFeeDetails(value, dbFeeStructures);
      setConvertForm(prev => {
        const paid = parseFloat(prev.amountPaid) || 0;
        return {
          ...prev,
          grade: value,
          totalFee: feeInfo.total > 0 ? String(feeInfo.total) : '',
          admissionFee: feeInfo.admission > 0 ? String(feeInfo.admission) : '',
          balanceAmount: feeInfo.total > 0 ? String(Math.max(0, feeInfo.total - paid)) : ''
        };
      });
    } else {
      setConvertForm(prev => {
        const updated = { ...prev, [name]: value };
        if (name === 'amountPaid' || name === 'totalFee' || name === 'discountAmount') {
          const tot = parseFloat(name === 'totalFee' ? value : updated.totalFee) || 0;
          const disc = parseFloat(name === 'discountAmount' ? value : updated.discountAmount) || 0;
          const net = Math.max(0, tot - disc);
          const paid = parseFloat(name === 'amountPaid' ? value : updated.amountPaid) || 0;
          updated.balanceAmount = String(Math.max(0, net - paid));
        }
        return updated;
      });
    }
  };

  const openAddModal = () => {
    setForm(initialEnquiryForm);
    setIsAddModalOpen(true);
  };

  const openEditModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    const parsed = parseEnquiryRemarks(enquiry.remarks);
    const nameParts = (enquiry.child_name || '').split(' ');
    setEditForm({
      id: enquiry.id,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      grade: enquiry.class_interested || 'Nursery',
      gender: parsed.gender || 'male',
      dateOfBirth: parsed.dateOfBirth || '',
      bloodGroup: parsed.bloodGroup || '',
      fatherName: parsed.fatherName || enquiry.parent_name || '',
      fatherOccupation: parsed.fatherOccupation || '',
      fatherPhone: parsed.fatherPhone || enquiry.parent_phone || '',
      motherName: parsed.motherName || '',
      motherOccupation: parsed.motherOccupation || '',
      motherPhone: parsed.motherPhone || '',
      parentEmail: enquiry.parent_email || '',
      parentAddress: parsed.parentAddress || '',
      emergencyContactPhone: parsed.emergencyContactPhone || enquiry.parent_phone || '',
      sourceOfEnquiry: enquiry.lead_source || parsed.sourceOfEnquiry || 'Friends',
      enrolmentCentre: parsed.enrolmentCentre || 'Chinchwad - Sambhajinagar',
      status: (enquiry.status || 'pending').toLowerCase(),
      followUpDate: enquiry.follow_up_date ? enquiry.follow_up_date.substring(0, 10) : '',
      notes: parsed.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id) return;
    if (!editForm.firstName || !editForm.fatherName || !editForm.fatherPhone) {
      alert("Child's First Name, Father's Name, and Father's Contact Phone are required!");
      return;
    }
    setSaving(true);
    try {
      const childName = `${editForm.firstName} ${editForm.lastName}`.trim();
      const parentName = editForm.fatherName.trim();
      const remarksData = JSON.stringify({
        fatherName: editForm.fatherName,
        fatherOccupation: editForm.fatherOccupation,
        fatherPhone: editForm.fatherPhone,
        motherName: editForm.motherName,
        motherOccupation: editForm.motherOccupation,
        motherPhone: editForm.motherPhone,
        gender: editForm.gender,
        dateOfBirth: editForm.dateOfBirth,
        bloodGroup: editForm.bloodGroup,
        sourceOfEnquiry: editForm.sourceOfEnquiry,
        enrolmentCentre: editForm.enrolmentCentre,
        parentAddress: editForm.parentAddress,
        emergencyContactPhone: editForm.emergencyContactPhone,
        notes: editForm.notes
      });

      await apiClient.put(`/enquiries/${editForm.id}`, {
        child_name: childName,
        parent_name: parentName,
        parent_phone: editForm.fatherPhone,
        parent_email: editForm.parentEmail,
        class_interested: editForm.grade,
        lead_source: editForm.sourceOfEnquiry,
        status: editForm.status,
        follow_up_date: editForm.followUpDate || null,
        remarks: remarksData
      });

      setIsEditModalOpen(false);
      fetchData();
      alert('Admission Enquiry updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update enquiry');
    } finally {
      setSaving(false);
    }
  };

  const openStatusModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    let parsedNotes = '';
    if (enquiry.remarks) {
      try {
        const p = JSON.parse(enquiry.remarks);
        parsedNotes = p.notes || '';
      } catch (e) {
        parsedNotes = enquiry.remarks;
      }
    }

    setStatusForm({
      id: enquiry.id,
      child_name: enquiry.child_name,
      status: enquiry.status || 'pending',
      follow_up_date: enquiry.follow_up_date ? enquiry.follow_up_date.substring(0, 10) : '',
      remarks: parsedNotes
    });
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusForm.id) return;
    setSaving(true);
    try {
      let remarksPayload = statusForm.remarks;
      if (selectedEnquiry?.remarks && selectedEnquiry.remarks.startsWith('{')) {
        try {
          const parsed = JSON.parse(selectedEnquiry.remarks);
          parsed.notes = statusForm.remarks;
          remarksPayload = JSON.stringify(parsed);
        } catch (e) {}
      }

      await apiClient.put(`/enquiries/${statusForm.id}`, {
        status: statusForm.status,
        follow_up_date: statusForm.follow_up_date || undefined,
        remarks: remarksPayload
      });

      setIsStatusModalOpen(false);
      fetchData();
      alert(`Enquiry status updated to "${STATUS_COLORS[statusForm.status]?.label || statusForm.status}" with remarks!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update enquiry status');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.fatherName || !form.fatherPhone) {
      alert("Child's First Name, Father's Name, and Father's Contact Phone are required!");
      return;
    }
    setSaving(true);
    try {
      const childName = `${form.firstName} ${form.lastName}`.trim();
      const parentName = form.fatherName.trim();
      const remarksData = JSON.stringify({
        fatherName: form.fatherName,
        fatherOccupation: form.fatherOccupation,
        fatherPhone: form.fatherPhone,
        motherName: form.motherName,
        motherOccupation: form.motherOccupation,
        motherPhone: form.motherPhone,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        bloodGroup: form.bloodGroup,
        sourceOfEnquiry: form.sourceOfEnquiry,
        enrolmentCentre: form.enrolmentCentre,
        parentAddress: form.parentAddress,
        emergencyContactPhone: form.emergencyContactPhone,
        notes: form.notes
      });

      await apiClient.post('/enquiries', {
        child_name: childName,
        parent_name: parentName,
        parent_phone: form.fatherPhone,
        parent_email: form.parentEmail,
        class_interested: form.grade,
        lead_source: form.sourceOfEnquiry,
        status: form.status,
        follow_up_date: form.followUpDate || undefined,
        remarks: remarksData
      });

      setIsAddModalOpen(false);
      fetchData();
      alert('Admission Enquiry saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add enquiry');
    } finally {
      setSaving(false);
    }
  };

  const fetchNextReceiptNo = async (branchName?: string) => {
    try {
      const bName = branchName || convertForm.enrolmentCentre || 'Chinchwad Branch';
      const recRes = await apiClient.get(`/fees/next-receipt-number?branch_name=${encodeURIComponent(bName)}`);
      if (recRes.data?.receipt_no) {
        setConvertForm(prev => ({ ...prev, receiptNo: recRes.data.receipt_no }));
        return recRes.data.receipt_no;
      }
    } catch (e) {
      console.warn('Failed to fetch next receipt number:', e);
    }
    return null;
  };

  const openConvertModal = async (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    const parsed = parseEnquiryRemarks(enquiry.remarks);
    
    const targetBranch = (enquiry as any).school_name || parsed.enrolmentCentre || 'Chinchwad - Sambhajinagar';
    let branchCode = 'CHI';
    const lowerB = targetBranch.toLowerCase();
    if (lowerB.includes('chinchwad')) branchCode = 'CHI';
    else if (lowerB.includes('chikhali')) branchCode = 'CHK';
    else if (lowerB.includes('dudulgaon')) branchCode = 'DUD';
    else {
      branchCode = targetBranch.trim().toUpperCase().replace(/BRANCH/gi, '').trim().slice(0, 3) || 'CHI';
    }

    const currentYear = new Date().getFullYear();
    const prefix = `REC-${branchCode}-${currentYear}-`;

    // Auto generate Admission Number & Receipt Number
    let autoAdmNo = 'ADM-001';
    let autoRecNo = `${prefix}001`;

    try {
      const targetGrade = enquiry.class_interested || 'Nursery';
      const admRes = await apiClient.get(`/admin/next-admission-number?grade=${encodeURIComponent(targetGrade)}`);
      if (admRes.data?.nextNumber) autoAdmNo = admRes.data.nextNumber;
      
      const recRes = await apiClient.get(`/fees/next-receipt-number?branch_name=${encodeURIComponent(targetBranch)}`);
      if (recRes.data?.receipt_no) {
        autoRecNo = recRes.data.receipt_no;
      }
    } catch (e) {
      console.warn('Auto prefix fallback', e);
    }

    let latestStructures = dbFeeStructures;
    try {
      const fsRes = await apiClient.get('/fee-structures', {
        params: (enquiry as any).school_id ? { school_id: (enquiry as any).school_id } : undefined
      });
      if (fsRes.data?.data && Array.isArray(fsRes.data.data)) {
        latestStructures = fsRes.data.data;
        setDbFeeStructures(latestStructures);
      }
    } catch (e) {
      console.warn('Fee structures fetch note', e);
    }

    const nameParts = (enquiry.child_name || '').split(' ');
    const feeInfo = getClassFeeDetails(enquiry.class_interested || 'Nursery', latestStructures);

    setConvertForm({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      admissionNumber: autoAdmNo,
      grade: enquiry.class_interested || 'Nursery',
      gender: parsed.gender || 'male',
      dateOfBirth: parsed.dateOfBirth || '',
      bloodGroup: parsed.bloodGroup || '',

      fatherName: parsed.fatherName || enquiry.parent_name || '',
      fatherOccupation: parsed.fatherOccupation || '',
      fatherPhone: parsed.fatherPhone || enquiry.parent_phone || '',

      motherName: parsed.motherName || '',
      motherOccupation: parsed.motherOccupation || '',
      motherPhone: parsed.motherPhone || '',

      parentEmail: enquiry.parent_email || '',
      parentAddress: parsed.parentAddress || '',
      emergencyContactPhone: parsed.emergencyContactPhone || enquiry.parent_phone || '',

      sourceOfEnquiry: enquiry.lead_source || parsed.sourceOfEnquiry || 'Friends',
      enrolmentCentre: parsed.enrolmentCentre || 'Chinchwad - Sambhajinagar',

      totalFee: feeInfo.total > 0 ? String(feeInfo.total) : '',
      admissionFee: feeInfo.admission > 0 ? String(feeInfo.admission) : '',
      discountAmount: '',
      discountReason: '',
      amountPaid: '',
      receiptNo: autoRecNo,
      dateOfEnrolment: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      identityCardNo: '',
      chequeDetails: '',
      balanceAmount: feeInfo.total > 0 ? String(feeInfo.total) : '',
      dueDates: '',
      admissionKit: 'Given',
      followUpNotes: parsed.notes || ''
    });

    setIsConvertModalOpen(true);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setSaving(true);
    try {
      // 1. Create Student Admission
      await apiClient.post('/admin/family', {
        parentName: convertForm.fatherName || 'Parent',
        email: convertForm.parentEmail || `parent_${Date.now()}@eduneev.com`,
        contactNumber: convertForm.fatherPhone || '0000000000',
        alternativeMobile: convertForm.motherPhone || '',
        address: convertForm.parentAddress,
        children: [
          {
            firstName: convertForm.firstName,
            lastName: convertForm.lastName,
            admissionNumber: convertForm.admissionNumber,
            grade: convertForm.grade,
            gender: convertForm.gender,
            dateOfBirth: convertForm.dateOfBirth,
            bloodGroup: convertForm.bloodGroup,
            emergencyContactName: convertForm.fatherName,
            emergencyContactPhone: convertForm.emergencyContactPhone || convertForm.fatherPhone,
            medicalNotes: {
              fatherName: convertForm.fatherName,
              fatherOccupation: convertForm.fatherOccupation,
              fatherPhone: convertForm.fatherPhone,
              motherName: convertForm.motherName,
              motherOccupation: convertForm.motherOccupation,
              motherPhone: convertForm.motherPhone,
              sourceOfEnquiry: convertForm.sourceOfEnquiry,
              enrolmentCentre: convertForm.enrolmentCentre,
              totalFee: convertForm.totalFee,
              discountAmount: convertForm.discountAmount || '0',
              discountReason: convertForm.discountReason || '',
              netFee: String(Math.max(0, (parseFloat(convertForm.totalFee) || 0) - (parseFloat(convertForm.discountAmount) || 0))),
              amountPaid: convertForm.amountPaid,
              receiptNo: convertForm.receiptNo,
              dateOfEnrolment: convertForm.dateOfEnrolment,
              paymentMode: convertForm.paymentMode,
              identityCardNo: convertForm.identityCardNo,
              chequeDetails: convertForm.chequeDetails,
              balanceAmount: convertForm.balanceAmount,
              dueDates: convertForm.dueDates,
              admissionKit: convertForm.admissionKit,
              followUpNotes: convertForm.followUpNotes
            }
          }
        ]
      });

      // 2. Update Enquiry status to enrolled
      await apiClient.put(`/enquiries/${selectedEnquiry.id}`, {
        status: 'enrolled'
      });

      setIsConvertModalOpen(false);
      fetchData();
      alert(`🎉 Enquiry successfully converted to official Student Admission (${convertForm.admissionNumber})!`);
    } catch (err: any) {
      console.error('Failed to convert enquiry', err);
      alert(err.response?.data?.error || 'Failed to convert enquiry to admission');
    } finally {
      setSaving(false);
    }
  };

  const openDetailsModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the enquiry for ${name}?`)) {
      try {
        await apiClient.delete(`/enquiries/${id}`);
        fetchData();
      } catch (err) {
        alert('Failed to delete enquiry');
      }
    }
  };

  // Dynamic Real-time Calculations directly from loaded enquiries
  const totalLeads = (stats?.total && parseInt(stats.total) > 0) ? parseInt(stats.total) : enquiries.length;
  
  const pendingContactedCount = enquiries.filter(e => {
    const s = (e.status || '').toLowerCase();
    return ['pending', 'new', 'contacted', 'interested'].includes(s);
  }).length;
  
  const enrolledCount = enquiries.filter(e => {
    const s = (e.status || '').toLowerCase();
    return s === 'enrolled';
  }).length;

  const calculatedConversionRate = totalLeads > 0 
    ? ((enrolledCount / totalLeads) * 100).toFixed(1) 
    : (convStats?.conversion_rate_percentage || '0.0');

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <header className="header" style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ 
                background: 'white', 
                color: 'var(--text-main)', 
                border: '1px solid #E2E8F0', 
                width: '38px',
                height: '38px',
                borderRadius: '50%', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }} 
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="welcome-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Admission Enquiries
              </h1>
              <p className="date-text" style={{ fontSize: '0.875rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Track, manage, update status & convert admission leads to active students
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleOpenQrModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#4F46E5',
                padding: '0.7rem 1.25rem',
                borderRadius: '0.85rem',
                fontWeight: 800,
                fontSize: '0.925rem',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                border: 'none',
                cursor: 'pointer',
                color: '#FFFFFF'
              }}
              title="View, Print & Download QR Code for parents to submit online enquiries"
            >
              <QrCode size={19} /> Enquiry Form QR Code 📲
            </button>
            <button 
              className="btn-primary" 
              onClick={openAddModal}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: '#0A66C2', 
                padding: '0.7rem 1.4rem', 
                borderRadius: '0.85rem', 
                fontWeight: 700,
                fontSize: '0.925rem',
                boxShadow: '0 4px 14px rgba(10, 102, 194, 0.25)',
                border: 'none',
                cursor: 'pointer',
                color: '#FFFFFF'
              }}
            >
              <Plus size={19} /> New Admission Enquiry
            </button>
          </div>
        </header>

        {/* Dynamic KPI Summary Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
              <UserPlus size={24} />
            </div>
            <div className="stat-info">
              <h3>Total Leads</h3>
              <p>{totalLeads}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Phone size={24} />
            </div>
            <div className="stat-info">
              <h3>Pending / Follow-up</h3>
              <p>{pendingContactedCount}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
              <CheckCircle size={24} />
            </div>
            <div className="stat-info">
              <h3>Enrolled / Converted</h3>
              <p>{enrolledCount}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <h3>Conversion Rate</h3>
              <p style={{ color: '#059669' }}>{calculatedConversionRate}%</p>
            </div>
          </div>
        </div>

        <div className="glass-card table-container">
          <div className="table-header flex-between" style={{ marginBottom: '1.25rem' }}>
            <div className="search-box" style={{ flex: 1, maxWidth: '380px' }}>
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search by child, parent, phone, class..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.25rem', flexWrap: 'wrap' }}>
              {STATUS_LIST.map(s => {
                const count = s === 'all' 
                  ? enquiries.length 
                  : enquiries.filter(e => (e.status || '').toLowerCase() === s || (s === 'pending' && (e.status || '').toLowerCase() === 'new')).length;
                const isSelected = filterStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className="role-badge"
                    style={{
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      border: isSelected ? '1px solid transparent' : '1px solid #E2E8F0',
                      fontWeight: 700,
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      background: isSelected ? (STATUS_COLORS[s]?.bg || '#0A66C2') : '#FFFFFF',
                      color: isSelected ? (STATUS_COLORS[s]?.text || '#FFFFFF') : '#64748B',
                      boxShadow: isSelected ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem'
                    }}
                  >
                    <span>{s === 'all' ? 'All Leads' : STATUS_COLORS[s]?.label || s}</span>
                    <span style={{
                      fontSize: '0.72rem',
                      background: isSelected ? 'rgba(0,0,0,0.1)' : '#F1F5F9',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      fontWeight: 800
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="flex-center py-8" style={{ color: '#64748B', gap: '0.5rem' }}>
              Loading admission enquiries...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Child / Parent Name</th>
                    <th>Contact Info</th>
                    <th>Class / Source</th>
                    <th>Date & Follow-up</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.length > 0 ? (
                    filteredEnquiries.map((enq) => (
                      <tr key={enq.id}>
                        <td>
                          <div className="font-bold text-main" style={{ fontSize: '0.95rem' }}>{enq.child_name}</div>
                          <div className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                            <User size={13} /> Parent: {enq.parent_name}
                          </div>
                        </td>
                        <td>
                          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <Phone size={14} className="text-muted" /> 
                            <a href={`tel:${enq.parent_phone}`} style={{ color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }} title="Call Parent">
                              {enq.parent_phone}
                            </a>
                          </div>
                          {enq.parent_email && (
                            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                              <Mail size={14} className="text-muted" /> 
                              <a href={`mailto:${enq.parent_email}`} style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.85rem' }}>
                                {enq.parent_email}
                              </a>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{normalizeGradeName(enq.class_interested) || 'N/A'}</div>
                          <div className="role-badge" style={{ display: 'inline-block', marginTop: '0.25rem', textTransform: 'capitalize', fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                            {enq.lead_source}
                          </div>
                        </td>
                        <td>
                          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.4rem', marginBottom: '0.2rem', fontSize: '0.85rem' }}>
                            <Calendar size={14} className="text-muted" /> 
                            {new Date(enq.created_at).toLocaleDateString()}
                          </div>
                          {enq.follow_up_date && (
                            <div style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: new Date(enq.follow_up_date) < new Date() && (enq.status || '').toLowerCase() !== 'enrolled' ? '#DC2626' : '#D97706',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              background: new Date(enq.follow_up_date) < new Date() && (enq.status || '').toLowerCase() !== 'enrolled' ? '#FEE2E2' : '#FEF3C7',
                              padding: '2px 7px',
                              borderRadius: '6px'
                            }}>
                              Follow-up: {new Date(enq.follow_up_date).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {getStatusBadge(enq.status, enq)}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button 
                              className="icon-btn" 
                              style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }} 
                              title="Edit Enquiry Details" 
                              onClick={() => openEditModal(enq)}
                            >
                              <Edit3 size={15} />
                            </button>
                            {enq.status?.toLowerCase() !== 'enrolled' ? (
                              <button 
                                className="btn-primary" 
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#0D9488', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderRadius: '0.65rem' }}
                                onClick={() => openConvertModal(enq)}
                                title="Convert to Official Student Admission"
                              >
                                <GraduationCap size={15} /> Convert
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, background: '#D1FAE5', padding: '0.3rem 0.6rem', borderRadius: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle size={13} /> Enrolled
                              </span>
                            )}
                            <button 
                              className="icon-btn" 
                              style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }} 
                              title="View Details" 
                              onClick={() => openDetailsModal(enq)}
                            >
                              <Eye size={15} />
                            </button>
                            <button 
                              onClick={() => handleDelete(enq.id, enq.child_name)} 
                              className="icon-btn text-red"
                              title="Delete Enquiry"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted">
                        No admission enquiries found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Update Status & Remarks Modal */}
        {isStatusModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '520px', width: '90%' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0F172A' }}>Update Status & Remarks</h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Enquiry for {statusForm.child_name}</span>
                </div>
                <button className="icon-btn" onClick={() => setIsStatusModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateStatusSubmit} style={{ padding: '1rem 0' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Select Status</label>
                  <select 
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', fontWeight: 700, background: STATUS_COLORS[statusForm.status]?.bg || 'white', color: STATUS_COLORS[statusForm.status]?.text || '#0F172A' }}
                  >
                    <option value="pending">🟡 Pending</option>
                    <option value="interested">🟢 Interested</option>
                    <option value="not_interested">🔴 Not Interested</option>
                    <option value="contacted">🔵 Contacted</option>
                    <option value="visited">🟣 Visited School</option>
                    <option value="enrolled">✅ Enrolled / Fixed</option>
                    <option value="lost">⚪ Lost</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Next Follow-up Date</label>
                  <input 
                    type="date" 
                    value={statusForm.follow_up_date}
                    onChange={(e) => setStatusForm({ ...statusForm, follow_up_date: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Remarks / Reason / Discussion Notes</label>
                  <textarea 
                    rows={3} 
                    value={statusForm.remarks}
                    onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })}
                    className="input-field"
                    placeholder="Enter reason or call feedback (e.g. Parent requested callback next week / Visiting school on Monday)..."
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsStatusModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ background: '#4F46E5' }}>
                    {saving ? 'Updating...' : 'Save Status & Remarks'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* New Enquiry Modal (Matching Admission Form Fields) */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '850px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0F172A' }}>EduNeev Kids - New Admission Enquiry</h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Official Admission Enquiry Form</span>
                </div>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddEnquiry} className="modal-form">
                {/* 1. Child Info */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="#0D9488" /> 1. Child's Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Enrol / Program Interested <span style={{color: 'red'}}>*</span></label>
                      <select name="grade" value={form.grade} onChange={handleInputChange} className="input-field">
                        {availableClasses.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select name="gender" value={form.gender} onChange={handleInputChange} className="input-field">
                        <option value="male">Male (M)</option>
                        <option value="female">Female (F)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Child's First Name <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="firstName" value={form.firstName} onChange={handleInputChange} required className="input-field" placeholder="First Name" />
                    </div>
                    <div className="form-group">
                      <label>Child's Last Name</label>
                      <input type="text" name="lastName" value={form.lastName} onChange={handleInputChange} className="input-field" placeholder="Last Name" />
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleInputChange} className="input-field" />
                    </div>
                  </div>
                </div>

                {/* 2. Parents Info */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} color="#4F46E5" /> 2. Parents Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Father's Name <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="fatherName" value={form.fatherName} onChange={handleInputChange} required className="input-field" placeholder="Father's Full Name" />
                    </div>
                    <div className="form-group">
                      <label>Father's Occupation</label>
                      <input type="text" name="fatherOccupation" value={form.fatherOccupation} onChange={handleInputChange} className="input-field" placeholder="Service / Business" />
                    </div>
                    <div className="form-group">
                      <label>Father's Contact No. <span style={{color: 'red'}}>*</span></label>
                      <input type="tel" name="fatherPhone" value={form.fatherPhone} onChange={handleInputChange} required className="input-field" placeholder="10-digit Mobile" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Mother's Name</label>
                      <input type="text" name="motherName" value={form.motherName} onChange={handleInputChange} className="input-field" placeholder="Mother's Full Name" />
                    </div>
                    <div className="form-group">
                      <label>Mother's Occupation</label>
                      <input type="text" name="motherOccupation" value={form.motherOccupation} onChange={handleInputChange} className="input-field" placeholder="Homemaker / Job" />
                    </div>
                    <div className="form-group">
                      <label>Mother's Contact No.</label>
                      <input type="tel" name="motherPhone" value={form.motherPhone} onChange={handleInputChange} className="input-field" placeholder="10-digit Mobile" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Parents Email IDs</label>
                      <input type="email" name="parentEmail" value={form.parentEmail} onChange={handleInputChange} className="input-field" placeholder="email@example.com" />
                    </div>
                    <div className="form-group">
                      <label>Emergency Contact No.</label>
                      <input type="tel" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleInputChange} className="input-field" placeholder="Emergency Mobile" />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Residential Address</label>
                    <textarea name="parentAddress" value={form.parentAddress} onChange={handleInputChange} className="input-field" rows={2} placeholder="Full Address" style={{ resize: 'vertical' }}></textarea>
                  </div>
                </div>

                {/* 3. Referral Source & Centre */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Megaphone size={18} color="#EA580C" /> 3. Referral Source & Centre
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Source of Enquiry</label>
                      <select name="sourceOfEnquiry" value={form.sourceOfEnquiry} onChange={handleInputChange} className="input-field">
                        {REFERRAL_SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Enrolment Centre</label>
                      <input type="text" name="enrolmentCentre" value={form.enrolmentCentre} onChange={handleInputChange} className="input-field" placeholder="Chinchwad - Sambhajinagar" />
                    </div>
                  </div>
                </div>

                {/* 4. Follow-up & Status */}
                <div style={{ background: '#F1F5F9', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #CBD5E1' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#334155', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} color="#475569" /> 4. Follow-up & Status
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Enquiry Status</label>
                      <select name="status" value={form.status} onChange={handleInputChange} className="input-field" style={{ background: 'white' }}>
                        <option value="pending">🟡 Pending</option>
                        <option value="interested">🟢 Interested</option>
                        <option value="not_interested">🔴 Not Interested</option>
                        <option value="contacted">🔵 Contacted</option>
                        <option value="visited">🟣 Visited School</option>
                        <option value="enrolled">✅ Enrolled / Fixed</option>
                        <option value="lost">⚪ Lost</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Next Follow-up Date</label>
                      <input type="date" name="followUpDate" value={form.followUpDate} onChange={handleInputChange} className="input-field" style={{ background: 'white' }} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Remarks / Notes</label>
                    <textarea name="notes" value={form.notes} onChange={handleInputChange} className="input-field" rows={2} placeholder="Enquiry discussion notes..." style={{ resize: 'vertical', background: 'white' }}></textarea>
                  </div>
                </div>

                <div className="modal-actions" style={{ position: 'sticky', bottom: 0, background: 'white', padding: '1rem 0', borderTop: '1px solid #E2E8F0', marginTop: 'auto' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Enquiry Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Enquiry Modal */}
        {isEditModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '850px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Edit3 size={22} color="#0A66C2" /> Edit Admission Enquiry
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Updating record for {editForm.firstName} {editForm.lastName}
                  </span>
                </div>
                <button className="icon-btn" onClick={() => setIsEditModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="modal-form">
                {/* 1. Child Info */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="#0D9488" /> 1. Child's Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Enrol / Program Interested <span style={{color: 'red'}}>*</span></label>
                      <select name="grade" value={editForm.grade} onChange={handleEditInputChange} className="input-field">
                        {availableClasses.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select name="gender" value={editForm.gender} onChange={handleEditInputChange} className="input-field">
                        <option value="male">Male (M)</option>
                        <option value="female">Female (F)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Child's First Name <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="firstName" value={editForm.firstName} onChange={handleEditInputChange} required className="input-field" placeholder="First Name" />
                    </div>
                    <div className="form-group">
                      <label>Child's Last Name</label>
                      <input type="text" name="lastName" value={editForm.lastName} onChange={handleEditInputChange} className="input-field" placeholder="Last Name" />
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={editForm.dateOfBirth} onChange={handleEditInputChange} className="input-field" />
                    </div>
                  </div>
                </div>

                {/* 2. Parents Info */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} color="#4F46E5" /> 2. Parents Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Father's Name <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="fatherName" value={editForm.fatherName} onChange={handleEditInputChange} required className="input-field" placeholder="Father's Full Name" />
                    </div>
                    <div className="form-group">
                      <label>Father's Occupation</label>
                      <input type="text" name="fatherOccupation" value={editForm.fatherOccupation} onChange={handleEditInputChange} className="input-field" placeholder="Service / Business" />
                    </div>
                    <div className="form-group">
                      <label>Father's Contact No. <span style={{color: 'red'}}>*</span></label>
                      <input type="tel" name="fatherPhone" value={editForm.fatherPhone} onChange={handleEditInputChange} required className="input-field" placeholder="10-digit Mobile" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Mother's Name</label>
                      <input type="text" name="motherName" value={editForm.motherName} onChange={handleEditInputChange} className="input-field" placeholder="Mother's Full Name" />
                    </div>
                    <div className="form-group">
                      <label>Mother's Occupation</label>
                      <input type="text" name="motherOccupation" value={editForm.motherOccupation} onChange={handleEditInputChange} className="input-field" placeholder="Homemaker / Job" />
                    </div>
                    <div className="form-group">
                      <label>Mother's Contact No.</label>
                      <input type="tel" name="motherPhone" value={editForm.motherPhone} onChange={handleEditInputChange} className="input-field" placeholder="10-digit Mobile" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Parents Email IDs</label>
                      <input type="email" name="parentEmail" value={editForm.parentEmail} onChange={handleEditInputChange} className="input-field" placeholder="email@example.com" />
                    </div>
                    <div className="form-group">
                      <label>Emergency Contact No.</label>
                      <input type="tel" name="emergencyContactPhone" value={editForm.emergencyContactPhone} onChange={handleEditInputChange} className="input-field" placeholder="Emergency Mobile" />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Residential Address</label>
                    <textarea name="parentAddress" value={editForm.parentAddress} onChange={handleEditInputChange} className="input-field" rows={2} placeholder="Full Address" style={{ resize: 'vertical' }}></textarea>
                  </div>
                </div>

                {/* 3. Referral Source & Centre */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Megaphone size={18} color="#EA580C" /> 3. Referral Source & Centre
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Source of Enquiry</label>
                      <select name="sourceOfEnquiry" value={editForm.sourceOfEnquiry} onChange={handleEditInputChange} className="input-field">
                        {REFERRAL_SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Enrolment Centre</label>
                      <input type="text" name="enrolmentCentre" value={editForm.enrolmentCentre} onChange={handleEditInputChange} className="input-field" placeholder="Chinchwad - Sambhajinagar" />
                    </div>
                  </div>
                </div>

                {/* 4. Follow-up & Status */}
                <div style={{ background: '#F1F5F9', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #CBD5E1' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#334155', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} color="#475569" /> 4. Follow-up & Status
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Enquiry Status</label>
                      <select 
                        name="status" 
                        value={editForm.status} 
                        onChange={handleEditInputChange} 
                        className="input-field" 
                        style={{ background: 'white', fontWeight: 700 }}
                      >
                        <option value="pending">🟡 Pending</option>
                        <option value="interested">🟢 Interested</option>
                        <option value="not_interested">🔴 Not Interested</option>
                        <option value="contacted">🔵 Contacted</option>
                        <option value="visited">🟣 Visited School</option>
                        <option value="enrolled">✅ Enrolled / Fixed</option>
                        <option value="lost">⚪ Lost</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Next Follow-up Date</label>
                      <input type="date" name="followUpDate" value={editForm.followUpDate} onChange={handleEditInputChange} className="input-field" style={{ background: 'white' }} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Remarks / Notes</label>
                    <textarea name="notes" value={editForm.notes} onChange={handleEditInputChange} className="input-field" rows={2} placeholder="Enquiry discussion notes..." style={{ resize: 'vertical', background: 'white' }}></textarea>
                  </div>
                </div>

                <div className="modal-actions" style={{ position: 'sticky', bottom: 0, background: 'white', padding: '1rem 0', borderTop: '1px solid #E2E8F0', marginTop: 'auto' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ background: '#0A66C2' }}>
                    {saving ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Convert Enquiry to Student Admission Modal */}
        {isConvertModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '850px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0D9488', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={24} /> Convert Enquiry to Official Student Admission
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Auto-populated from Enquiry Record</span>
                </div>
                <button className="icon-btn" onClick={() => setIsConvertModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleConvertSubmit} className="modal-form">
                {/* 1. Child Info */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="#0D9488" /> 1. Child's Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Enrol / Program For <span style={{color: 'red'}}>*</span></label>
                      <select name="grade" value={convertForm.grade} onChange={handleConvertInputChange} className="input-field">
                        {availableClasses.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Admission Number <span style={{color: 'red'}}>*</span></span>
                        <span style={{ fontSize: '0.75rem', color: '#0D9488', fontWeight: 700, background: '#CCFBF1', padding: '2px 8px', borderRadius: '12px' }}>
                          ⚡ Auto Prefix
                        </span>
                      </label>
                      <input type="text" name="admissionNumber" value={convertForm.admissionNumber} onChange={handleConvertInputChange} required className="input-field" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Child's First Name <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="firstName" value={convertForm.firstName} onChange={handleConvertInputChange} required className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Child's Last Name <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="lastName" value={convertForm.lastName} onChange={handleConvertInputChange} required className="input-field" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Gender</label>
                      <select name="gender" value={convertForm.gender} onChange={handleConvertInputChange} className="input-field">
                        <option value="male">Male (M)</option>
                        <option value="female">Female (F)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={convertForm.dateOfBirth} onChange={handleConvertInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Blood Group</label>
                      <select name="bloodGroup" value={convertForm.bloodGroup} onChange={handleConvertInputChange} className="input-field">
                        <option value="">Select...</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Parents Info */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} color="#4F46E5" /> 2. Parents Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Father's Name <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="fatherName" value={convertForm.fatherName} onChange={handleConvertInputChange} required className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Father's Occupation</label>
                      <input type="text" name="fatherOccupation" value={convertForm.fatherOccupation} onChange={handleConvertInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Father's Contact No. <span style={{color: 'red'}}>*</span></label>
                      <input type="tel" name="fatherPhone" value={convertForm.fatherPhone} onChange={handleConvertInputChange} required className="input-field" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Mother's Name</label>
                      <input type="text" name="motherName" value={convertForm.motherName} onChange={handleConvertInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Mother's Occupation</label>
                      <input type="text" name="motherOccupation" value={convertForm.motherOccupation} onChange={handleConvertInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Mother's Contact No.</label>
                      <input type="tel" name="motherPhone" value={convertForm.motherPhone} onChange={handleConvertInputChange} className="input-field" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Parents Email IDs</label>
                      <input type="email" name="parentEmail" value={convertForm.parentEmail} onChange={handleConvertInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Emergency Contact No.</label>
                      <input type="tel" name="emergencyContactPhone" value={convertForm.emergencyContactPhone} onChange={handleConvertInputChange} className="input-field" />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Residential Address</label>
                    <textarea name="parentAddress" value={convertForm.parentAddress} onChange={handleConvertInputChange} className="input-field" rows={2} style={{ resize: 'vertical' }}></textarea>
                  </div>
                </div>

                {/* 3. Referral Source & Centre */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Megaphone size={18} color="#EA580C" /> 3. Referral Source & Centre
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Source of Enquiry</label>
                      <select name="sourceOfEnquiry" value={convertForm.sourceOfEnquiry} onChange={handleConvertInputChange} className="input-field">
                        {REFERRAL_SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Enrolment Centre</label>
                      <input type="text" name="enrolmentCentre" value={convertForm.enrolmentCentre} onChange={handleConvertInputChange} className="input-field" />
                    </div>
                  </div>
                </div>

                {/* 4. Office Use Only (Fee & Admission Receipt) */}
                <div style={{ background: '#EEF2FF', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #C7D2FE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', color: '#4F46E5', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <DollarSign size={18} color="#4F46E5" /> 4. FOR OFFICE USE ONLY (Fee & Receipt)
                    </h3>
                    <div style={{ background: 'white', padding: '4px 12px', borderRadius: '8px', border: '1px solid #C7D2FE', fontSize: '0.75rem', fontWeight: 700, color: '#3730A3', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🎓 {convertForm.grade} Structure (from DB):</span>
                      <span style={{ color: '#1E40AF', fontWeight: 800 }}>
                        Total: {convertForm.totalFee ? `₹${Number(convertForm.totalFee).toLocaleString('en-IN')}` : '₹0'}
                      </span>
                      <span>•</span>
                      <span style={{ color: '#059669', fontWeight: 800 }}>
                        Admission Split: {convertForm.admissionFee ? `₹${Number(convertForm.admissionFee).toLocaleString('en-IN')}` : '₹0'}
                      </span>
                    </div>
                  </div>

                  {/* Fee & Concession Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Total Course Fee (₹)</label>
                      <input 
                        type="number" 
                        name="totalFee" 
                        value={convertForm.totalFee} 
                        onChange={handleConvertInputChange} 
                        className="input-field" 
                        placeholder="Fee from DB" 
                        style={{ background: 'white', fontWeight: 700 }} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Discount (₹)</span>
                        <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>Concession</span>
                      </label>
                      <input 
                        type="number" 
                        name="discountAmount" 
                        value={convertForm.discountAmount} 
                        onChange={handleConvertInputChange} 
                        className="input-field" 
                        placeholder="0" 
                        style={{ background: 'white', color: '#059669', fontWeight: 700, borderColor: convertForm.discountAmount ? '#86EFAC' : undefined }} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Discount Reason</label>
                      <select 
                        name="discountReason" 
                        value={convertForm.discountReason} 
                        onChange={handleConvertInputChange} 
                        className="input-field" 
                        style={{ background: 'white' }}
                      >
                        <option value="">-- No Discount --</option>
                        <option value="Early Bird Concession">🐣 Early Bird Concession</option>
                        <option value="Sibling Concession">👨‍👩‍👧 Sibling Concession</option>
                        <option value="Staff Child Concession">🏫 Staff Child Concession</option>
                        <option value="Management Discretion">⭐ Management Discretion</option>
                        <option value="Referral Concession">🤝 Referral Concession</option>
                        <option value="Other">Other Concession</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Net Payable Fee (₹)</label>
                      <div style={{ padding: '0.55rem 0.85rem', background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '0.5rem', fontWeight: 900, color: '#166534', fontSize: '1rem', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                        ₹ {Math.max(0, (parseFloat(convertForm.totalFee) || 0) - (parseFloat(convertForm.discountAmount) || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Payment & Receipt Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '1rem' }}>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ margin: 0 }}>Amount Paid Now (₹)</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const paidVal = convertForm.admissionFee || '0';
                              const tot = parseFloat(convertForm.totalFee) || 0;
                              const disc = parseFloat(convertForm.discountAmount) || 0;
                              const net = Math.max(0, tot - disc);
                              setConvertForm(p => ({
                                ...p,
                                amountPaid: paidVal,
                                balanceAmount: String(Math.max(0, net - (parseFloat(paidVal) || 0)))
                              }));
                            }}
                            title="Fill with Admission Split fee from DB"
                            style={{ fontSize: '0.65rem', background: '#E0E7FF', color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: '4px', padding: '1px 5px', cursor: 'pointer', fontWeight: 700 }}
                          >
                            Part 1 {convertForm.admissionFee ? `(₹${Number(convertForm.admissionFee).toLocaleString('en-IN')})` : ''}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const tot = parseFloat(convertForm.totalFee) || 0;
                              const disc = parseFloat(convertForm.discountAmount) || 0;
                              const net = Math.max(0, tot - disc);
                              setConvertForm(p => ({
                                ...p,
                                amountPaid: String(net),
                                balanceAmount: '0'
                              }));
                            }}
                            title="Fill with Net Payable fee after discount"
                            style={{ fontSize: '0.65rem', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: '4px', padding: '1px 5px', cursor: 'pointer', fontWeight: 700 }}
                          >
                            Full Net Fee
                          </button>
                        </div>
                      </div>
                      <input 
                        type="number" 
                        name="amountPaid" 
                        value={convertForm.amountPaid} 
                        onChange={handleConvertInputChange} 
                        className="input-field" 
                        placeholder="0" 
                        style={{ background: 'white', fontWeight: 700 }} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Balance Remaining (₹)</label>
                      <input 
                        type="number" 
                        name="balanceAmount" 
                        value={convertForm.balanceAmount} 
                        onChange={handleConvertInputChange} 
                        className="input-field" 
                        style={{ background: 'white', color: '#DC2626', fontWeight: 700 }} 
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Receipt No.</span>
                        <button
                          type="button"
                          onClick={() => fetchNextReceiptNo(convertForm.enrolmentCentre)}
                          title="Click to fetch latest sequential receipt number from ledger"
                          style={{
                            fontSize: '0.72rem',
                            color: '#4F46E5',
                            fontWeight: 700,
                            background: '#E0E7FF',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            border: '1px solid #C7D2FE',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          ⚡ Auto-Format
                        </button>
                      </label>
                      <input type="text" name="receiptNo" value={convertForm.receiptNo} onChange={handleConvertInputChange} className="input-field" style={{ background: 'white', fontWeight: 700 }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Date of Enrolment</label>
                      <input type="date" name="dateOfEnrolment" value={convertForm.dateOfEnrolment} onChange={handleConvertInputChange} className="input-field" style={{ background: 'white' }} />
                    </div>
                    <div className="form-group">
                      <label>Mode of Payment</label>
                      <select name="paymentMode" value={convertForm.paymentMode} onChange={handleConvertInputChange} className="input-field" style={{ background: 'white' }}>
                        <option value="Cash">Cash</option>
                        <option value="Online / UPI">Online / UPI</option>
                        <option value="DD">DD</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Identity Card No.</label>
                      <input type="text" name="identityCardNo" value={convertForm.identityCardNo} onChange={handleConvertInputChange} className="input-field" style={{ background: 'white' }} />
                    </div>
                    <div className="form-group">
                      <label>DD / Cheque Details</label>
                      <input type="text" name="chequeDetails" value={convertForm.chequeDetails} onChange={handleConvertInputChange} className="input-field" style={{ background: 'white' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Admission Kit</label>
                      <select name="admissionKit" value={convertForm.admissionKit} onChange={handleConvertInputChange} className="input-field" style={{ background: 'white' }}>
                        <option value="Given">Given</option>
                        <option value="To be given">To be given</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Follow-up Notes / Remarks</label>
                      <textarea name="followUpNotes" value={convertForm.followUpNotes} onChange={handleConvertInputChange} className="input-field" rows={1} style={{ background: 'white', resize: 'vertical' }}></textarea>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Follow-up Notes / Remarks</label>
                    <textarea name="followUpNotes" value={convertForm.followUpNotes} onChange={handleConvertInputChange} className="input-field" rows={2} style={{ resize: 'vertical', background: 'white' }}></textarea>
                  </div>
                </div>

                <div className="modal-actions" style={{ position: 'sticky', bottom: 0, background: 'white', padding: '1rem 0', borderTop: '1px solid #E2E8F0', marginTop: 'auto' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsConvertModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ background: '#0D9488', padding: '0.65rem 1.75rem' }}>
                    {saving ? 'Converting...' : 'Confirm & Convert to Official Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Enquiry Details Modal */}
        {isDetailsModalOpen && selectedEnquiry && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px', width: '90%' }}>
              <div className="modal-header">
                <h2>Admission Enquiry Details</h2>
                <button className="icon-btn" onClick={() => setIsDetailsModalOpen(false)}><X size={20} /></button>
              </div>
              <div style={{ padding: '1.25rem 0' }}>
                <div style={{ background: '#FAFAFA', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                    <div><strong>Child Name:</strong> <span style={{ color: '#0F172A', fontWeight: 700 }}>{selectedEnquiry.child_name}</span></div>
                    <div><strong>Class Interested:</strong> <span style={{ color: '#4F46E5', fontWeight: 700 }}>{selectedEnquiry.class_interested || 'N/A'}</span></div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedEnquiry.status)}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
                    <div><strong>Parent Name:</strong> {selectedEnquiry.parent_name}</div>
                    <div><strong>Parent Phone:</strong> {selectedEnquiry.parent_phone}</div>
                    <div><strong>Parent Email:</strong> {selectedEnquiry.parent_email || '-'}</div>
                    <div><strong>Lead Source:</strong> {selectedEnquiry.lead_source}</div>
                    <div><strong>Date Received:</strong> {new Date(selectedEnquiry.created_at).toLocaleDateString()}</div>
                    <div><strong>Follow-up Date:</strong> {selectedEnquiry.follow_up_date ? new Date(selectedEnquiry.follow_up_date).toLocaleDateString() : '-'}</div>
                  </div>

                  {selectedEnquiry.remarks && (
                    <div style={{ marginTop: '1rem', background: '#F1F5F9', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                      <strong>Remarks / Details:</strong>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#475569', whiteSpace: 'pre-line' }}>
                        {selectedEnquiry.remarks.startsWith('{') ? JSON.stringify(parseEnquiryRemarks(selectedEnquiry.remarks), null, 2) : selectedEnquiry.remarks}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => { setIsDetailsModalOpen(false); openStatusModal(selectedEnquiry); }}
                  >
                    ✏️ Edit Status & Remarks
                  </button>
                  {selectedEnquiry.status?.toLowerCase() !== 'enrolled' && (
                    <button 
                      className="btn-primary" 
                      style={{ background: '#0D9488' }}
                      onClick={() => { setIsDetailsModalOpen(false); openConvertModal(selectedEnquiry); }}
                    >
                      <GraduationCap size={16} /> Convert to Student Admission
                    </button>
                  )}
                  <button className="btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Standee & Public Enquiry Link Modal */}
        {isQrModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '460px', textAlign: 'center' }}>
              <div className="modal-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A' }}>Enquiry Form QR Code</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    Scan with any phone camera to fill online admission enquiry
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setIsQrModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ margin: '1.5rem 0' }}>
                <div style={{
                  background: '#F8FAFC',
                  border: '2px dashed #CBD5E1',
                  borderRadius: '1.25rem',
                  padding: '1.25rem',
                  display: 'inline-block',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Admission Enquiry QR Code" style={{ width: '220px', height: '220px', display: 'block', margin: '0 auto' }} />
                  ) : (
                    <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Generating QR...</div>
                  )}
                  <div style={{ marginTop: '0.75rem', fontWeight: 800, color: '#4F46E5', fontSize: '0.85rem' }}>
                    📲 EduNeev Public Form
                  </div>
                </div>

                <div style={{ marginTop: '1rem', background: '#F1F5F9', padding: '0.6rem 0.85rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    {window.location.origin}/enquiry
                  </span>
                  <button
                    onClick={handleCopyPublicUrl}
                    style={{ background: 'white', border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                  >
                    <Copy size={13} /> Copy Link
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  onClick={handleDownloadQrImage}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem', fontWeight: 800, fontSize: '0.85rem' }}
                >
                  <Download size={16} /> Download PNG
                </button>
                <button
                  onClick={handlePrintStandee}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#4F46E5', padding: '0.7rem', fontWeight: 800, fontSize: '0.85rem' }}
                >
                  <Printer size={16} /> Print Standee 🖨️
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default EnquiriesManagement;

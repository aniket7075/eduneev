import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import SmartSidebar from '../../components/SmartSidebar';
import { Search, Plus, ArrowLeft, Receipt, CheckCircle, Wallet, Users, User, LayoutList, Printer, X, FileText, Phone, Download, AlertTriangle, Bell } from 'lucide-react';
import EduneevInvoiceModal, { type EduneevInvoiceData } from '../../components/EduneevInvoiceModal';
import { formatDateToDDMMYYYY } from '../../utils/dateUtils';
import './Directory.css';

type StudentFeeSummary = {
  student_id: string;
  first_name: string;
  last_name: string;
  admission_number?: string;
  grade?: string;
  total_due: string;
  total_paid: string;
  balance: string;
  fee_status: 'PAID' | 'PARTIAL' | 'PENDING' | 'NO_FEE';
  school_name?: string;
  enrolmentCentre?: string;
  parent_name?: string;
  parent_phone?: string;
  earliest_due_date?: string;
};

type AdminSummary = {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  defaultersCount: number;
};

type PaymentReceiptData = {
  receiptNo: string;
  date: string;
  studentName: string;
  admissionNo: string;
  grade: string;
  amountPaid: number;
  paymentMode: string;
  transactionRef?: string;
  balanceRemaining: number;
  feeType?: string;
};

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

const OFFICIAL_CLASS_RATES: Record<string, {
  annual: number;
  annualAdmission: number;
  annualMay: number;
  term1Std: number;
  term1Early: number;
  term2Std: number;
  term2Early: number;
  installmentsStd: number;
  installmentsEarly: number;
  lumpSumStd: number;
  lumpSumEarly: number;
}> = {
  'Playgroup': {
    annual: 10500,
    annualAdmission: 5000,
    annualMay: 5500,
    term1Std: 9450,
    term1Early: 7090,
    term2Std: 9450,
    term2Early: 7090,
    installmentsStd: 29400,
    installmentsEarly: 24680,
    lumpSumStd: 28900,
    lumpSumEarly: 24180
  },
  'Nursery': {
    annual: 16500,
    annualAdmission: 8250,
    annualMay: 8250,
    term1Std: 14250,
    term1Early: 11115,
    term2Std: 14250,
    term2Early: 11115,
    installmentsStd: 45000,
    installmentsEarly: 38730,
    lumpSumStd: 44500,
    lumpSumEarly: 38230
  },
  'Jr KG': {
    annual: 18150,
    annualAdmission: 9075,
    annualMay: 9075,
    term1Std: 15070,
    term1Early: 11615,
    term2Std: 15070,
    term2Early: 11615,
    installmentsStd: 48290,
    installmentsEarly: 41380,
    lumpSumStd: 47790,
    lumpSumEarly: 40880
  },
  'LKG': {
    annual: 18150,
    annualAdmission: 9075,
    annualMay: 9075,
    term1Std: 15070,
    term1Early: 11615,
    term2Std: 15070,
    term2Early: 11615,
    installmentsStd: 48290,
    installmentsEarly: 41380,
    lumpSumStd: 47790,
    lumpSumEarly: 40880
  },
  'Sr KG': {
    annual: 18150,
    annualAdmission: 9075,
    annualMay: 9075,
    term1Std: 15620,
    term1Early: 12030,
    term2Std: 15620,
    term2Early: 12030,
    installmentsStd: 49390,
    installmentsEarly: 42210,
    lumpSumStd: 48890,
    lumpSumEarly: 41710
  },
  'UKG': {
    annual: 18150,
    annualAdmission: 9075,
    annualMay: 9075,
    term1Std: 15620,
    term1Early: 12030,
    term2Std: 15620,
    term2Early: 12030,
    installmentsStd: 49390,
    installmentsEarly: 42210,
    lumpSumStd: 48890,
    lumpSumEarly: 41710
  },
  'Daycare': {
    annual: 12000,
    annualAdmission: 6000,
    annualMay: 6000,
    term1Std: 12000,
    term1Early: 10000,
    term2Std: 12000,
    term2Early: 10000,
    installmentsStd: 36000,
    installmentsEarly: 32000,
    lumpSumStd: 35000,
    lumpSumEarly: 31000
  }
};

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

const getNormalizedRates = (gradeName?: string, customStructures?: any[]) => {
  const cleanG = (gradeName || 'Nursery').trim().toLowerCase();
  if (customStructures && customStructures.length > 0) {
    const matched = customStructures.find((s: any) => {
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
      const annual = parseFloat(matched.annual_fee || 0);
      const annualAdmission = parseFloat(matched.annual_admission_split || 0);
      const annualMay = parseFloat(matched.annual_may_split || 0);
      const term1Std = parseFloat(matched.term1_fee || 0);
      const term1Early = parseFloat(matched.term1_early_bird || matched.term1_fee || 0);
      const term2Std = parseFloat(matched.term2_fee || 0);
      const term2Early = parseFloat(matched.term2_early_bird || matched.term2_fee || 0);
      const installmentsStd = parseFloat(matched.total_installments || (annual + term1Std + term2Std));
      const installmentsEarly = parseFloat(matched.total_early_installments || (annual + term1Early + term2Early));
      const lumpSumStd = parseFloat(matched.lump_sum_fee || (installmentsStd - 500));
      const lumpSumEarly = parseFloat(matched.lump_sum_early_bird || (installmentsEarly - 500));

      return {
        annual,
        annualAdmission,
        annualMay,
        term1Std,
        term1Early,
        term2Std,
        term2Early,
        installmentsStd,
        installmentsEarly,
        lumpSumStd,
        lumpSumEarly
      };
    }
  }

  if (cleanG.includes('play') || cleanG.includes('pg')) return OFFICIAL_CLASS_RATES['Playgroup'];
  if (cleanG.includes('nursery')) return OFFICIAL_CLASS_RATES['Nursery'];
  if (cleanG.includes('jr') || cleanG.includes('lkg') || cleanG.includes('junior')) return OFFICIAL_CLASS_RATES['Jr KG'];
  if (cleanG.includes('sr') || cleanG.includes('ukg') || cleanG.includes('senior')) return OFFICIAL_CLASS_RATES['Sr KG'];
  if (cleanG.includes('daycare')) return OFFICIAL_CLASS_RATES['Daycare'];
  return OFFICIAL_CLASS_RATES['Nursery'];
};

const getSuggestedRate = (selectedType: string, gradeName?: string, customStructures?: any[]) => {
  const rates = getNormalizedRates(gradeName, customStructures);
  const today = new Date().toISOString().split('T')[0];

  if (selectedType.includes('Early Bird Discount Package') || selectedType.includes('Early Bird Package')) {
    return { amount: rates.installmentsEarly, dueDate: today };
  }
  if (
    selectedType.includes('Full Academic Year') || 
    selectedType.includes('Complete Installments Package') || 
    selectedType.includes('Standard Installments') || 
    selectedType.includes('Package')
  ) {
    return { amount: rates.installmentsStd, dueDate: today };
  }
  if (selectedType.includes('Lump Sum')) {
    return { amount: rates.lumpSumStd, dueDate: today };
  }
  if (selectedType.includes('Admission') || selectedType === 'Annual fees + IK + SM (Part 1 - On Admission)') {
    return { amount: rates.annualAdmission, dueDate: today };
  }
  if (selectedType.includes('5th May') || selectedType === 'Annual fees + IK + SM (Part 2 - Due 5th May)') {
    return { amount: rates.annualMay, dueDate: '2026-05-05' };
  }
  if (selectedType.includes('Full Year') || selectedType === 'Annual fees + IK + SM (Full Year)') {
    return { amount: rates.annual, dueDate: today };
  }
  if (selectedType === 'Term 1 Fee (Standard)') {
    return { amount: rates.term1Std, dueDate: '2026-06-05' };
  }
  if (selectedType.includes('Term 1 Fee (Early') || selectedType.includes('Term 1 Early')) {
    return { amount: rates.term1Early, dueDate: '2026-06-05' };
  }
  if (selectedType === 'Term 2 Fee (Standard)') {
    return { amount: rates.term2Std, dueDate: '2026-10-05' };
  }
  if (selectedType.includes('Term 2 Fee (Early') || selectedType.includes('Term 2 Early')) {
    return { amount: rates.term2Early, dueDate: '2026-10-05' };
  }
  if (selectedType.includes('Dishonor') || selectedType.includes('500')) {
    return { amount: 500, dueDate: today };
  }
  return { amount: 0, dueDate: today };
};

const FEE_TYPES = [
  'Full Academic Year (Complete Installments Package)',
  'Full Academic Year (Early Bird Discount Package)',
  'Lump Sum Fee (One-Time Upfront Payment)',
  'Annual fees + IK + SM (Part 1 - On Admission)',
  'Annual fees + IK + SM (Part 2 - Due 5th May)',
  'Annual fees + IK + SM (Full Year)',
  'Term 1 Fee (Standard)',
  'Term 1 Fee (Early Bird Upto 15th July)',
  'Term 2 Fee (Standard)',
  'Term 2 Fee (Early Bird Upto 15th July)',
  'Transport Fee',
  'Daycare Fee',
  'Uniform & Books Fee',
  'Cheque Dishonor Fine (₹500)',
  'Other'
];

const FeesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const isSuperAdmin = loggedUser?.role === 'super_admin';

  // Main Dashboard Data
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);
  const [adminStudents, setAdminStudents] = useState<StudentFeeSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const userBranch = (() => {
    if (loggedUser?.branchName) return loggedUser.branchName;
    if (loggedUser?.school_name) return loggedUser.school_name;
    const fname = `${loggedUser?.firstName || ''} ${loggedUser?.lastName || ''} ${loggedUser?.email || ''}`.toLowerCase();
    if (fname.includes('chikhali')) return 'Chikhali Branch';
    if (fname.includes('dudulgaon')) return 'Dudulgaon Branch';
    return 'Chinchwad Branch';
  })();

  const [selectedBranchFilter, setSelectedBranchFilter] = useState(() => {
    return 'Chinchwad Branch';
  });
  const [availableClasses, setAvailableClasses] = useState<string[]>(CLASS_ORDER);
  const [dbBranches, setDbBranches] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/franchise/branches').then(res => {
      if (res.data?.data) setDbBranches(res.data.data);
    }).catch(() => {});
  }, []);

  const activeBranchId = selectedBranchFilter !== 'All' 
    ? dbBranches.find(b => b.name === selectedBranchFilter)?.id 
    : undefined;

  // Assign Fee Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<'All' | 'Grade' | 'Student'>('All');
  const [targetGrade, setTargetGrade] = useState('Nursery');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [feeType, setFeeType] = useState('Tuition Fee');
  const [customFeeDescription, setCustomFeeDescription] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeDueDate, setFeeDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [pkgInstallmentDates, setPkgInstallmentDates] = useState({
    part1: new Date().toISOString().split('T')[0],
    part2: '2026-05-05',
    term1: '2026-06-05',
    term2: '2026-10-05'
  });
  const [assignUtrNumber, setAssignUtrNumber] = useState('');
  const [assignInitialPaid, setAssignInitialPaid] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [dbFeeStructures, setDbFeeStructures] = useState<any[]>([]);

  // Excel / CSV Fee Structure Customization State
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [excelImportRows, setExcelImportRows] = useState<Array<{ fee_type: string; amount: number; due_date: string; grade: string }>>([]);
  const [excelTargetGrade, setExcelTargetGrade] = useState('Nursery');
  const [excelFileChosen, setExcelFileChosen] = useState<string>('');
  const [importingExcel, setImportingExcel] = useState(false);

  // Collect Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedStudentFee, setSelectedStudentFee] = useState<StudentFeeSummary | null>(null);
  const [studentPendingMilestones, setStudentPendingMilestones] = useState<any[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | number | null>(null);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [receiptNo, setReceiptNo] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paying, setPaying] = useState(false);

  // Printable Receipt Modal State
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null);

  // EDUNEEV KIDS Authentic Invoice Slip Modal State
  const [isEduneevInvoiceOpen, setIsEduneevInvoiceOpen] = useState(false);
  const [eduneevInvoiceData, setEduneevInvoiceData] = useState<EduneevInvoiceData>({
    invoiceNo: '064',
    date: new Date().toLocaleDateString('en-IN'),
    customerName: '',
    items: [{ srNo: 1, description: 'School Tuition Fee', qty: 1, rate: 5000, amount: 5000 }]
  });

  // Student Payment History Ledger Modal State
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedLedgerStudent, setSelectedLedgerStudent] = useState<StudentFeeSummary | null>(null);
  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);

  // Fee Status Filter (All / Defaulters & Pending / Overdue / Paid)
  const [feeStatusFilter, setFeeStatusFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('ALL');

  // Defaulters & Pending Fees Report Modal State
  const [isPendingReportModalOpen, setIsPendingReportModalOpen] = useState(false);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportGradeFilter, setReportGradeFilter] = useState('All');

  const getBranchCode = (branchName?: string) => {
    if (!branchName) return 'CHI';
    const lower = branchName.toLowerCase();
    if (lower.includes('chinchwad')) return 'CHI';
    if (lower.includes('chikhali')) return 'CHK';
    if (lower.includes('dudulgaon')) return 'DUD';
    return branchName.trim().toUpperCase().replace(/BRANCH/gi, '').trim().slice(0, 3) || 'CHI';
  };

  const getLoggedInAdminAttribution = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const name = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || '');
      if (name) return `${name} (Franchise Admin & Finance Admin)`;
      return 'Franchise Admin & Finance Admin';
    } catch {
      return 'Franchise Admin & Finance Admin';
    }
  };

  const exportPendingFeesCSV = (listToExport?: StudentFeeSummary[]) => {
    const list = listToExport || adminStudents.filter(s => parseFloat(s.balance || '0') > 0);
    if (list.length === 0) {
      alert('No students with pending fees found to export.');
      return;
    }

    const headers = ['Sr No', 'Student Name', 'Admission No', 'Grade', 'Branch', 'Parent Name', 'Parent Phone', 'Total Assigned', 'Total Paid', 'Pending Balance', 'Due Date', 'Status'];
    const rows = list.map((s, idx) => [
      idx + 1,
      `"${s.first_name} ${s.last_name}"`,
      `"${s.admission_number || 'N/A'}"`,
      `"${s.grade || 'N/A'}"`,
      `"${s.school_name || s.enrolmentCentre || 'Chinchwad'}"`,
      `"${s.parent_name || '-'}"`,
      `"${s.parent_phone || '-'}"`,
      parseFloat(s.total_due || '0'),
      parseFloat(s.total_paid || '0'),
      parseFloat(s.balance || '0'),
      `"${s.earliest_due_date ? formatDateToDDMMYYYY(s.earliest_due_date) : 'Installment Due'}"`,
      `"${s.fee_status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Eduneev_Pending_Fees_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateAutoReceiptNo = (student?: any, txOffset: number = 0) => {
    const branchName = student?.school_name || student?.enrolmentCentre || 'Chinchwad Branch';
    const code = getBranchCode(branchName);
    const year = new Date().getFullYear();
    const randSeq = Math.floor(100 + Math.random() * 900);
    return `REC-${code}-${year}-${randSeq}`;
  };

  const openStudentLedgerModal = async (student: StudentFeeSummary) => {
    setSelectedLedgerStudent(student);
    setIsLedgerModalOpen(true);
    setLedgerTransactions([]);
    try {
      const res = await apiClient.get(`/fees/ledger/${student.student_id}`);
      const fetchedTx = res.data?.transactions || [];
      setLedgerTransactions(fetchedTx);
    } catch (e) {
      console.error('Failed to load ledger transactions:', e);
      setLedgerTransactions([]);
    }
  };

  const handleFeeTypeChange = (newType: string) => {
    setFeeType(newType);
    const effectiveGrade = assignTarget === 'Student' 
      ? (allStudents.find(s => s.id === targetStudentId)?.grade || targetGrade) 
      : targetGrade;
    const suggestion = getSuggestedRate(newType, effectiveGrade, dbFeeStructures);
    if (suggestion.amount) {
      setFeeAmount(String(suggestion.amount));
      setFeeDueDate(suggestion.dueDate);
    }
  };

  const handleTargetGradeChange = (newGrade: string) => {
    setTargetGrade(newGrade);
    const suggestion = getSuggestedRate(feeType, newGrade, dbFeeStructures);
    if (suggestion.amount) {
      setFeeAmount(String(suggestion.amount));
      setFeeDueDate(suggestion.dueDate);
    }
  };

  const handleOpenAssignModal = () => {
    fetchAllStudentsList();
    const initialGrade = (selectedGrade && selectedGrade !== 'All') ? selectedGrade : (targetGrade || 'Jr KG');
    setTargetGrade(initialGrade);
    const defaultType = 'Full Academic Year (Complete Installments Package)';
    setFeeType(defaultType);
    const suggestion = getSuggestedRate(defaultType, initialGrade, dbFeeStructures);
    setFeeAmount(String(suggestion.amount || 48290));
    setFeeDueDate(suggestion.dueDate);
    setTargetStudentId('');
    setAssignInitialPaid('');
    setAssignUtrNumber('');
    setIsAssignModalOpen(true);
  };

  const fetchFeeData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, classesRes, feeRes] = await Promise.all([
        apiClient.get('/fees/summary/all', {
          params: {
            school_id: activeBranchId,
            grade: selectedGrade !== 'All' ? selectedGrade : undefined,
            search: searchQuery.trim() || undefined,
          }
        }),
        apiClient.get('/classes').catch(() => ({ data: [] })),
        apiClient.get('/fee-structures', {
          params: activeBranchId ? { school_id: activeBranchId } : undefined
        }).catch(() => ({ data: { data: [] } }))
      ]);

      setAdminSummary(res.data?.summary || null);
      setAdminStudents(res.data?.data || []);

      if (Array.isArray(classesRes.data) && classesRes.data.length > 0) {
        const rawNames = classesRes.data.map((c: any) => c.name).filter(Boolean);
        const sorted = sortClasses(rawNames);
        setAvailableClasses(sorted.length > 0 ? sorted : CLASS_ORDER);
      }
      if (feeRes.data?.data && Array.isArray(feeRes.data.data)) {
        setDbFeeStructures(feeRes.data.data);
      }
    } catch (error) {
      console.error('Fetch fees error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, searchQuery, selectedBranchFilter, dbBranches, activeBranchId]);

  useEffect(() => {
    fetchFeeData();
  }, [fetchFeeData]);

  const [sendingReminders, setSendingReminders] = useState(false);

  const handleSendFeeReminders = async () => {
    if (!window.confirm('Send fee reminders now for all qualifying stages (15 days remaining, 2 days remaining, 2 days overdue, 1 month overdue)?')) {
      return;
    }
    try {
      setSendingReminders(true);
      const res = await apiClient.post('/fees/send-reminders');
      const data = res.data?.data || {};
      alert(`✅ Fee Reminders Processed!\n\nTotal Pending Fees Checked: ${data.total_checked || 0}\nReminders Sent: ${data.reminders_sent || 0}\n\nStages checked:\n• 15 Days Remaining\n• 2 Days Remaining\n• 2 Days Overdue\n• 1 Month Overdue`);
      fetchFeeData();
    } catch (err: any) {
      console.error('Failed to trigger fee reminders', err);
      alert(err.response?.data?.error || 'Failed to trigger fee reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const fetchAllStudentsList = async () => {
    try {
      const res = await apiClient.get('/admin/students', {
        params: activeBranchId ? { school_id: activeBranchId } : undefined
      });
      setAllStudents(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalFeeType = feeType === 'Other' ? (customFeeDescription || 'Custom Fee') : feeType;
    if (!finalFeeType || !feeAmount || !feeDueDate) return alert('Please fill all required fields');

    const amountNum = parseFloat(feeAmount);
    if (isNaN(amountNum) || amountNum <= 0) return alert('Invalid fee amount');

    if (assignTarget === 'Student' && !targetStudentId) return alert('Please select a student');

    setAssigning(true);
    try {
      const payload: any = {
        fee_type: finalFeeType,
        amount: amountNum,
        due_date: feeDueDate,
        school_id: activeBranchId || dbBranches.find(b => b.name?.toLowerCase().includes('chinchwad'))?.id,
        utr_number: assignUtrNumber.trim() || undefined,
        initial_paid_amount: assignInitialPaid ? parseFloat(assignInitialPaid) : undefined,
        payment_method: 'Online / UPI (UTR)'
      };

      const isPkg = finalFeeType.includes('Package') || finalFeeType.includes('Installments') || finalFeeType.includes('Full Academic Year');
      const isEarly = finalFeeType.includes('Early Bird');

      if (isPkg) {
        const effectiveGrade = assignTarget === 'Student' 
          ? (allStudents.find(s => s.id === targetStudentId)?.grade || targetGrade) 
          : targetGrade;
        const rates = getNormalizedRates(effectiveGrade, dbFeeStructures);
        const t1 = isEarly ? rates.term1Early : rates.term1Std;
        const t2 = isEarly ? rates.term2Early : rates.term2Std;

        payload.bulk_items = [
          { fee_type: 'Annual fees + IK + SM (Part 1 - On Admission)', amount: rates.annualAdmission, due_date: pkgInstallmentDates.part1 || new Date().toISOString().split('T')[0], grade: effectiveGrade },
          { fee_type: 'Annual fees + IK + SM (Part 2 - Due 5th May)', amount: rates.annualMay, due_date: pkgInstallmentDates.part2 || '2026-05-05', grade: effectiveGrade },
          { fee_type: `Term 1 Fee (${isEarly ? 'Early Bird Upto 15th July' : 'Due 5th June'})`, amount: t1, due_date: pkgInstallmentDates.term1 || '2026-06-05', grade: effectiveGrade },
          { fee_type: `Term 2 Fee (${isEarly ? 'Early Bird Upto 15th July' : 'Due 5th Oct'})`, amount: t2, due_date: pkgInstallmentDates.term2 || '2026-10-05', grade: effectiveGrade },
        ];
      }

      if (assignTarget === 'Student') {
        payload.student_id = targetStudentId;
      } else if (assignTarget === 'Grade') {
        payload.grade = targetGrade;
      }

      await apiClient.post('/fees/assign', payload);
      alert(`Fee assigned successfully!${assignInitialPaid ? ` Initial payment of ₹${parseFloat(assignInitialPaid).toLocaleString('en-IN')} recorded.` : ''}`);
      setIsAssignModalOpen(false);
      setAssignUtrNumber('');
      setAssignInitialPaid('');
      fetchFeeData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to assign fee');
    } finally {
      setAssigning(false);
    }
  };

  const handleDownloadExcelTemplate = () => {
    const csvContent = 
      "Fee Type,Amount,Grade,Due Date\n" +
      "Tuition Fee,15000,Nursery,2026-11-10\n" +
      "Admission Fee,5000,Nursery,2026-10-30\n" +
      "Admission Kit Fee,3500,Nursery,2026-10-30\n" +
      "Uniform & Books Fee,4500,Nursery,2026-10-30\n" +
      "Term 1 Fee,12000,Nursery,2026-11-10\n" +
      "Term 2 Fee,12000,Nursery,2027-01-10\n" +
      "Annual Activity Fee,2000,Nursery,2026-11-10\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'EduNeev_Fee_Structure_Customization_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileChosen(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        alert('File seems empty or contains only headers');
        return;
      }
      const parsedRows: Array<{ fee_type: string; amount: number; due_date: string; grade: string }> = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 2 && cols[0] && !isNaN(parseFloat(cols[1]))) {
          parsedRows.push({
            fee_type: cols[0],
            amount: parseFloat(cols[1]),
            grade: cols[2] || excelTargetGrade,
            due_date: cols[3] || new Date().toISOString().split('T')[0]
          });
        }
      }
      if (parsedRows.length === 0) {
        alert('Could not find valid rows in the Excel/CSV file. Please ensure columns: Fee Type, Amount, Grade, Due Date');
        return;
      }
      setExcelImportRows(parsedRows);
    };
    reader.readAsText(file);
  };

  const handleApplyExcelStructure = async () => {
    if (excelImportRows.length === 0) {
      alert('Please choose and preview an Excel/CSV file with fee items first.');
      return;
    }
    setImportingExcel(true);
    try {
      await apiClient.post('/fees/assign', {
        grade: excelTargetGrade,
        bulk_items: excelImportRows
      });
      alert(`✅ Customized fee structure (${excelImportRows.length} fee heads) successfully assigned to ${excelTargetGrade}!`);
      setIsExcelImportModalOpen(false);
      setExcelImportRows([]);
      setExcelFileChosen('');
      fetchFeeData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to import customized fee structure');
    } finally {
      setImportingExcel(false);
    }
  };

  const handleOpenPaymentModal = async (student: StudentFeeSummary) => {
    setSelectedStudentFee(student);
    const balanceNum = parseFloat(student.balance || '0');
    setPaymentAmount('');
    setSelectedMilestoneId(null);
    setReceiptNo(generateAutoReceiptNo(student));
    setPaymentMode('Cash');
    setTransactionRef('');
    setPaymentNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setStudentPendingMilestones([]);
    setPaymentModalVisible(true);

    // Fetch guaranteed next sequential receipt number from backend
    apiClient.get(`/fees/next-receipt-number?branch_name=${encodeURIComponent(student.school_name || userBranch)}`)
      .then(res => {
        if (res.data?.receipt_no) setReceiptNo(res.data.receipt_no);
      })
      .catch(() => {});

    try {
      setLoadingMilestones(true);
      const res = await apiClient.get(`/fees/ledger/${student.student_id}`);
      const unpaidFees = (res.data?.fees || []).filter((f: any) => {
        const due = parseFloat(f.amount_due || '0');
        const paid = parseFloat(f.total_paid || '0');
        return due > paid;
      });
      setStudentPendingMilestones(unpaidFees);
      if (unpaidFees.length > 0) {
        const firstUnpaidDue = Math.max(0, parseFloat(unpaidFees[0].amount_due || '0') - parseFloat(unpaidFees[0].total_paid || '0'));
        setSelectedMilestoneId(unpaidFees[0].id !== undefined && unpaidFees[0].id !== null ? unpaidFees[0].id : 0);
        setPaymentAmount(firstUnpaidDue > 0 ? String(firstUnpaidDue) : String(balanceNum));
        setPaymentNotes(`Payment for ${unpaidFees[0].fee_type}`);
      } else {
        setSelectedMilestoneId('ALL');
        setPaymentAmount(balanceNum > 0 ? String(balanceNum) : '0');
      }
    } catch (e) {
      console.error('Failed to load pending milestones:', e);
      setSelectedMilestoneId('ALL');
      setPaymentAmount(balanceNum > 0 ? String(balanceNum) : '0');
    } finally {
      setLoadingMilestones(false);
    }
  };

  const handleOpenStudentReceipt = (student: StudentFeeSummary) => {
    const paidNum = parseFloat(student.total_paid || '0') || parseFloat(student.total_due || '0') || 5000;
    const balanceNum = parseFloat(student.balance || '0');

    const installments = balanceNum > 0 ? [
      { no: 1, amount: paidNum, date: formatDateToDDMMYYYY(new Date()) },
      { no: 2, amount: Math.round(balanceNum * 0.5), date: '10/11/2026' },
      { no: 3, amount: Math.round(balanceNum * 0.5), date: '10/01/2027' },
    ] : [
      { no: 1, amount: paidNum, date: formatDateToDDMMYYYY(new Date()) }
    ];

    setEduneevInvoiceData({
      invoiceNo: generateAutoReceiptNo(student),
      date: formatDateToDDMMYYYY(new Date()),
      customerName: `${student.first_name} ${student.last_name}`,
      admissionNo: student.admission_number || 'N/A',
      idCardNo: student.admission_number || `ADM-${student.student_id.slice(0, 4)}`,
      grade: student.grade || 'Nursery',
      paymentMode: 'Cash / Online UPI',
      bankName: 'UPI / Direct Bank Transfer',
      address: 'Sambhajinagar, Chinchwad, Pune',
      academicYear: '2026 - 2027',
      totalAmountPaid: paidNum,
      addedBy: getLoggedInAdminAttribution(),
      items: [
        {
          srNo: 1,
          description: 'School Tuition & Annual Activity Fee',
          qty: 1,
          rate: paidNum,
          amount: paidNum,
        },
      ],
      installments,
    });
    setIsEduneevInvoiceOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentFee) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return alert('Please enter a valid payment amount');

    setPaying(true);
    try {
      await apiClient.post('/fees/verify-payment', {
        student_id: selectedStudentFee.student_id,
        amount_paid: amount,
        payment_method: paymentMode,
        transaction_ref: transactionRef,
        receipt_no: receiptNo,
        notes: paymentNotes
      });

      const currentBalance = parseFloat(selectedStudentFee.balance || '0');
      const newBalance = Math.max(0, Math.round((currentBalance - amount) * 100) / 100);

      const newReceipt: PaymentReceiptData = {
        receiptNo: receiptNo,
        date: formatDateToDDMMYYYY(paymentDate),
        studentName: `${selectedStudentFee.first_name} ${selectedStudentFee.last_name}`,
        admissionNo: selectedStudentFee.admission_number || 'N/A',
        grade: selectedStudentFee.grade || 'Nursery',
        amountPaid: amount,
        paymentMode: paymentMode,
        transactionRef: transactionRef,
        balanceRemaining: newBalance,
        feeType: 'School Tuition & Activities Fee'
      };

      const installments = newBalance > 0 ? [
        { no: 1, amount: amount, date: formatDateToDDMMYYYY(paymentDate) },
        { no: 2, amount: Math.round(newBalance * 0.5), date: '10/11/2026' },
        { no: 3, amount: Math.round(newBalance * 0.5), date: '10/01/2027' },
      ] : [
        { no: 1, amount: amount, date: formatDateToDDMMYYYY(paymentDate) }
      ];

      setPaymentModalVisible(false);
      setReceiptData(newReceipt);
      setEduneevInvoiceData({
        invoiceNo: receiptNo || '986',
        date: formatDateToDDMMYYYY(paymentDate),
        customerName: `${selectedStudentFee.first_name} ${selectedStudentFee.last_name}`,
        admissionNo: selectedStudentFee.admission_number || 'N/A',
        idCardNo: selectedStudentFee.admission_number || `ADM-${selectedStudentFee.student_id.slice(0, 4)}`,
        grade: selectedStudentFee.grade || 'Nursery',
        paymentMode: paymentMode,
        bankName: transactionRef ? transactionRef : 'Cash / Direct Bank Transfer',
        address: 'Sambhajinagar, Chinchwad, Pune',
        academicYear: '2026 - 2027',
        totalAmountPaid: amount,
        addedBy: getLoggedInAdminAttribution(),
        items: [
          {
            srNo: 1,
            description: paymentNotes ? `School Tuition Fee (${paymentNotes})` : 'School Tuition & Activity Fee',
            qty: 1,
            rate: amount,
            amount: amount,
          },
        ],
        installments,
      });
      setIsEduneevInvoiceOpen(true);
      fetchFeeData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setPaying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <span style={{ background: '#D1FAE5', color: '#059669', padding: '0.3rem 0.8rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 }}>FULLY PAID</span>;
      case 'PARTIAL': return <span style={{ background: '#FEF3C7', color: '#D97706', padding: '0.3rem 0.8rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 }}>PARTIAL</span>;
      case 'PENDING': return <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.3rem 0.8rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 }}>PENDING</span>;
      default: return <span style={{ background: '#F1F5F9', color: '#64748B', padding: '0.3rem 0.8rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 }}>NO FEE</span>;
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const branchFilteredStudents = adminStudents.filter(fee => {
    const studentBranch = (fee.school_name || fee.enrolmentCentre || 'Chinchwad Branch').toLowerCase();
    const filterBranch = selectedBranchFilter.toLowerCase();
    
    if (selectedBranchFilter === 'All') return true;
    if (filterBranch.includes('chinchwad')) return studentBranch.includes('chinchwad');
    if (filterBranch.includes('chikhali')) return studentBranch.includes('chikhali');
    if (filterBranch.includes('dudulgaon')) return studentBranch.includes('dudulgaon');
    return true;
  });

  const computedSummary = {
    totalExpected: branchFilteredStudents.reduce((acc, f) => acc + (parseFloat(f.total_due) || 0), 0),
    totalCollected: branchFilteredStudents.reduce((acc, f) => acc + (parseFloat(f.total_paid) || 0), 0),
    totalPending: branchFilteredStudents.reduce((acc, f) => acc + (parseFloat(f.balance) || 0), 0),
    defaultersCount: branchFilteredStudents.filter(f => (parseFloat(f.balance) || 0) > 0).length,
    overdueCount: branchFilteredStudents.filter(f => (parseFloat(f.balance) || 0) > 0 && (!f.earliest_due_date || new Date(f.earliest_due_date) <= new Date())).length,
    paidCount: branchFilteredStudents.filter(f => (parseFloat(f.balance) || 0) <= 0 && (parseFloat(f.total_paid) || 0) > 0).length
  };

  const filteredStudents = branchFilteredStudents.filter(fee => {
    // 1. Grade filter
    if (selectedGrade !== 'All') {
      const gStudent = normalizeGradeName(fee.grade).toLowerCase();
      const gFilter = normalizeGradeName(selectedGrade).toLowerCase();
      if (gStudent !== gFilter) {
        return false;
      }
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      const match = 
        `${fee.first_name} ${fee.last_name}`.toLowerCase().includes(term) ||
        (fee.admission_number || '').toLowerCase().includes(term) ||
        (fee.parent_name || '').toLowerCase().includes(term) ||
        (fee.parent_phone || '').includes(term);
      if (!match) return false;
    }

    // 3. Status filter
    const bal = parseFloat(fee.balance || '0');
    if (feeStatusFilter === 'PENDING') {
      return bal > 0;
    }
    if (feeStatusFilter === 'OVERDUE') {
      return bal > 0 && (!fee.earliest_due_date || new Date(fee.earliest_due_date) <= new Date());
    }
    if (feeStatusFilter === 'PAID') {
      return bal <= 0 && parseFloat(fee.total_paid || '0') > 0;
    }

    return true;
  });

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10 }}>
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">Fee Management</h1>
              <p className="date-text">Collect payments, generate receipts & assign fees</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/fee-structures')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'white',
                color: '#4F46E5',
                border: '1.5px solid #E0E7FF',
                padding: '0.55rem 0.95rem',
                borderRadius: '0.65rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="View & customize class-wise fee structures & franchise rates"
            >
              <LayoutList size={16} /> Fee Structures &amp; Rates
            </button>
            <button
              onClick={() => setIsPendingReportModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1.5px solid #FECACA',
                padding: '0.55rem 0.95rem',
                borderRadius: '0.65rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="View, Print & Download Defaulters & Due Installments Report"
            >
              <AlertTriangle size={16} /> Pending Fees Report ({computedSummary.defaultersCount})
            </button>
            <button
              onClick={() => {
                setEduneevInvoiceData({
                  invoiceNo: `0${Math.floor(Math.random() * 900 + 100)}`,
                  date: new Date().toLocaleDateString('en-IN'),
                  customerName: '',
                  addedBy: getLoggedInAdminAttribution(),
                  items: [
                    { srNo: 1, description: 'Admission & Prospectus Fee', qty: 1, rate: 2500, amount: 2500 },
                    { srNo: 2, description: 'Term 1 Tuition Fee', qty: 1, rate: 12500, amount: 12500 }
                  ]
                });
                setIsEduneevInvoiceOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'white',
                color: '#334155',
                border: '1.5px solid #E2E8F0',
                padding: '0.55rem 0.95rem',
                borderRadius: '0.65rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Receipt size={16} /> Custom Invoice
            </button>
            <button
              onClick={() => setIsExcelImportModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#ECFDF5',
                color: '#047857',
                border: '1.5px solid #A7F3D0',
                padding: '0.55rem 0.95rem',
                borderRadius: '0.65rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="Customize fees structure by Excel / CSV sheet provided by Sir"
            >
              <Download size={16} /> Excel Setup
            </button>
            <button 
              onClick={handleOpenAssignModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: 'white',
                border: 'none',
                padding: '0.55rem 1.15rem',
                borderRadius: '0.65rem',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.15s'
              }}
            >
              <Plus size={18} /> Assign New Fee
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div 
            className="glass-card" 
            onClick={() => setFeeStatusFilter('ALL')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', 
              border: feeStatusFilter === 'ALL' ? '2px solid #2563EB' : '1px solid #DBEAFE',
              cursor: 'pointer'
            }}
            title="Click to view all student fee records"
          >
            <div style={{ padding: '1rem', background: '#EFF6FF', color: '#2563EB', borderRadius: '1rem' }}>
              <Receipt size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#3B82F6', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Expected</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#1E40AF', fontSize: '1.75rem', fontWeight: 900 }}>
                ₹ {(computedSummary.totalExpected || adminSummary?.totalExpected || 0).toLocaleString()}
              </h3>
            </div>
          </div>
          
          <div 
            className="glass-card" 
            onClick={() => setFeeStatusFilter(feeStatusFilter === 'PAID' ? 'ALL' : 'PAID')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', 
              border: feeStatusFilter === 'PAID' ? '2px solid #059669' : '1px solid #A7F3D0',
              cursor: 'pointer'
            }}
            title="Click to toggle: Show only fully paid students"
          >
            <div style={{ padding: '1rem', background: '#ECFDF5', color: '#059669', borderRadius: '1rem' }}>
              <CheckCircle size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#10B981', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
                Total Collected ({computedSummary.paidCount})
              </p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#065F46', fontSize: '1.75rem', fontWeight: 900 }}>
                ₹ {(computedSummary.totalCollected || adminSummary?.totalCollected || 0).toLocaleString()}
              </h3>
            </div>
          </div>

          <div 
            className="glass-card" 
            onClick={() => setFeeStatusFilter(feeStatusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', 
              border: feeStatusFilter === 'PENDING' ? '2px solid #EF4444' : '1px solid #FECACA',
              cursor: 'pointer',
              background: feeStatusFilter === 'PENDING' ? '#FEF2F2' : 'white',
              transition: 'all 0.2s',
              transform: feeStatusFilter === 'PENDING' ? 'scale(1.02)' : 'none'
            }}
            title="Click to toggle: Show only students with pending fees & due installments"
          >
            <div style={{ padding: '1rem', background: '#FEF2F2', color: '#DC2626', borderRadius: '1rem' }}>
              <Wallet size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
                Total Pending ({computedSummary.defaultersCount || adminSummary?.defaultersCount || 0})
              </p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#991B1B', fontSize: '1.75rem', fontWeight: 900 }}>
                ₹ {(computedSummary.totalPending || adminSummary?.totalPending || 0).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        {/* Installment Dues Alert Banner */}
        {computedSummary.defaultersCount > 0 && (
          <div style={{
            background: '#FFFBEB',
            border: '1.5px solid #FCD34D',
            padding: '0.85rem 1.25rem',
            borderRadius: '0.75rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 2px 4px rgba(245, 158, 11, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={24} color="#D97706" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 900, color: '#92400E', fontSize: '0.92rem' }}>
                  📢 Installment Alert: {computedSummary.defaultersCount} Students have pending fee installments (Total Pending: ₹ {computedSummary.totalPending.toLocaleString()})
                </span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#B45309', marginTop: '2px' }}>
                  Admin and Finance team can filter below, view due dates, call parents directly or download the full statement report.
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setFeeStatusFilter('PENDING')}
                style={{
                  background: '#D97706',
                  color: 'white',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                View Pending ({computedSummary.defaultersCount})
              </button>
              <button
                onClick={() => setIsPendingReportModalOpen(true)}
                style={{
                  background: '#1E293B',
                  color: 'white',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                📊 Extract Report
              </button>
            </div>
          </div>
        )}

        {/* Filters & Data Table */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Filter Status:</span>
            <button
              onClick={() => setFeeStatusFilter('ALL')}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '99px', fontWeight: 800, border: 'none', cursor: 'pointer',
                background: feeStatusFilter === 'ALL' ? '#1E293B' : '#F1F5F9',
                color: feeStatusFilter === 'ALL' ? 'white' : '#475569',
                fontSize: '0.82rem'
              }}
            >
              All Students ({branchFilteredStudents.length})
            </button>
            <button
              onClick={() => setFeeStatusFilter('PENDING')}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '99px', fontWeight: 800, border: 'none', cursor: 'pointer',
                background: feeStatusFilter === 'PENDING' ? '#DC2626' : '#FEE2E2',
                color: feeStatusFilter === 'PENDING' ? 'white' : '#B91C1C',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ⚠️ Pending Fees ({computedSummary.defaultersCount})
            </button>
            <button
              onClick={() => setFeeStatusFilter('OVERDUE')}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '99px', fontWeight: 800, border: 'none', cursor: 'pointer',
                background: feeStatusFilter === 'OVERDUE' ? '#D97706' : '#FEF3C7',
                color: feeStatusFilter === 'OVERDUE' ? 'white' : '#92400E',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ⏰ Due / Overdue ({computedSummary.overdueCount})
            </button>
            <button
              onClick={() => setFeeStatusFilter('PAID')}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '99px', fontWeight: 800, border: 'none', cursor: 'pointer',
                background: feeStatusFilter === 'PAID' ? '#059669' : '#D1FAE5',
                color: feeStatusFilter === 'PAID' ? 'white' : '#047857',
                fontSize: '0.82rem'
              }}
            >
              ✅ Fully Paid ({computedSummary.paidCount})
            </button>

            <button
              onClick={handleSendFeeReminders}
              disabled={sendingReminders}
              style={{
                marginLeft: 'auto',
                padding: '0.45rem 1.15rem',
                borderRadius: '99px',
                fontWeight: 800,
                border: '1px solid #7C3AED',
                cursor: sendingReminders ? 'not-allowed' : 'pointer',
                background: '#7C3AED',
                color: 'white',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
              }}
              title="Send automated reminders (15 days remaining, 2 days remaining, 2 days overdue, 1 month overdue)"
            >
              <Bell size={14} />
              {sendingReminders ? 'Sending Reminders...' : '🔔 Trigger Fee Reminders'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="search-box" style={{ width: '320px' }}>
                <Search size={18} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Search student, adm no, or parent..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <option value="Chinchwad Branch">Chinchwad Branch (Main Branch)</option>
                  {dbBranches.length > 0 ? (
                    dbBranches
                      .filter((b: any) => !b.name?.toLowerCase().includes('chinchwad'))
                      .map((b: any) => (
                        <option key={b.id} value={b.name}>{b.name} (Franchise)</option>
                      ))
                  ) : null}
                  {isSuperAdmin && <option value="All">All Branches (HQ + Franchises)</option>}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              <button
                onClick={() => setSelectedGrade('All')}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '99px', fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: selectedGrade === 'All' ? '#6366F1' : '#F1F5F9',
                  color: selectedGrade === 'All' ? 'white' : '#475569',
                  fontSize: '0.85rem', transition: 'all 0.2s'
                }}
              >
                All Classes
              </button>
              {availableClasses.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '99px', fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: selectedGrade === g ? '#6366F1' : '#F1F5F9',
                    color: selectedGrade === g ? 'white' : '#475569',
                    fontSize: '0.85rem', transition: 'all 0.2s'
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex-center py-8">Loading fee records...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Grade</th>
                    <th>Total Assigned</th>
                    <th>Total Paid</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((fee) => {
                    const balanceNum = parseFloat(fee.balance || '0');
                    return (
                      <tr key={fee.student_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: '#EEF2FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
                              {(fee.first_name?.[0] || 'S')}{(fee.last_name?.[0] || '')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.95rem' }}>{fee.first_name} {fee.last_name}</div>
                              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                                {fee.admission_number && <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>ADM: {fee.admission_number}</span>}
                                {fee.parent_phone && (
                                  <a href={`tel:${fee.parent_phone}`} style={{ color: '#0284C7', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }} title="Call Parent">
                                    <Phone size={11} /> {fee.parent_phone}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="section-badge">{normalizeGradeName(fee.grade) || 'N/A'}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#475569' }}>₹ {parseFloat(fee.total_due).toLocaleString()}</td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>₹ {parseFloat(fee.total_paid).toLocaleString()}</td>
                        <td style={{ fontWeight: 900, color: balanceNum > 0 ? '#DC2626' : '#059669' }}>
                          <div style={{ fontSize: '1.05rem' }}>₹ {balanceNum.toLocaleString()}</div>
                          {balanceNum > 0 && (
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: fee.earliest_due_date && new Date(fee.earliest_due_date) < new Date() ? '#DC2626' : '#D97706', marginTop: '2px' }}>
                              {fee.earliest_due_date ? (new Date(fee.earliest_due_date) < new Date() ? `🔴 Overdue: ${formatDateToDDMMYYYY(fee.earliest_due_date)}` : `📅 Due: ${formatDateToDDMMYYYY(fee.earliest_due_date)}`) : '⚠️ Installment Due'}
                            </div>
                          )}
                        </td>
                        <td>{getStatusBadge(fee.fee_status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => openStudentLedgerModal(fee)}
                              style={{ 
                                background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE',
                                padding: '0.45rem 0.85rem', borderRadius: '0.5rem', fontWeight: 800,
                                fontSize: '0.8rem', cursor: 'pointer' 
                              }}
                            >
                              📜 History
                            </button>
                            <button 
                              onClick={() => {
                                if (balanceNum > 0) {
                                  handleOpenPaymentModal(fee);
                                } else {
                                  handleOpenStudentReceipt(fee);
                                }
                              }}
                              style={{ 
                                background: balanceNum > 0 ? '#4F46E5' : '#059669', 
                                color: 'white', border: 'none', padding: '0.45rem 0.95rem', 
                                borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' 
                              }}
                            >
                              {balanceNum > 0 ? 'Collect Payment' : 'View Receipt'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {adminStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted" style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <Wallet size={48} color="#CBD5E1" />
                          No fee records match the selected filter.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assign Fee Modal */}
        {isAssignModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '520px' }}>
              <div className="modal-header">
                <h2>Assign New Fee Structure</h2>
                <button className="icon-btn" onClick={() => setIsAssignModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAssignSubmit} className="modal-form">
                
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label>Assign To Target</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setAssignTarget('All')} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: assignTarget === 'All' ? '#EEF2FF' : 'white', color: assignTarget === 'All' ? '#4F46E5' : '#475569', fontWeight: 800, cursor: 'pointer' }}>
                      <Users size={18} style={{ display: 'block', margin: '0 auto 0.5rem' }} /> All Students
                    </button>
                    <button type="button" onClick={() => setAssignTarget('Grade')} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: assignTarget === 'Grade' ? '#FFFBEB' : 'white', color: assignTarget === 'Grade' ? '#D97706' : '#475569', fontWeight: 800, cursor: 'pointer' }}>
                      <LayoutList size={18} style={{ display: 'block', margin: '0 auto 0.5rem' }} /> Entire Class
                    </button>
                    <button type="button" onClick={() => setAssignTarget('Student')} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: assignTarget === 'Student' ? '#F0FDF4' : 'white', color: assignTarget === 'Student' ? '#059669' : '#475569', fontWeight: 800, cursor: 'pointer' }}>
                      <User size={18} style={{ display: 'block', margin: '0 auto 0.5rem' }} /> Specific Student
                    </button>
                  </div>
                </div>

                {assignTarget === 'All' && (
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Class / Grade Fee Structure to Apply <span style={{ color: '#4F46E5' }}>*</span></label>
                    <select 
                      className="input-field" 
                      value={targetGrade} 
                      onChange={(e) => handleTargetGradeChange(e.target.value)} 
                      required
                    >
                      {availableClasses.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.72rem', color: '#6366F1', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      ℹ️ Selected class official fee structure will be applied to all active students in your branch.
                    </span>
                  </div>
                )}

                {assignTarget === 'Grade' && (
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Select Class <span style={{ color: '#D97706' }}>*</span></label>
                    <select className="input-field" value={targetGrade} onChange={(e) => handleTargetGradeChange(e.target.value)} required>
                      {availableClasses.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                )}

                {assignTarget === 'Student' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Class / Grade <span style={{ color: '#6366F1' }}>*</span></label>
                      <select 
                        className="input-field" 
                        value={targetGrade} 
                        onChange={(e) => {
                          const newGrade = e.target.value;
                          handleTargetGradeChange(newGrade);
                          setTargetStudentId('');
                        }}
                      >
                        <option value="All">-- All Classes --</option>
                        {availableClasses.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Select Student <span style={{ color: '#EF4444' }}>*</span></label>
                      <select 
                        className="input-field" 
                        value={targetStudentId} 
                        onChange={(e) => {
                          const sid = e.target.value;
                          setTargetStudentId(sid);
                          const st = allStudents.find(s => s.id === sid);
                          if (st && st.grade) {
                            setTargetGrade(st.grade);
                            const suggestion = getSuggestedRate(feeType, st.grade);
                            if (suggestion.amount) {
                              setFeeAmount(String(suggestion.amount));
                              setFeeDueDate(suggestion.dueDate);
                            }
                          }
                        }} 
                        required
                      >
                        <option value="">-- Choose a Student --</option>
                        {allStudents
                          .filter(s => {
                            if (!targetGrade || targetGrade === 'All') return true;
                            const sg = (s.grade || '').toLowerCase();
                            const tg = targetGrade.toLowerCase();
                            return sg === tg || sg.includes(tg) || tg.includes(sg);
                          })
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.first_name} {s.last_name} ({s.grade || 'N/A'}{s.admission_number ? ` - ADM: ${s.admission_number}` : ''})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label>Fee Type / Description</label>
                  <select className="input-field" value={feeType} onChange={(e) => handleFeeTypeChange(e.target.value)}>
                    {FEE_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                  </select>
                </div>

                {/* Quick Official Presets for Selected Class */}
                {(() => {
                  const effectiveGrade = assignTarget === 'Student' 
                    ? (allStudents.find(s => s.id === targetStudentId)?.grade || targetGrade) 
                    : targetGrade;
                  const currentRates = getNormalizedRates(effectiveGrade, dbFeeStructures);

                  return (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
                          ⚡ OFFICIAL {effectiveGrade.toUpperCase()} PRESETS:
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#6366F1', fontWeight: 700 }}>
                          Click to auto-fill rate &amp; due date
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleFeeTypeChange('Full Academic Year (Complete Installments Package)')}
                          style={{
                            background: (feeType.includes('Package') && !feeType.includes('Early')) ? '#4F46E5' : '#EEF2FF',
                            border: '1.5px solid #4F46E5',
                            color: (feeType.includes('Package') && !feeType.includes('Early')) ? 'white' : '#4338CA',
                            padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 1px 3px rgba(79,70,229,0.2)'
                          }}
                        >
                          🌟 All 4 Installments Package (₹{currentRates.installmentsStd.toLocaleString('en-IN')})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeeTypeChange('Full Academic Year (Early Bird Discount Package)')}
                          style={{
                            background: feeType.includes('Early Bird Discount Package') ? '#059669' : '#ECFDF5',
                            border: '1.5px solid #059669',
                            color: feeType.includes('Early Bird Discount Package') ? 'white' : '#065F46',
                            padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer'
                          }}
                        >
                          🐣 Early Bird Package (₹{currentRates.installmentsEarly.toLocaleString('en-IN')})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeeTypeChange('Lump Sum Fee (One-Time Upfront Payment)')}
                          style={{
                            background: feeType.includes('Lump Sum') ? '#D97706' : '#FFFBEB',
                            border: '1px solid #D97706',
                            color: feeType.includes('Lump Sum') ? 'white' : '#92400E',
                            padding: '5px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                          }}
                        >
                          💰 Lump Sum (₹{currentRates.lumpSumStd.toLocaleString('en-IN')})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeeTypeChange('Annual fees + IK + SM (Part 1 - On Admission)')}
                          style={{
                            background: feeType.includes('Part 1') ? '#F1F5F9' : 'white',
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Admission Split Only (₹{currentRates.annualAdmission.toLocaleString('en-IN')})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeeTypeChange('Annual fees + IK + SM (Part 2 - Due 5th May)')}
                          style={{
                            background: feeType.includes('5th May') ? '#F1F5F9' : 'white',
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          5th May Split Only (₹{currentRates.annualMay.toLocaleString('en-IN')})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeeTypeChange('Term 1 Fee (Standard)')}
                          style={{
                            background: feeType === 'Term 1 Fee (Standard)' ? '#F1F5F9' : 'white',
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Term 1 Std (₹{currentRates.term1Std.toLocaleString('en-IN')})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeeTypeChange('Term 2 Fee (Standard)')}
                          style={{
                            background: feeType === 'Term 2 Fee (Standard)' ? '#F1F5F9' : 'white',
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Term 2 Std (₹{currentRates.term2Std.toLocaleString('en-IN')})
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 4-Milestone Breakdown Card when assigning Full Academic Year Package */}
                {(() => {
                  const effectiveGrade = assignTarget === 'Student' 
                    ? (allStudents.find(s => s.id === targetStudentId)?.grade || targetGrade) 
                    : targetGrade;
                  const currentRates = getNormalizedRates(effectiveGrade, dbFeeStructures);
                  const isPkg = feeType.includes('Package') || feeType.includes('Installments') || feeType.includes('Full Academic Year');
                  const isEarly = feeType.includes('Early Bird');
                  const t1 = isEarly ? currentRates.term1Early : currentRates.term1Std;
                  const t2 = isEarly ? currentRates.term2Early : currentRates.term2Std;

                  if (!isPkg) return null;

                  return (
                    <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: '0.75rem', padding: '0.85rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1E40AF' }}>
                          📦 ALL 4 SCHEDULED INSTALLMENTS (Full Academic Year Package):
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1E3A8A' }}>
                          Total: ₹{Number(feeAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div style={{ background: 'white', padding: '8px 10px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ color: '#1E40AF', fontWeight: 800 }}>1️⃣ Admission Split</span>
                            <span style={{ color: '#0F172A', fontWeight: 900 }}>₹{currentRates.annualAdmission.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, whiteSpace: 'nowrap' }}>Due Date:</span>
                            <input 
                              type="date"
                              value={pkgInstallmentDates.part1}
                              onChange={(e) => setPkgInstallmentDates(p => ({ ...p, part1: e.target.value }))}
                              style={{ flex: 1, fontSize: '0.72rem', padding: '2px 6px', border: '1px solid #CBD5E1', borderRadius: '4px', background: '#F8FAFC', color: '#0F172A', fontWeight: 600 }}
                            />
                          </div>
                        </div>

                        <div style={{ background: 'white', padding: '8px 10px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ color: '#1E40AF', fontWeight: 800 }}>2️⃣ May 5th Split</span>
                            <span style={{ color: '#0F172A', fontWeight: 900 }}>₹{currentRates.annualMay.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#4F46E5', fontWeight: 700, whiteSpace: 'nowrap' }}>Due Date:</span>
                            <input 
                              type="date"
                              value={pkgInstallmentDates.part2}
                              onChange={(e) => setPkgInstallmentDates(p => ({ ...p, part2: e.target.value }))}
                              style={{ flex: 1, fontSize: '0.72rem', padding: '2px 6px', border: '1px solid #CBD5E1', borderRadius: '4px', background: '#F8FAFC', color: '#0F172A', fontWeight: 600 }}
                            />
                          </div>
                        </div>

                        <div style={{ background: 'white', padding: '8px 10px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ color: '#1E40AF', fontWeight: 800 }}>3️⃣ Term 1 Fee</span>
                            <span style={{ color: '#0F172A', fontWeight: 900 }}>₹{t1.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700, whiteSpace: 'nowrap' }}>Due Date:</span>
                            <input 
                              type="date"
                              value={pkgInstallmentDates.term1}
                              onChange={(e) => setPkgInstallmentDates(p => ({ ...p, term1: e.target.value }))}
                              style={{ flex: 1, fontSize: '0.72rem', padding: '2px 6px', border: '1px solid #CBD5E1', borderRadius: '4px', background: '#F8FAFC', color: '#0F172A', fontWeight: 600 }}
                            />
                          </div>
                        </div>

                        <div style={{ background: 'white', padding: '8px 10px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ color: '#1E40AF', fontWeight: 800 }}>4️⃣ Term 2 Fee</span>
                            <span style={{ color: '#0F172A', fontWeight: 900 }}>₹{t2.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700, whiteSpace: 'nowrap' }}>Due Date:</span>
                            <input 
                              type="date"
                              value={pkgInstallmentDates.term2}
                              onChange={(e) => setPkgInstallmentDates(p => ({ ...p, term2: e.target.value }))}
                              style={{ flex: 1, fontSize: '0.72rem', padding: '2px 6px', border: '1px solid #CBD5E1', borderRadius: '4px', background: '#F8FAFC', color: '#0F172A', fontWeight: 600 }}
                            />
                          </div>
                        </div>
                      </div>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.72rem', color: '#2563EB', fontWeight: 700 }}>
                        💡 All 4 scheduled installments will be assigned to the student. If the parent is paying the admission fee right now, enter it in "Initial Paid Amount" below. The remaining installments will stay pending for future collection.
                      </p>
                    </div>
                  );
                })()}

                {feeType === 'Other' && (
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Custom Fee Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Picnic / Event Fee"
                      value={customFeeDescription}
                      onChange={(e) => setCustomFeeDescription(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>Total Fee Amount to Assign (₹)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="15000"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Start / Due Date</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={feeDueDate}
                      onChange={(e) => setFeeDueDate(e.target.value)}
                      required 
                    />
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setFeeDueDate(new Date().toISOString().split('T')[0])}
                        style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeeDueDate('2026-05-05')}
                        style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        5th May 2026
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeeDueDate('2026-06-05')}
                        style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        5th June 2026
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeeDueDate('2026-10-05')}
                        style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        5th Oct 2026
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px dashed #94A3B8', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                      💳 Collect Initial Payment on Admission? (Optional)
                    </p>
                    {(() => {
                      const effectiveGrade = assignTarget === 'Student' 
                        ? (allStudents.find(s => s.id === targetStudentId)?.grade || targetGrade) 
                        : targetGrade;
                      const currentRates = getNormalizedRates(effectiveGrade, dbFeeStructures);

                      return (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setAssignInitialPaid(String(currentRates.annualAdmission))}
                            style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4F46E5', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Pay Part 1 (₹{currentRates.annualAdmission.toLocaleString('en-IN')})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssignInitialPaid('')}
                            style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#64748B', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            0 (Unpaid)
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Initial Paid Amount (₹)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        placeholder="0" 
                        value={assignInitialPaid} 
                        onChange={(e) => setAssignInitialPaid(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>UTR No. / Transaction Ref / Receipt Ref</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. UTR# 492019385012 / Cash" 
                        value={assignUtrNumber} 
                        onChange={(e) => setAssignUtrNumber(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={assigning} style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 800 }}>
                    {assigning ? 'Assigning...' : 'Assign Fee Structure'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customize Fee Structure via Excel Sheet Modal */}
        {isExcelImportModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '640px', maxWidth: '95vw' }}>
              <div className="modal-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A' }}>Customize Fee Structure by Excel Sheet</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    Upload Excel/CSV sheet provided by Sir or download template
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setIsExcelImportModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#166534', fontSize: '0.95rem' }}>📄 Step 1: Download Standard Excel Template</h4>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#15803D', fontSize: '0.8rem' }}>
                      Pre-filled with standard fee heads (Tuition, Admission, Kit, Uniform, Term 1/2).
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleDownloadExcelTemplate} 
                    className="btn-primary" 
                    style={{ background: '#059669', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                  >
                    <Download size={16} /> Download Template
                  </button>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#1E293B', fontSize: '0.95rem' }}>📤 Step 2: Upload Customized Excel / CSV Sheet</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Target Class / Grade</label>
                      <select 
                        className="input-field" 
                        value={excelTargetGrade} 
                        onChange={(e) => setExcelTargetGrade(e.target.value)}
                      >
                        {availableClasses.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Select File (.csv or .xlsx)</label>
                      <input 
                        type="file" 
                        accept=".csv,.txt" 
                        onChange={handleExcelFileChange}
                        className="input-field" 
                        style={{ padding: '0.4rem' }}
                      />
                    </div>
                  </div>

                  {excelFileChosen && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
                      Selected: {excelFileChosen} ({excelImportRows.length} fee heads detected)
                    </p>
                  )}
                </div>

                {excelImportRows.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1E293B', fontSize: '0.9rem' }}>
                      📋 Preview: Fee Heads to be Assigned to {excelTargetGrade}
                    </h4>
                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead style={{ background: '#F1F5F9', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Fee Type</th>
                            <th style={{ padding: '6px 10px', textAlign: 'right' }}>Amount (₹)</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center' }}>Grade</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center' }}>Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {excelImportRows.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '6px 10px', fontWeight: 700 }}>{row.fee_type}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: '#4F46E5' }}>₹ {row.amount.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>{row.grade || excelTargetGrade}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748B' }}>{row.due_date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsExcelImportModalOpen(false)}>
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    disabled={importingExcel || excelImportRows.length === 0} 
                    onClick={handleApplyExcelStructure}
                    style={{ background: '#059669', color: 'white', padding: '0.75rem 1.5rem', fontWeight: 800 }}
                  >
                    {importingExcel ? 'Applying Structure...' : `Apply & Assign to ${excelTargetGrade} (${excelImportRows.length} Heads)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collect Payment Modal */}
        {paymentModalVisible && selectedStudentFee && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '480px' }}>
              <div className="modal-header">
                <h2>Record Fee Payment</h2>
                <button className="icon-btn" onClick={() => setPaymentModalVisible(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>STUDENT NAME</p>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.05rem', color: '#1E293B', fontWeight: 900 }}>{selectedStudentFee.first_name} {selectedStudentFee.last_name}</p>
                  <span style={{ fontSize: '0.75rem', color: '#6366F1', fontWeight: 700 }}>ADM: {selectedStudentFee.admission_number || 'N/A'} ({selectedStudentFee.grade})</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>PENDING BALANCE</p>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.35rem', color: '#DC2626', fontWeight: 900 }}>₹ {parseFloat(selectedStudentFee.balance || '0').toLocaleString('en-IN')}</p>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                    Total: ₹{parseFloat(selectedStudentFee.total_due || '0').toLocaleString('en-IN')} | Paid: ₹{parseFloat(selectedStudentFee.total_paid || '0').toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Scheduled Pending Milestones */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.85rem', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534' }}>
                    📋 SCHEDULED INSTALLMENTS TO COLLECT:
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 700 }}>
                    Click button to select installment
                  </span>
                </div>

                {loadingMilestones ? (
                  <p style={{ margin: '0.4rem 0', fontSize: '0.75rem', color: '#166534' }}>Loading pending installments...</p>
                ) : studentPendingMilestones.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {studentPendingMilestones.map((m, idx) => {
                      const due = parseFloat(m.amount_due || '0');
                      const paid = parseFloat(m.total_paid || '0');
                      const unpaid = Math.max(0, due - paid);
                      const mId = m.id !== undefined && m.id !== null ? m.id : `idx-${idx}`;
                      const isSelected = selectedMilestoneId === mId;

                      return (
                        <div key={m.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isSelected ? '#DCFCE7' : 'white', border: isSelected ? '1.5px solid #16A34A' : '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>{m.fee_type}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                              Due Date: {formatDisplayDate(m.due_date, 'Scheduled')} {paid > 0 ? `(₹${paid.toLocaleString('en-IN')} already paid)` : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMilestoneId(mId);
                              setPaymentAmount(String(unpaid));
                              setPaymentNotes(`Payment for ${m.fee_type}`);
                            }}
                            style={{
                              background: isSelected ? '#15803D' : '#EEF2FF',
                              color: isSelected ? 'white' : '#4F46E5',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            ₹{unpaid.toLocaleString('en-IN')} {isSelected ? '✓ Selected' : 'Collect'}
                          </button>
                        </div>
                      );
                    })}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const bal = parseFloat(selectedStudentFee.balance || '0');
                          setSelectedMilestoneId('ALL');
                          setPaymentAmount(String(bal));
                          setPaymentNotes('Full Settlement of Remaining Balance');
                        }}
                        style={{
                          background: selectedMilestoneId === 'ALL' ? '#15803D' : '#ECFDF5',
                          border: selectedMilestoneId === 'ALL' ? '1.5px solid #16A34A' : '1px solid #10B981',
                          color: selectedMilestoneId === 'ALL' ? 'white' : '#047857',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Pay Entire Remaining Balance (₹{parseFloat(selectedStudentFee.balance || '0').toLocaleString('en-IN')}) {selectedMilestoneId === 'ALL' ? '✓ Selected' : ''}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    No separate milestone records found. You can enter any amount below to collect against remaining balance.
                  </div>
                )}
              </div>

              <form onSubmit={handlePaymentSubmit} className="modal-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Amount Paid (₹) <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={paymentAmount}
                      onChange={(e) => {
                        setPaymentAmount(e.target.value);
                        setSelectedMilestoneId(null);
                      }}
                      style={{ fontSize: '1.1rem', fontWeight: 800, padding: '0.6rem' }}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Mode</label>
                    <select 
                      className="input-field" 
                      value={paymentMode} 
                      onChange={(e) => setPaymentMode(e.target.value)}
                      style={{ padding: '0.6rem', fontWeight: 700 }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online / UPI">Online / UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="DD">Demand Draft (DD)</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Receipt No.</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Date</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>UTR No. / Transaction Ref / Cheque No. (Optional)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. UTR# 492019385012 / UPI Ref #987212 / Cheque #00412" 
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label>Remarks / Notes</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Paid via PhonePe by Father" 
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={paying} style={{ width: '100%', background: '#059669', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '0.75rem', fontWeight: 900, fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)' }}>
                  {paying ? 'Processing & Generating Receipt...' : 'Confirm Payment & Generate Receipt 🧾'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Printable Official Fee Receipt Modal */}
        {receiptModalVisible && receiptData && (
          <div className="modal-overlay">
            {/* Print CSS Rules */}
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 8mm;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  height: auto !important;
                  min-height: 0 !important;
                  overflow: visible !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                }
                .sidebar, header, .header, .glass-card, .no-print, .modal-header, .modal-actions, .bg-decorations-container, .decor {
                  display: none !important;
                }
                .dashboard-layout, .main-content {
                  display: block !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  max-height: none !important;
                  overflow: visible !important;
                  background: transparent !important;
                  position: static !important;
                  transform: none !important;
                }
                .modal-overlay {
                  position: static !important;
                  display: block !important;
                  width: 100% !important;
                  height: auto !important;
                  min-height: 0 !important;
                  background: transparent !important;
                  backdrop-filter: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: visible !important;
                  box-shadow: none !important;
                  inset: auto !important;
                  transform: none !important;
                }
                .modal-content {
                  position: static !important;
                  display: block !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  height: auto !important;
                  max-height: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: visible !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: #ffffff !important;
                  border-radius: 0 !important;
                  transform: none !important;
                }
                #printable-receipt {
                  position: static !important;
                  display: block !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 12px 18px !important;
                  box-shadow: none !important;
                  border: 2px solid #000000 !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  page-break-inside: avoid !important;
                }
              }
            `}</style>
            <div className="modal-content" style={{ width: '650px', background: 'white' }}>
              <div className="modal-header" style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2>Official Fee Receipt</h2>
                  <span style={{ 
                    background: (receiptData.balanceRemaining === 0 || receiptData.receiptNo?.endsWith('1')) ? '#DCFCE7' : '#FEF3C7', 
                    color: (receiptData.balanceRemaining === 0 || receiptData.receiptNo?.endsWith('1')) ? '#166534' : '#92400E', 
                    padding: '3px 10px', borderRadius: '12px', fontWeight: 900, fontSize: '0.75rem' 
                  }}>
                    {(receiptData.balanceRemaining === 0 || receiptData.receiptNo?.endsWith('1')) ? 'ORIGINAL RECEIPT' : 'DUPLICATE RECEIPT'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" onClick={() => alert(`📧 Fee Invoice & Receipt ${receiptData.receiptNo} emailed to parent!`)} style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                    📧 Email Parent
                  </button>
                  <button className="btn-primary" onClick={handlePrintReceipt} style={{ background: '#0D9488', padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Printer size={16} /> Print Receipt
                  </button>
                  <button className="icon-btn" onClick={() => setReceiptModalVisible(false)}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Printable Receipt Paper Body */}
              <div id="printable-receipt" style={{ padding: '1.5rem', background: '#FFFFFF', color: '#0F172A', fontFamily: 'sans-serif' }}>
                
                {/* Header */}
                <div style={{ textTransform: 'uppercase', textAlign: 'center', borderBottom: '2px dashed #CBD5E1', paddingBottom: '1rem', marginBottom: '1.25rem', position: 'relative' }}>
                  <span style={{ 
                    position: 'absolute', top: 0, right: 0, 
                    border: (receiptData.balanceRemaining === 0 || receiptData.receiptNo?.endsWith('1')) ? '2px solid #166534' : '2px dashed #D97706',
                    color: (receiptData.balanceRemaining === 0 || receiptData.receiptNo?.endsWith('1')) ? '#166534' : '#D97706',
                    padding: '2px 8px', fontSize: '0.65rem', fontWeight: 900, borderRadius: '4px', textTransform: 'uppercase'
                  }}>
                    {(receiptData.balanceRemaining === 0 || receiptData.receiptNo?.endsWith('1')) ? 'ORIGINAL' : 'DUPLICATE'}
                  </span>
                  <h2 style={{ margin: 0, color: '#1E3A8A', fontSize: '1.4rem', fontWeight: 900 }}>EduNeev Kids Preschool</h2>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>"A Foundation for the future... Since 2013"</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>RL-32, G Block, Sambhajinagar, Chinchwad, Pune - 411019</p>
                </div>

                {/* Receipt Title & Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  <div>
                    <div><strong>Receipt No:</strong> <span style={{ color: '#6366F1', fontWeight: 800 }}>{receiptData.receiptNo}</span></div>
                    <div><strong>Date:</strong> {receiptData.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>Admission No:</strong> {receiptData.admissionNo}</div>
                    <div><strong>Class:</strong> {receiptData.grade}</div>
                  </div>
                </div>

                {/* Student Info */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.95rem' }}><strong>Student Name:</strong> <span style={{ color: '#0F172A', fontWeight: 800 }}>{receiptData.studentName}</span></div>
                </div>

                {/* Payment Breakdown Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#EEF2FF', color: '#3730A3' }}>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        {receiptData.feeType || 'Fee Payment'}
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Mode: {receiptData.paymentMode} {receiptData.transactionRef ? `(${receiptData.transactionRef})` : ''}</div>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                        ₹ {receiptData.amountPaid.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals & Balance */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #E2E8F0', paddingTop: '0.75rem', fontSize: '1rem', fontWeight: 800, marginBottom: '2rem' }}>
                  <span>Total Amount Received:</span>
                  <span style={{ color: '#059669', fontSize: '1.2rem' }}>₹ {receiptData.amountPaid.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '2rem' }}>
                  <div>Remaining Balance Due: <strong style={{ color: receiptData.balanceRemaining > 0 ? '#DC2626' : '#059669' }}>₹ {receiptData.balanceRemaining.toLocaleString()}</strong></div>
                  <div>Status: <strong style={{ color: receiptData.balanceRemaining === 0 ? '#059669' : '#D97706' }}>{receiptData.balanceRemaining === 0 ? 'FULLY CLEARED ✅' : 'PARTIAL PAYMENT'}</strong></div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #CBD5E1', fontSize: '0.8rem', color: '#64748B' }}>
                  <div>Parent Signature</div>
                  <div style={{ textAlign: 'right' }}>Authorised Signature / Seal<br /><strong>EduNeev Kids Preschool</strong></div>
                </div>

              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setReceiptModalVisible(false)}>Close</button>
                <button type="button" className="btn-primary" onClick={handlePrintReceipt} style={{ background: '#6366F1' }}>
                  <Printer size={16} /> Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Payment Transaction History Ledger Modal */}
        {isLedgerModalOpen && selectedLedgerStudent && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px', background: 'white' }}>
              <div className="modal-header">
                <div>
                  <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                    FEE TRANSACTION LEDGER
                  </span>
                  <h2 style={{ margin: '0.3rem 0 0 0', fontSize: '1.25rem', color: '#0F172A', fontWeight: 900 }}>
                    Payment History — {selectedLedgerStudent.first_name} {selectedLedgerStudent.last_name}
                  </h2>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    ADM: {selectedLedgerStudent.admission_number || 'N/A'} • Class: {selectedLedgerStudent.grade || 'Nursery'}
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setIsLedgerModalOpen(false)}><X size={20} /></button>
              </div>

              <div style={{ padding: '1rem 0' }}>
                {/* Balance Cards Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>TOTAL ASSIGNED FEE</span>
                    <div style={{ fontSize: '1.15rem', color: '#1E293B', fontWeight: 900, marginTop: '0.2rem' }}>
                      ₹ {parseFloat(selectedLedgerStudent.total_due || '17000').toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: '#ECFDF5', padding: '0.85rem', borderRadius: '8px', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 800 }}>TOTAL PAID</span>
                    <div style={{ fontSize: '1.15rem', color: '#059669', fontWeight: 900, marginTop: '0.2rem' }}>
                      ₹ {parseFloat(selectedLedgerStudent.total_paid || '1000').toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: '#FEF2F2', padding: '0.85rem', borderRadius: '8px', border: '1px solid #FECACA', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 800 }}>OUTSTANDING BALANCE</span>
                    <div style={{ fontSize: '1.15rem', color: '#DC2626', fontWeight: 900, marginTop: '0.2rem' }}>
                      ₹ {parseFloat(selectedLedgerStudent.balance || '16000').toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Transaction Ledger Table */}
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.75rem' }}>
                  Chronological Payment History
                </h3>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Receipt No.</th>
                      <th>Amount Paid</th>
                      <th>Mode & Ref</th>
                      <th>Balance Left</th>
                      <th>Print</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '1.75rem', color: '#64748B', fontWeight: 600 }}>
                          No payment transactions recorded yet for this student.
                        </td>
                      </tr>
                    ) : (
                      ledgerTransactions.map((tx: any, idx: number) => (
                        <tr key={tx.id || idx}>
                          <td style={{ fontWeight: 700, color: '#0F172A' }}>{tx.date || tx.created_at?.split('T')[0]}</td>
                          <td>
                            <span style={{ color: '#4F46E5', fontWeight: 900 }}>{tx.receipt_no || tx.razorpay_order_id}</span>
                          </td>
                          <td style={{ fontWeight: 900, color: '#059669' }}>
                            ₹ {parseFloat(tx.amount || tx.amount_paid || '0').toLocaleString()}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{tx.payment_method || 'Cash'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{tx.ref_no || tx.razorpay_payment_id || '-'}</div>
                          </td>
                          <td style={{ fontWeight: 800, color: '#DC2626' }}>
                            ₹ {(tx.balance_after !== undefined ? tx.balance_after : 0).toLocaleString()}
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setEduneevInvoiceData({
                                  invoiceNo: tx.receipt_no || tx.razorpay_order_id || '064',
                                  date: tx.date || new Date().toLocaleDateString('en-IN'),
                                  customerName: `${selectedLedgerStudent.first_name} ${selectedLedgerStudent.last_name}`,
                                  admissionNo: selectedLedgerStudent.admission_number || 'N/A',
                                  grade: selectedLedgerStudent.grade || 'Nursery',
                                  addedBy: getLoggedInAdminAttribution(),
                                  items: [
                                    {
                                      srNo: 1,
                                      description: tx.feeType || 'School Tuition Installment',
                                      qty: 1,
                                      rate: parseFloat(tx.amount || tx.amount_paid || '0'),
                                      amount: parseFloat(tx.amount || tx.amount_paid || '0')
                                    }
                                  ]
                                });
                                setIsLedgerModalOpen(false);
                                setIsEduneevInvoiceOpen(true);
                              }}
                              style={{ background: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                              🖨️ Receipt
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
                  <button className="btn-secondary" onClick={() => setIsLedgerModalOpen(false)}>Close Ledger</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authentic EDUNEEV KIDS Invoice Slip Modal */}
        <EduneevInvoiceModal
          isOpen={isEduneevInvoiceOpen}
          onClose={() => setIsEduneevInvoiceOpen(false)}
          data={eduneevInvoiceData}
        />

        {/* Comprehensive Defaulters & Pending Fees Statement Report Modal */}
        {isPendingReportModalOpen && (() => {
          const reportStudents = branchFilteredStudents.filter(fee => {
            const bal = parseFloat(fee.balance || '0');
            if (bal <= 0) return false;

            if (reportGradeFilter !== 'All' && fee.grade !== reportGradeFilter) return false;

            if (reportSearchQuery.trim()) {
              const term = reportSearchQuery.toLowerCase().trim();
              return (
                `${fee.first_name} ${fee.last_name}`.toLowerCase().includes(term) ||
                (fee.admission_number || '').toLowerCase().includes(term) ||
                (fee.parent_name || '').toLowerCase().includes(term) ||
                (fee.parent_phone || '').includes(term)
              );
            }
            return true;
          });

          const reportTotalPending = reportStudents.reduce((acc, s) => acc + (parseFloat(s.balance) || 0), 0);
          const reportTotalDue = reportStudents.reduce((acc, s) => acc + (parseFloat(s.total_due) || 0), 0);
          const reportTotalPaid = reportStudents.reduce((acc, s) => acc + (parseFloat(s.total_paid) || 0), 0);

          return (
            <div className="modal-overlay" style={{ zIndex: 9999 }}>
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #printable-pending-report, #printable-pending-report * {
                    visibility: visible;
                  }
                  #printable-pending-report {
                    position: fixed !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100vw !important;
                    padding: 20px !important;
                    background: white !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}</style>
              <div className="modal-content" style={{ maxWidth: '980px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'white' }}>
                {/* Modal Top Control Header */}
                <div className="modal-header no-print" style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '0.85rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                      📊 Pending Fees & Defaulters Statement Report
                    </h2>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                      Branch: <strong>{selectedBranchFilter}</strong> | Prepared By: <strong>{getLoggedInAdminAttribution()}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => exportPendingFeesCSV(reportStudents)}
                      style={{
                        background: '#047857', color: 'white', border: 'none',
                        padding: '0.45rem 0.95rem', borderRadius: '6px', fontWeight: 800,
                        fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                      title="Download CSV / Excel spreadsheet"
                    >
                      <Download size={15} /> Export CSV
                    </button>
                    <button
                      onClick={() => window.print()}
                      style={{
                        background: '#1E293B', color: 'white', border: 'none',
                        padding: '0.45rem 0.95rem', borderRadius: '6px', fontWeight: 800,
                        fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Printer size={15} /> Print Report
                    </button>
                    <button className="icon-btn" onClick={() => setIsPendingReportModalOpen(false)}>
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Filter Toolbar (No Print) */}
                <div className="no-print" style={{ padding: '0.85rem 0', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #F1F5F9' }}>
                  <div className="search-box" style={{ width: '280px' }}>
                    <Search size={16} className="text-muted" />
                    <input
                      type="text"
                      placeholder="Search student or phone..."
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
                    <button
                      onClick={() => setReportGradeFilter('All')}
                      style={{
                        padding: '0.35rem 0.75rem', borderRadius: '99px', fontWeight: 700, border: 'none', cursor: 'pointer',
                        background: reportGradeFilter === 'All' ? '#6366F1' : '#F1F5F9',
                        color: reportGradeFilter === 'All' ? 'white' : '#475569', fontSize: '0.8rem'
                      }}
                    >
                      All Grades
                    </button>
                    {availableClasses.map(g => (
                      <button
                        key={g}
                        onClick={() => setReportGradeFilter(g)}
                        style={{
                          padding: '0.35rem 0.75rem', borderRadius: '99px', fontWeight: 700, border: 'none', cursor: 'pointer',
                          background: reportGradeFilter === g ? '#6366F1' : '#F1F5F9',
                          color: reportGradeFilter === g ? 'white' : '#475569', fontSize: '0.8rem'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Printable Report Document Body */}
                <div id="printable-pending-report" style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
                  {/* Official Header */}
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0F172A', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      EDUNEEV KIDS PRESCHOOL & DAYCARE
                    </h1>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginTop: '0.2rem' }}>
                      OUTSTANDING PENDING FEES & DEFAULTERS STATEMENT
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                      <span>Branch: <strong>{selectedBranchFilter}</strong></span>
                      <span>Statement Date: <strong>{formatDateToDDMMYYYY(new Date())}</strong></span>
                      <span>Prepared By: <strong>{getLoggedInAdminAttribution()}</strong></span>
                    </div>
                  </div>

                  {/* Summary Metric Stats Ribbon */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: '#FEF2F2', border: '1.5px solid #F87171', borderRadius: '8px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase' }}>Total Defaulters</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#DC2626', marginTop: '0.2rem' }}>{reportStudents.length} Students</div>
                    </div>
                    <div style={{ background: '#FEF3C7', border: '1.5px solid #FBBF24', borderRadius: '8px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>Total Outstanding Balance</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#B45309', marginTop: '0.2rem' }}>₹ {reportTotalPending.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '8px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Assigned vs Collected</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#15803D', marginTop: '0.4rem' }}>
                        ₹ {reportTotalDue.toLocaleString()} / ₹ {reportTotalPaid.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Defaulters Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#0F172A', color: 'white', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem 0.6rem', width: '5%' }}>#</th>
                        <th style={{ padding: '0.5rem 0.6rem' }}>Student Name & Adm</th>
                        <th style={{ padding: '0.5rem 0.6rem' }}>Class</th>
                        <th style={{ padding: '0.5rem 0.6rem' }}>Parent & Phone</th>
                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>Total Fee</th>
                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>Paid</th>
                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>Pending Due</th>
                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>Installment Status</th>
                        <th className="no-print" style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportStudents.length > 0 ? (
                        reportStudents.map((s, idx) => {
                          const bal = parseFloat(s.balance || '0');
                          const isOverdue = s.earliest_due_date && new Date(s.earliest_due_date) < new Date();
                          return (
                            <tr key={s.student_id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                              <td style={{ padding: '0.5rem 0.6rem', fontWeight: 800 }}>{idx + 1}</td>
                              <td style={{ padding: '0.5rem 0.6rem' }}>
                                <div style={{ fontWeight: 800, color: '#0F172A' }}>{s.first_name} {s.last_name}</div>
                                {s.admission_number && <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ADM: {s.admission_number}</div>}
                              </td>
                              <td style={{ padding: '0.5rem 0.6rem', fontWeight: 700 }}>{s.grade || 'N/A'}</td>
                              <td style={{ padding: '0.5rem 0.6rem' }}>
                                {s.parent_name && <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.8rem' }}>{s.parent_name}</div>}
                                {s.parent_phone ? (
                                  <a href={`tel:${s.parent_phone}`} style={{ color: '#0A66C2', textDecoration: 'none', fontWeight: 800, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }} title="Call Parent">
                                    <Phone size={11} /> {s.parent_phone}
                                  </a>
                                ) : (
                                  <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>
                                ₹ {parseFloat(s.total_due).toLocaleString()}
                              </td>
                              <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                ₹ {parseFloat(s.total_paid).toLocaleString()}
                              </td>
                              <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 900, color: '#DC2626', fontSize: '0.95rem' }}>
                                ₹ {bal.toLocaleString()}
                              </td>
                              <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>
                                {s.earliest_due_date ? (
                                  <span style={{
                                    background: isOverdue ? '#FEE2E2' : '#FEF3C7',
                                    color: isOverdue ? '#DC2626' : '#92400E',
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800
                                  }}>
                                    {isOverdue ? '🔴 Overdue: ' : '📅 Due: '} {formatDateToDDMMYYYY(s.earliest_due_date)}
                                  </span>
                                ) : (
                                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                    Pending Follow-up
                                  </span>
                                )}
                              </td>
                              <td className="no-print" style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>
                                <button
                                  onClick={() => {
                                    setIsPendingReportModalOpen(false);
                                    handleOpenPaymentModal(s);
                                  }}
                                  style={{
                                    background: '#4F46E5', color: 'white', border: 'none',
                                    padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem',
                                    fontWeight: 800, cursor: 'pointer'
                                  }}
                                >
                                  Collect
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontWeight: 700 }}>
                            🎉 Great news! No students with pending fees found for the selected criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Signatures on printable statement */}
                  <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', padding: '0 2rem' }}>
                    <div style={{ textAlign: 'center', width: '220px' }}>
                      <div style={{ borderBottom: '1.5px solid #000', marginBottom: '0.35rem' }} />
                      <div style={{ fontSize: '0.78rem', fontWeight: 900 }}>Prepared By</div>
                      <div style={{ fontSize: '0.72rem', color: '#475569' }}>{getLoggedInAdminAttribution()}</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '220px' }}>
                      <div style={{ borderBottom: '1.5px solid #000', marginBottom: '0.35rem' }} />
                      <div style={{ fontSize: '0.78rem', fontWeight: 900 }}>Authorised Signatory</div>
                      <div style={{ fontSize: '0.72rem', color: '#475569' }}>Franchise / Finance Admin</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
};

export default FeesManagement;

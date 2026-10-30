import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import SmartSidebar from '../../components/SmartSidebar';
import { Search, Plus, Edit2, Trash2, X, ArrowUpRight, Hash, ArrowLeft, User, Users, DollarSign, Megaphone, Printer, Eye, GraduationCap, ArrowRight } from 'lucide-react';
import './Directory.css';

interface Student {
  id: string; 
  first_name: string;
  last_name: string;
  admission_number: string;
  roll_number: string;
  grade: string;
  gender: string;
  date_of_birth: string;
  created_at?: string;
  blood_group?: string;
  medical_notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  parent_name?: string;
  parent_email?: string;
  contact_number?: string;
  alternative_mobile?: string;
  address?: string;
  school_name?: string;
  school_id?: string;
}

const REFERRAL_SOURCES = [
  'Friends', 'Banner', 'Pamphlet', 'Internet', 'Newspaper ad', 'Auto backs', 
  'TV ad', 'Poster', 'Hoarding', 'Magazine ad', 'Kiosk', 'Bus advertisement', 'Other'
];

const StudentsDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isRollNoModalOpen, setIsRollNoModalOpen] = useState(false);
  
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [parsedNotes, setParsedNotes] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Initial Form Data State matching EduNeev Kids Paper Admission Form
  const initialFormState = {
    // Child Information
    firstName: '',
    lastName: '',
    admissionNumber: '',
    grade: 'Nursery',
    isDaycareEnrolled: false,
    daycareBatch: 'After School (Half Day)',
    gender: 'male',
    dateOfBirth: '',
    bloodGroup: '',

    // Father Details
    fatherName: '',
    fatherOccupation: '',
    fatherPhone: '',

    // Mother Details
    motherName: '',
    motherOccupation: '',
    motherPhone: '',

    // Contact & Residence
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentAltPhone: '',
    parentAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',

    // Referral & Centre
    sourceOfEnquiry: 'Friends',
    enrolmentCentre: '',

    // Office Use Only
    amountPaid: '',
    receiptNo: '',
    dateOfEnrolment: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    identityCardNo: '',
    chequeDetails: '',
    balanceAmount: '',
    dueDates: '',
    admissionKit: 'To be given',
    uniformSize: 'Size 24 (M)',
    booksIssued: 'Yes',
    bagsIssued: 'Yes',
    followUpNotes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const [promoteData, setPromoteData] = useState({
    fromGrade: 'Nursery',
    toGrade: 'Jr KG'
  });
  const [selectedPromoteStudentIds, setSelectedPromoteStudentIds] = useState<string[]>([]);
  const [promoteSearchQuery, setPromoteSearchQuery] = useState('');

  const [rollNoGrade, setRollNoGrade] = useState('Nursery');

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userRole = (loggedUser?.role || 'school_admin').toLowerCase();
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = isSuperAdmin || userRole === 'school_admin' || userRole === 'owner';
  const isTeacher = userRole === 'teacher';
  const isParent = userRole === 'parent';

  // Dedicated Teacher Assigned Grade Resolution
  const teacherAssignedGrade = loggedUser?.grade || loggedUser?.assigned_grade || loggedUser?.class || loggedUser?.class_name || loggedUser?.department || '';

  const userBranch = (() => {
    if (isSuperAdmin) return 'All';
    if (loggedUser?.school_name) return loggedUser.school_name;
    if (loggedUser?.branchName) return loggedUser.branchName;
    const nameStr = `${loggedUser?.firstName || ''} ${loggedUser?.lastName || ''} ${loggedUser?.email || ''}`.toLowerCase();
    if (nameStr.includes('chikhali')) return 'Chikhali Branch';
    if (nameStr.includes('dudulgaon')) return 'Dudulgaon Branch';
    return 'Chinchwad Branch';
  })();

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(userBranch);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(() => {
    if (isTeacher && teacherAssignedGrade) {
      return teacherAssignedGrade;
    }
    return 'All';
  });
  const [availableClasses, setAvailableClasses] = useState<string[]>([
    'Playgroup', 'Nursery', 'LKG', 'UKG', 
    'Daycare', 'Daycare - Infant', 'Daycare - Toddler', 'Daycare - Junior', 'Daycare - After School'
  ]);
  const [dbBranches, setDbBranches] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/franchise/branches').then(res => {
      if (res.data?.data) setDbBranches(res.data.data);
    }).catch(() => {});

    if (isTeacher && teacherAssignedGrade) {
      setSelectedClassFilter(teacherAssignedGrade);
    }
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const schoolIdParam = selectedBranchFilter !== 'All' 
        ? dbBranches.find(b => b.name === selectedBranchFilter)?.id 
        : undefined;
      const response = await apiClient.get('/admin/students', {
        params: schoolIdParam ? { school_id: schoolIdParam } : undefined
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/classes');
      if (Array.isArray(response.data) && response.data.length > 0) {
        const dbClassNames = response.data.map((c: any) => c.name).filter((name: string) => name && name.trim().toLowerCase() !== 'kg');
        if (isTeacher && teacherAssignedGrade) {
          setAvailableClasses([teacherAssignedGrade]);
          setSelectedClassFilter(teacherAssignedGrade);
        } else {
          setAvailableClasses(dbClassNames.length > 0 ? dbClassNames : ['Playgroup', 'Nursery', 'LKG', 'UKG', 'Daycare']);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch dynamic classes from backend, using defaults', e);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [selectedBranchFilter]);

  const getPrefixForGrade = (targetGrade: string) => {
    const GRADE_PREFIXES: Record<string, string> = {
      'Playgroup': 'PG',
      'Nursery': 'NUR',
      'LKG': 'LKG',
      'Jr KG': 'LKG',
      'UKG': 'UKG',
      'Sr KG': 'UKG',
      'Daycare': 'DC',
      'Daycare - Infant': 'DC-INF',
      'Daycare - Toddler': 'DC-TOD',
      'Daycare - Junior': 'DC-JR',
      'Daycare - After School': 'DC-AS',
    };
    if (GRADE_PREFIXES[targetGrade]) return GRADE_PREFIXES[targetGrade];
    const clean = targetGrade.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    const words = clean.split(/\s+/);
    if (words.length > 1) {
      return words.map(w => w[0]?.toUpperCase()).join('');
    }
    return clean.substring(0, 3).toUpperCase() || 'ADM';
  };

  const getAutoAdmissionNumber = (targetGrade: string, currentStudents: Student[] = students) => {
    const prefix = getPrefixForGrade(targetGrade);
    let maxNum = 0;
    
    currentStudents.forEach(s => {
      if (s.admission_number) {
        const parts = s.admission_number.split('-');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num)) {
          if (parts[0].toUpperCase() === prefix.toUpperCase() || s.grade === targetGrade) {
            if (num > maxNum) maxNum = num;
          }
        }
      }
    });

    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const fetchNextAdmissionNumber = async (selectedGrade: string) => {
    try {
      const response = await apiClient.get(`/admin/next-admission-number?grade=${encodeURIComponent(selectedGrade)}`);
      if (response.data?.nextNumber) {
        setFormData(prev => ({
          ...prev,
          grade: selectedGrade,
          admissionNumber: response.data.nextNumber
        }));
        return;
      }
    } catch (_e) {
      console.warn('Using client fallback for next admission number');
    }
    const fallbackNo = getAutoAdmissionNumber(selectedGrade);
    setFormData(prev => ({
      ...prev,
      grade: selectedGrade,
      admissionNumber: fallbackNo
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'grade') {
      const isDual = value.includes('+ Daycare');
      const baseGrade = isDual ? value.replace('+ Daycare', '').trim() : value;
      fetchNextAdmissionNumber(baseGrade);
      if (isDual) {
        setFormData(prev => ({
          ...prev,
          grade: baseGrade,
          isDaycareEnrolled: true,
          daycareBatch: prev.daycareBatch || 'After School (Half Day)'
        }));
      } else if (value.toLowerCase().includes('daycare')) {
        setFormData(prev => ({
          ...prev,
          grade: value,
          isDaycareEnrolled: true,
          daycareBatch: prev.daycareBatch || 'Full Day Daycare'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          grade: baseGrade
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getNextGradeSuggestion = (grade: string) => {
    const targetNext: Record<string, string> = {
      'Playgroup': 'Nursery',
      'Nursery': 'Jr KG',
      'Jr KG': 'Sr KG',
      'Sr KG': 'Grade 1 / Passed Out'
    };
    return targetNext[grade] || availableClasses.find(c => c !== grade) || 'Nursery';
  };

  const openPromoteModal = (fromGradeParam?: string) => {
    const fromG = fromGradeParam || (selectedClassFilter !== 'All' ? selectedClassFilter : (availableClasses[0] || 'Nursery'));
    const toG = getNextGradeSuggestion(fromG);
    setPromoteData({
      fromGrade: fromG,
      toGrade: toG
    });
    setPromoteSearchQuery('');
    const matching = students.filter(s => 
      (s.grade || '').toLowerCase() === fromG.toLowerCase() &&
      (s as any).is_active !== false
    );
    setSelectedPromoteStudentIds(matching.map(s => s.id));
    setIsPromoteModalOpen(true);
  };

  const togglePromoteStudent = (studentId: string) => {
    setSelectedPromoteStudentIds(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllPromote = (allIds: string[]) => {
    if (selectedPromoteStudentIds.length === allIds.length) {
      setSelectedPromoteStudentIds([]);
    } else {
      setSelectedPromoteStudentIds(allIds);
    }
  };

  const handlePromoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'fromGrade') {
      const newTo = getNextGradeSuggestion(value);
      setPromoteData(prev => ({ ...prev, fromGrade: value, toGrade: newTo }));
      const matching = students.filter(s => 
        (s.grade || '').toLowerCase() === value.toLowerCase() &&
        (s as any).is_active !== false
      );
      setSelectedPromoteStudentIds(matching.map(s => s.id));
    } else {
      setPromoteData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getAutoReceiptNumber = (targetBranchName: string = 'Chinchwad Branch', currentStudents: Student[] = students) => {
    const currentYear = new Date().getFullYear();
    let branchCode = 'CHI';
    const lower = (targetBranchName || '').toLowerCase();
    if (lower.includes('chinchwad')) branchCode = 'CHI';
    else if (lower.includes('chikhali')) branchCode = 'CHK';
    else if (lower.includes('dudulgaon')) branchCode = 'DUD';
    else {
      const clean = targetBranchName.trim().toUpperCase().replace(/BRANCH/gi, '').trim();
      branchCode = clean.slice(0, 3) || 'CHI';
    }

    const prefix = `REC-${branchCode}-${currentYear}-`;
    let maxNum = 0;
    
    currentStudents.forEach(s => {
      let rNo = '';
      if (s.medical_notes) {
        try {
          const parsed = typeof s.medical_notes === 'string' ? JSON.parse(s.medical_notes) : s.medical_notes;
          rNo = parsed.receiptNo || '';
        } catch {}
      }
      if (rNo && rNo.startsWith(prefix)) {
        const parts = rNo.split('-');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handlePrintAdmissionForm = () => {
    const s = currentStudent;
    if (!s) return;
    const n = parsedNotes;
    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) return;
    const dob = s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('en-IN') : '-';
    const admDate = s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : '-';
    const gender = s.gender ? (s.gender.charAt(0).toUpperCase() + s.gender.slice(1)) : '-';
    const printedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Admission Form - ${s.first_name} ${s.last_name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;}
  .page{width:210mm;min-height:297mm;margin:0 auto;padding:12mm 14mm;}

  /* HEADER */
  .hdr{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0D9488;padding-bottom:10px;margin-bottom:14px;}
  .hdr-left{display:flex;align-items:center;gap:12px;}
  .hdr-left img{height:52px;}
  .sname{font-size:20px;font-weight:800;color:#0F172A;letter-spacing:.5px;line-height:1.1;}
  .ssub{font-size:10px;color:#64748B;font-weight:500;margin-top:2px;}
  .badge{background:linear-gradient(135deg,#0D9488,#0891b2);color:#fff;font-size:10px;font-weight:700;padding:5px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:.8px;}

  /* META STRIP */
  .meta{display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px 14px;margin-bottom:16px;}
  .mi{text-align:center;}
  .ml{font-size:9px;color:#64748B;text-transform:uppercase;letter-spacing:.5px;font-weight:600;}
  .mv{font-size:13px;font-weight:800;margin-top:2px;}
  .mv.teal{color:#0D9488;} .mv.ind{color:#4F46E5;} .mv.dk{color:#0F172A;}
  .mdiv{width:1px;height:36px;background:#CBD5E1;}

  /* SECTION */
  .sec{margin-bottom:14px;}
  .stitle{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;padding:5px 10px;border-radius:5px;margin-bottom:8px;}
  .stitle.teal{color:#0D9488;background:#F0FDFA;border-left:3px solid #0D9488;}
  .stitle.ind{color:#4F46E5;background:#EEF2FF;border-left:3px solid #4F46E5;}
  .stitle.org{color:#EA580C;background:#FFF7ED;border-left:3px solid #EA580C;}
  .stitle.dk{color:#0F172A;background:#F1F5F9;border-left:3px solid #0F172A;}

  /* FIELD GRID */
  .fg{display:grid;gap:0;border:1px solid #E2E8F0;border-radius:6px;overflow:hidden;}
  .fg.c2{grid-template-columns:1fr 1fr;}
  .fg.c3{grid-template-columns:1fr 1fr 1fr;}
  .fc{padding:7px 10px;border-right:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;background:#fff;}
  .fg.c2 .fc:nth-child(2n){border-right:none;}
  .fg.c3 .fc:nth-child(3n){border-right:none;}
  .fc.full{grid-column:1/-1;border-right:none;}
  .fl{font-size:9px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px;}
  .fv{font-size:11.5px;color:#0F172A;font-weight:600;}

  /* OFFICE TABLE */
  .ot{width:100%;border-collapse:collapse;border:1px solid #CBD5E1;border-radius:6px;overflow:hidden;}
  .ot th{background:#0F172A;color:#fff;font-size:10px;font-weight:700;padding:7px 10px;text-align:left;letter-spacing:.3px;}
  .ot td{padding:7px 10px;border:1px solid #E2E8F0;font-size:11px;vertical-align:top;}
  .ot td strong{font-size:9px;color:#64748B;font-weight:700;text-transform:uppercase;display:block;margin-bottom:2px;}
  .ot td span{color:#0F172A;font-weight:600;font-size:11.5px;}
  .ot tr:nth-child(even) td{background:#F8FAFC;}

  /* FOLLOW-UP */
  .follow{background:#FEF3C7;border:1px solid #FDE68A;border-left:3px solid #F59E0B;border-radius:6px;padding:8px 12px;margin-top:12px;font-size:11px;color:#92400E;}
  .follow strong{font-size:9px;text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:3px;color:#78350F;}

  /* SIGNATURES */
  .sigrow{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:28px;}
  .sigbox{border-top:1.5px solid #94A3B8;padding-top:5px;}
  .siglbl{font-size:9.5px;color:#475569;font-weight:600;text-align:center;}

  /* FOOTER */
  .foot{margin-top:14px;border-top:1px dashed #CBD5E1;padding-top:8px;display:flex;justify-content:space-between;}
  .ft{font-size:9px;color:#94A3B8;}

  @media print{
    @page{size:A4 portrait;margin:0;}
    body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}
    .page{padding:10mm 12mm;}
  }
</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="hdr-left">
      <img src="${window.location.origin}/logopre.png" alt="Logo"/>
      <div>
        <div class="sname">EDUNEEV KIDS PRESCHOOL</div>
        <div class="ssub">Official Digital Admission Form</div>
      </div>
    </div>
    <div class="badge">Admission Form</div>
  </div>

  <div class="meta">
    <div class="mi"><div class="ml">Admission No</div><div class="mv teal">${s.admission_number || '-'}</div></div>
    <div class="mdiv"></div>
    <div class="mi"><div class="ml">Enrolment Program</div><div class="mv ind">${s.grade || '-'}</div></div>
    <div class="mdiv"></div>
    <div class="mi"><div class="ml">Enrolment Centre</div><div class="mv dk">${n.enrolmentCentre || '-'}</div></div>
    <div class="mdiv"></div>
    <div class="mi"><div class="ml">Date of Admission</div><div class="mv dk">${admDate}</div></div>
  </div>

  <div class="sec">
    <div class="stitle teal">Child Details</div>
    <div class="fg c3">
      <div class="fc"><div class="fl">Child's Full Name</div><div class="fv">${s.first_name || ''} ${s.last_name || ''}</div></div>
      <div class="fc"><div class="fl">Gender</div><div class="fv">${gender}</div></div>
      <div class="fc"><div class="fl">Date of Birth</div><div class="fv">${dob}</div></div>
      <div class="fc"><div class="fl">Blood Group</div><div class="fv">${s.blood_group || '-'}</div></div>
      <div class="fc"><div class="fl">Roll Number</div><div class="fv">${s.roll_number || '-'}</div></div>
      <div class="fc"><div class="fl">Previous School</div><div class="fv">${s.school_name || '-'}</div></div>
    </div>
  </div>

  <div class="sec">
    <div class="stitle ind">Parents / Guardian Information</div>
    <div class="fg c2">
      <div class="fc"><div class="fl">Father's Name</div><div class="fv">${n.fatherName || s.parent_name || '-'}</div></div>
      <div class="fc"><div class="fl">Father's Occupation</div><div class="fv">${n.fatherOccupation || '-'}</div></div>
      <div class="fc"><div class="fl">Father's Mobile</div><div class="fv">${n.fatherPhone || s.contact_number || '-'}</div></div>
      <div class="fc"><div class="fl">Mother's Name</div><div class="fv">${n.motherName || '-'}</div></div>
      <div class="fc"><div class="fl">Mother's Occupation</div><div class="fv">${n.motherOccupation || '-'}</div></div>
      <div class="fc"><div class="fl">Mother's Mobile</div><div class="fv">${n.motherPhone || s.alternative_mobile || '-'}</div></div>
      <div class="fc"><div class="fl">Parents Email</div><div class="fv">${s.parent_email || '-'}</div></div>
      <div class="fc"><div class="fl">Emergency Contact</div><div class="fv">${s.emergency_contact_phone || '-'}</div></div>
      <div class="fc full"><div class="fl">Residential Address</div><div class="fv">${s.address || '-'}</div></div>
    </div>
  </div>

  <div class="sec">
    <div class="stitle org">Referral &amp; Centre Details</div>
    <div class="fg c2">
      <div class="fc"><div class="fl">Source of Enquiry</div><div class="fv">${n.sourceOfEnquiry || 'Friends'}</div></div>
      <div class="fc"><div class="fl">Enrolment Centre</div><div class="fv">${n.enrolmentCentre || '-'}</div></div>
    </div>
  </div>

  <div class="sec">
    <div class="stitle dk">For Office Use Only</div>
    <table class="ot">
      <thead>
        <tr><th>Amount Paid</th><th>Receipt No</th><th>Payment Mode</th><th>Date of Enrolment</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><span>&#8377;${n.amountPaid || '0'}</span></td>
          <td><span>${n.receiptNo || '-'}</span></td>
          <td><span>${n.paymentMode || 'Cash'}</span></td>
          <td><span>${n.dateOfEnrolment || '-'}</span></td>
        </tr>
        <tr>
          <td><strong>ID Card No</strong><span>${n.identityCardNo || '-'}</span></td>
          <td><strong>Cheque / DD Details</strong><span>${n.chequeDetails || '-'}</span></td>
          <td><strong>Balance Amount</strong><span>&#8377;${n.balanceAmount || '0'}</span></td>
          <td><strong>Admission Kit</strong><span>${n.admissionKit || 'To be given'}</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  ${n.followUpNotes ? `<div class="follow"><strong>Follow-up / Action Notes</strong>${n.followUpNotes}</div>` : ''}

  <div class="sigrow">
    <div class="sigbox"><div class="siglbl">Parent / Guardian Signature</div></div>
    <div class="sigbox"><div class="siglbl">Admission Coordinator</div></div>
    <div class="sigbox"><div class="siglbl">Principal / Director</div></div>
  </div>

  <div class="foot">
    <div class="ft">Eduneev Kids Preschool &mdash; Official Admission Record</div>
    <div class="ft">Printed on: ${printedOn}</div>
  </div>

</div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
  };



  const openAddModal = () => {
    const defaultGrade = 'Nursery';
    const userBranchName = loggedUser?.school_name || loggedUser?.branchName || (userBranch !== 'All' ? userBranch : 'Chinchwad Branch');
    const activeBranchName = selectedBranchFilter !== 'All' ? selectedBranchFilter : userBranchName;
    const autoNo = getAutoAdmissionNumber(defaultGrade);
    const autoReceipt = getAutoReceiptNumber(activeBranchName, students);
    setFormData({
      ...initialFormState,
      enrolmentCentre: activeBranchName,
      admissionNumber: autoNo,
      receiptNo: autoReceipt,
      grade: defaultGrade
    });
    fetchNextAdmissionNumber(defaultGrade);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const activeBranchObj = dbBranches.find(b => b.name === selectedBranchFilter);
      const userBranchName = loggedUser?.school_name || loggedUser?.branchName || (userBranch !== 'All' ? userBranch : 'Chinchwad Branch');
      const activeBranchName = selectedBranchFilter !== 'All' ? selectedBranchFilter : userBranchName;

      const formPayload = {
        school_id: loggedUser?.school_id || activeBranchObj?.id || null,
        parentName: formData.fatherName || formData.parentName || 'Parent',
        email: formData.parentEmail || `parent_${Date.now()}@eduneev.com`,
        contactNumber: formData.fatherPhone || formData.parentPhone || '0000000000',
        alternativeMobile: formData.motherPhone || formData.parentAltPhone || '',
        address: formData.parentAddress,
        children: [
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            admissionNumber: formData.admissionNumber,
            grade: formData.grade,
            gender: formData.gender,
            dateOfBirth: formData.dateOfBirth,
            bloodGroup: formData.bloodGroup,
            emergencyContactName: formData.emergencyContactName || formData.fatherName,
            emergencyContactPhone: formData.emergencyContactPhone || formData.fatherPhone,
            medicalNotes: {
              fatherName: formData.fatherName,
              fatherOccupation: formData.fatherOccupation,
              fatherPhone: formData.fatherPhone,
              motherName: formData.motherName,
              motherOccupation: formData.motherOccupation,
              motherPhone: formData.motherPhone,
              sourceOfEnquiry: formData.sourceOfEnquiry,
              enrolmentCentre: formData.enrolmentCentre || activeBranchName,
              amountPaid: formData.amountPaid,
              receiptNo: formData.receiptNo,
              dateOfEnrolment: formData.dateOfEnrolment,
              paymentMode: formData.paymentMode,
              identityCardNo: formData.identityCardNo,
              chequeDetails: formData.chequeDetails,
              balanceAmount: formData.balanceAmount,
              dueDates: formData.dueDates,
              admissionKit: formData.admissionKit,
              followUpNotes: formData.followUpNotes,
              isDaycareEnrolled: formData.isDaycareEnrolled,
              daycareBatch: formData.daycareBatch
            }
          }
        ]
      };

      await apiClient.post('/admin/family', formPayload);
      setIsAddModalOpen(false);
      fetchStudents();
      alert('Official EduNeev Kids Student Admission saved successfully!');
    } catch (error: any) {
      console.error('Failed to add student', error);
      alert(error.response?.data?.error || 'Error adding student');
    } finally {
      setSaving(false);
    }
  };

  const openViewModal = (student: Student) => {
    setCurrentStudent(student);
    let parsed: any = {};
    if (student.medical_notes) {
      try {
        parsed = typeof student.medical_notes === 'string' ? JSON.parse(student.medical_notes) : student.medical_notes;
      } catch {}
    }
    setParsedNotes(parsed);
    setIsViewModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setCurrentStudent(student);
    let parsed: any = {};
    if (student.medical_notes) {
      try {
        parsed = typeof student.medical_notes === 'string' ? JSON.parse(student.medical_notes) : student.medical_notes;
      } catch {}
    }

    setFormData({
      firstName: student.first_name || '',
      lastName: student.last_name || '',
      admissionNumber: student.admission_number || '',
      grade: student.grade || 'Nursery',
      isDaycareEnrolled: parsed.isDaycareEnrolled === true || (student.grade || '').toLowerCase().includes('daycare'),
      daycareBatch: parsed.daycareBatch || 'After School (Half Day)',
      gender: student.gender || 'male',
      dateOfBirth: student.date_of_birth ? student.date_of_birth.substring(0, 10) : '',
      bloodGroup: student.blood_group || '',

      fatherName: parsed.fatherName || student.parent_name || '',
      fatherOccupation: parsed.fatherOccupation || '',
      fatherPhone: parsed.fatherPhone || student.contact_number || '',

      motherName: parsed.motherName || '',
      motherOccupation: parsed.motherOccupation || '',
      motherPhone: parsed.motherPhone || student.alternative_mobile || '',

      parentName: student.parent_name || '',
      parentEmail: student.parent_email || '',
      parentPhone: student.contact_number || '',
      parentAltPhone: student.alternative_mobile || '',
      parentAddress: student.address || '',
      emergencyContactName: student.emergency_contact_name || '',
      emergencyContactPhone: student.emergency_contact_phone || '',

      sourceOfEnquiry: parsed.sourceOfEnquiry || 'Friends',
      enrolmentCentre: parsed.enrolmentCentre || 'Chinchwad - Sambhajinagar',

      amountPaid: parsed.amountPaid || '',
      receiptNo: parsed.receiptNo || '',
      dateOfEnrolment: parsed.dateOfEnrolment || (student.created_at ? student.created_at.substring(0, 10) : ''),
      paymentMode: parsed.paymentMode || 'Cash',
      identityCardNo: parsed.identityCardNo || '',
      chequeDetails: parsed.chequeDetails || '',
      balanceAmount: parsed.balanceAmount || '',
      dueDates: parsed.dueDates || '',
      admissionKit: parsed.admissionKit || 'Given',
      uniformSize: parsed.uniformSize || 'Size 24 (M)',
      booksIssued: parsed.booksIssued || 'Yes',
      bagsIssued: parsed.bagsIssued || 'Yes',
      followUpNotes: parsed.followUpNotes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    setSaving(true);
    try {
      await apiClient.put(`/admin/students/${currentStudent.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        admissionNumber: formData.admissionNumber,
        grade: formData.grade,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup,
        emergencyContactName: formData.emergencyContactName || formData.fatherName,
        emergencyContactPhone: formData.emergencyContactPhone || formData.fatherPhone,
        medicalNotes: JSON.stringify({
          fatherName: formData.fatherName,
          fatherOccupation: formData.fatherOccupation,
          fatherPhone: formData.fatherPhone,
          motherName: formData.motherName,
          motherOccupation: formData.motherOccupation,
          motherPhone: formData.motherPhone,
          sourceOfEnquiry: formData.sourceOfEnquiry,
          enrolmentCentre: formData.enrolmentCentre,
          amountPaid: formData.amountPaid,
          receiptNo: formData.receiptNo,
          dateOfEnrolment: formData.dateOfEnrolment,
          paymentMode: formData.paymentMode,
          identityCardNo: formData.identityCardNo,
          chequeDetails: formData.chequeDetails,
          balanceAmount: formData.balanceAmount,
          dueDates: formData.dueDates,
          admissionKit: formData.admissionKit,
          followUpNotes: formData.followUpNotes,
          isDaycareEnrolled: formData.isDaycareEnrolled,
          daycareBatch: formData.daycareBatch
        })
      });
      setIsEditModalOpen(false);
      fetchStudents();
      alert('Student record updated successfully!');
    } catch (error: any) {
      console.error('Failed to update student', error);
      alert(error.response?.data?.error || 'Error updating student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await apiClient.delete(`/admin/students/${id}`);
      fetchStudents();
      alert('Student deactivated successfully!');
    } catch (error: any) {
      console.error('Failed to delete student', error);
      alert(error.response?.data?.error || 'Error deleting student');
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (promoteData.fromGrade === promoteData.toGrade) {
      alert('Source and destination classes cannot be the same');
      return;
    }
    if (selectedPromoteStudentIds.length === 0) {
      alert('Please select at least one student to promote');
      return;
    }
    if (!window.confirm(`Are you sure you want to promote ${selectedPromoteStudentIds.length} selected student(s) from ${promoteData.fromGrade} to ${promoteData.toGrade}?`)) return;
    
    setSaving(true);
    try {
      const schoolIdParam = selectedBranchFilter !== 'All' 
        ? dbBranches.find(b => b.name === selectedBranchFilter)?.id 
        : undefined;

      const res = await apiClient.post(`/admin/promote`, {
        fromGrade: promoteData.fromGrade,
        toGrade: promoteData.toGrade,
        studentIds: selectedPromoteStudentIds,
        school_id: schoolIdParam
      });
      setIsPromoteModalOpen(false);
      alert(res.data?.message || `Successfully promoted ${selectedPromoteStudentIds.length} student(s) to ${promoteData.toGrade}! Roll numbers have been reassigned.`);
      fetchStudents();
    } catch (error: any) {
      console.error('Failed to promote students', error);
      alert(error.response?.data?.error || 'Error promoting students');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAssignRollNumbers = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/admin/assign-roll-numbers', { grade: rollNoGrade });
      setIsRollNoModalOpen(false);
      alert(`Roll numbers assigned alphabetically (A-Z) for grade ${rollNoGrade}!`);
      fetchStudents();
    } catch (error: any) {
      console.error('Failed to assign roll numbers', error);
      alert(error.response?.data?.error || 'Error assigning roll numbers');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      s.admission_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.grade?.toLowerCase().includes(search.toLowerCase());
    
    let parsed: any = {};
    if (s.medical_notes) {
      try { parsed = typeof s.medical_notes === 'string' ? JSON.parse(s.medical_notes) : s.medical_notes; } catch {}
    }
    const branchName = s.school_name || parsed.enrolmentCentre || 'Chinchwad Branch';
    const matchesBranch = selectedBranchFilter === 'All' || branchName.toLowerCase().includes(selectedBranchFilter.replace(' Branch', '').toLowerCase());
    
    const isDaycareDual = parsed.isDaycareEnrolled === true;
    const matchesClass = selectedClassFilter === 'All' || 
      (s.grade || '').toLowerCase() === selectedClassFilter.toLowerCase() ||
      (selectedClassFilter.toLowerCase().includes('daycare') && (isDaycareDual || (s.grade || '').toLowerCase().includes('daycare')));

    return matchesSearch && matchesBranch && matchesClass;
  });

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10 }}>
        <header className="header" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">Students Directory</h1>
              <p className="date-text">{filteredStudents.length} enrolled students • Official Admission Forms</p>
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" style={{ color: '#0F766E', background: '#CCFBF1', border: '1px solid #99F6E4' }} onClick={() => setIsRollNoModalOpen(true)}>
                <Hash size={18} /> Assign Roll No
              </button>
              <button className="btn-primary" style={{ background: '#0D9488' }} onClick={() => openPromoteModal()}>
                <ArrowUpRight size={18} /> Promote Class
              </button>
              <button className="btn-primary" onClick={openAddModal}>
                <Plus size={20} /> New Student Admission
              </button>
            </div>
          )}
        </header>

        <div className="glass-card table-container">
          <div className="table-header flex-between" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ maxWidth: '360px', flex: 1 }}>
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search by student name or ADM no..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

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

          {/* Class-wise Filter & Year-End Promotion Bar */}
          <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#475569', marginRight: '0.4rem', letterSpacing: '0.5px' }}>
                {isTeacher && teacherAssignedGrade ? '🏫 MY CLASS:' : '🏫 CLASS WISE:'}
              </span>
              
              {(!isTeacher || !teacherAssignedGrade) && (
                <button
                  type="button"
                  onClick={() => setSelectedClassFilter('All')}
                  style={{ padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: selectedClassFilter === 'All' ? '#4F46E5' : '#E2E8F0', color: selectedClassFilter === 'All' ? 'white' : '#475569' }}
                >
                  All Classes ({students.length})
                </button>
              )}

              {((isTeacher && teacherAssignedGrade)
                ? (availableClasses.filter(c => c.toLowerCase() === teacherAssignedGrade.toLowerCase()).length > 0
                    ? availableClasses.filter(c => c.toLowerCase() === teacherAssignedGrade.toLowerCase())
                    : [teacherAssignedGrade])
                : availableClasses
              ).map(cls => {
                const count = students.filter(s => {
                  let p: any = {};
                  if (s.medical_notes) {
                    try { p = typeof s.medical_notes === 'string' ? JSON.parse(s.medical_notes) : s.medical_notes; } catch {}
                  }
                  if (cls.toLowerCase().includes('daycare')) {
                    return (s.grade || '').toLowerCase().includes('daycare') || p.isDaycareEnrolled === true;
                  }
                  return (s.grade || '').toLowerCase() === cls.toLowerCase();
                }).length;
                const isSel = selectedClassFilter.toLowerCase() === cls.toLowerCase();
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClassFilter(cls)}
                    style={{ padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: isSel ? '#0D9488' : '#E2E8F0', color: isSel ? 'white' : '#475569' }}
                  >
                    {cls} ({count})
                  </button>
                );
              })}
            </div>

            {isAdmin && selectedClassFilter !== 'All' && (
              <button
                type="button"
                onClick={() => openPromoteModal(selectedClassFilter)}
                style={{ background: '#0D9488', color: 'white', border: 'none', padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)' }}
              >
                🎓 Promote {selectedClassFilter} Students
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex-center py-8">Loading students...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>Franchise Branch</th>
                    <th>Roll / Adm No</th>
                    <th>Grade / Program</th>
                    <th>Gender & DOB</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      let parsed: any = {};
                      if (student.medical_notes) {
                        try { parsed = typeof student.medical_notes === 'string' ? JSON.parse(student.medical_notes) : student.medical_notes; } catch {}
                      }
                      const studentBranch = student.school_name || parsed.enrolmentCentre || (student.school_id ? 'Franchise Center' : 'Chinchwad Branch');

                      return (
                        <tr key={student.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </div>
                              <div>
                                <div className="font-bold text-main">
                                  {student.first_name} {student.last_name}
                                </div>
                                <div className="text-muted text-sm">Parent: {student.parent_name || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ 
                              background: studentBranch.includes('Chikhali') ? '#FEF3C7' : studentBranch.includes('Dudulgaon') ? '#F3E8FF' : '#EEF2FF', 
                              color: studentBranch.includes('Chikhali') ? '#92400E' : studentBranch.includes('Dudulgaon') ? '#6B21A8' : '#3730A3', 
                              padding: '4px 12px', 
                              borderRadius: '12px', 
                              fontWeight: 800, 
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              📍 {studentBranch}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: '700', color: '#0F766E' }}>Roll: {student.roll_number || '-'}</div>
                            <div className="text-muted text-sm">Adm: {student.admission_number || '-'}</div>
                          </td>
                          <td>
                            <span className="role-badge" style={{ background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{student.grade || '-'}</span>
                            {parsed.isDaycareEnrolled && (
                              <div style={{ marginTop: '4px' }}>
                                <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px', border: '1px solid #BBF7D0' }}>
                                  👶 + Daycare
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ textTransform: 'capitalize', marginBottom: '4px' }}>
                              {student.gender === 'male' ? '👦 Male' : student.gender === 'female' ? '👧 Female' : '⚧ Other'}
                            </div>
                            <div className="text-muted text-sm">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="icon-btn" style={{ background: '#F1F5F9', color: '#475569', border: 'none' }} title="View Digital Form" onClick={() => openViewModal(student)}>
                                <Eye size={16} />
                              </button>
                              {isAdmin && (
                                <>
                                  <button className="icon-btn" style={{ background: '#EFF6FF', color: '#3B82F6', border: 'none' }} title="Edit Record" onClick={() => openEditModal(student)}>
                                    <Edit2 size={16} />
                                  </button>
                                  <button className="icon-btn" style={{ background: '#FEE2E2', color: '#EF4444', border: 'none' }} title="Deactivate" onClick={() => handleDelete(student.id, student.first_name)}>
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add New Admission Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '850px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0F172A' }}>EduNeev Kids - New Student Admission Form</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Official Enrolment & Enquiry Form Fields</span>
              </div>
              <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="modal-form">
              
              {/* Section 1: Child Information */}
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} color="#0D9488" /> 1. Child's Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Enrol / Program For <span style={{color: 'red'}}>*</span></label>
                    <select 
                      name="grade" 
                      value={formData.isDaycareEnrolled && formData.grade !== 'Daycare' && !formData.grade.toLowerCase().includes('daycare') ? `${formData.grade} + Daycare` : formData.grade} 
                      onChange={handleInputChange} 
                      className="input-field"
                      style={{ fontWeight: 700 }}
                    >
                      <optgroup label="🏫 Regular Classes">
                        <option value="Playgroup">Playgroup</option>
                        <option value="Nursery">Nursery</option>
                        <option value="Jr KG">Jr KG</option>
                        <option value="Sr KG">Sr KG</option>
                      </optgroup>
                      <optgroup label="👶✨ Class + Daycare Both">
                        <option value="Playgroup + Daycare">Playgroup + Daycare</option>
                        <option value="Nursery + Daycare">Nursery + Daycare</option>
                        <option value="Jr KG + Daycare">Jr KG + Daycare</option>
                        <option value="Sr KG + Daycare">Sr KG + Daycare</option>
                      </optgroup>
                      <optgroup label="🧸 Daycare Only">
                        <option value="Daycare">Daycare</option>
                        <option value="Daycare - Infant">Daycare - Infant (6M - 1.5Y)</option>
                        <option value="Daycare - Toddler">Daycare - Toddler (1.5Y - 2.5Y)</option>
                        <option value="Daycare - Junior">Daycare - Junior (2.5Y - 4Y)</option>
                        <option value="Daycare - After School">Daycare - After School (4Y - 10Y)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Admission Number <span style={{color: 'red'}}>*</span></span>
                      <span style={{ fontSize: '0.75rem', color: '#0D9488', fontWeight: 700, background: '#CCFBF1', padding: '2px 8px', borderRadius: '12px' }}>
                        ⚡ Class Auto Prefix
                      </span>
                    </label>
                    <input 
                      type="text" 
                      name="admissionNumber" 
                      value={formData.admissionNumber} 
                      onChange={handleInputChange} 
                      required 
                      className="input-field" 
                      placeholder="e.g. NUR-001" 
                    />
                  </div>
                </div>

                {/* Daycare Dual Enrollment Option */}
                <div style={{ background: '#F0FDF4', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #BBF7D0', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 800, cursor: 'pointer', color: '#166534', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      name="isDaycareEnrolled" 
                      checked={!!formData.isDaycareEnrolled} 
                      onChange={(e) => setFormData(prev => ({ ...prev, isDaycareEnrolled: e.target.checked }))} 
                      style={{ width: '18px', height: '18px', accentColor: '#16A34A', cursor: 'pointer' }}
                    />
                    👶 Also Enrolled in Daycare?
                  </label>
                  {formData.isDaycareEnrolled && (
                    <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '4px' }}>
                          Daycare Batch & Timing
                        </label>
                        <select 
                          name="daycareBatch" 
                          value={formData.daycareBatch || 'After School (Half Day)'} 
                          onChange={handleInputChange} 
                          className="input-field"
                          style={{ background: 'white' }}
                        >
                          <option value="After School (Half Day)">After School (Half Day)</option>
                          <option value="Full Day Daycare">Full Day Daycare</option>
                          <option value="Morning Daycare">Morning Daycare</option>
                          <option value="Flexible / Hourly">Flexible / Hourly</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Child's First Name (Master / Baby) <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="input-field" placeholder="First Name" />
                  </div>
                  <div className="form-group">
                    <label>Child's Last Name <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="input-field" placeholder="Last Name" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="input-field">
                      <option value="male">Male (M)</option>
                      <option value="female">Female (F)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date of Birth (DD/MM/YYYY)</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="input-field">
                      <option value="">Select...</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Father & Mother Details */}
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="#4F46E5" /> 2. Parents Information
                </h3>
                
                {/* Father */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Father's Name <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} required className="input-field" placeholder="Father's Full Name" />
                  </div>
                  <div className="form-group">
                    <label>Father's Occupation</label>
                    <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} className="input-field" placeholder="Service / Business" />
                  </div>
                  <div className="form-group">
                    <label>Father's Contact No. <span style={{color: 'red'}}>*</span></label>
                    <input type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} required className="input-field" placeholder="10-digit Mobile" />
                  </div>
                </div>

                {/* Mother */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Mother's Name</label>
                    <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className="input-field" placeholder="Mother's Full Name" />
                  </div>
                  <div className="form-group">
                    <label>Mother's Occupation</label>
                    <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} className="input-field" placeholder="Homemaker / Job" />
                  </div>
                  <div className="form-group">
                    <label>Mother's Contact No.</label>
                    <input type="tel" name="motherPhone" value={formData.motherPhone} onChange={handleInputChange} className="input-field" placeholder="10-digit Mobile" />
                  </div>
                </div>

                {/* Address & Emergency */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Parents Email IDs</label>
                    <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleInputChange} className="input-field" placeholder="email@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact No.</label>
                    <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} className="input-field" placeholder="Emergency Phone" />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Residential Address</label>
                  <textarea name="parentAddress" value={formData.parentAddress} onChange={handleInputChange} className="input-field" rows={2} placeholder="Flat No, Building, Area, City & Pincode" style={{ resize: 'vertical' }}></textarea>
                </div>
              </div>

              {/* Section 3: Referral & Centre */}
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Megaphone size={18} color="#EA580C" /> 3. Referral Source & Centre
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>How parents came to know of this pre-school through</label>
                    <select name="sourceOfEnquiry" value={formData.sourceOfEnquiry} onChange={handleInputChange} className="input-field">
                      {REFERRAL_SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Enrolment Centre</label>
                    <input type="text" name="enrolmentCentre" value={formData.enrolmentCentre} onChange={handleInputChange} className="input-field" placeholder="Chinchwad - Sambhajinagar" />
                  </div>
                </div>
              </div>

              {/* Section 4: For Office Use Only */}
              <div style={{ background: '#EEF2FF', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #C7D2FE' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#4F46E5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={18} color="#4F46E5" /> 4. FOR OFFICE USE ONLY
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Amount Paid (Rs.)</label>
                    <input type="number" name="amountPaid" value={formData.amountPaid} onChange={handleInputChange} className="input-field" placeholder="e.g. 5000" style={{ background: 'white' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Receipt No.</span>
                      <span style={{ fontSize: '0.7rem', color: '#4F46E5', fontWeight: 700, background: '#E0E7FF', padding: '2px 6px', borderRadius: '10px' }}>
                        ⚡ Auto-Format
                      </span>
                    </label>
                    <input type="text" name="receiptNo" value={formData.receiptNo} onChange={handleInputChange} className="input-field" placeholder="e.g. REC-2026-001" style={{ background: 'white' }} />
                  </div>
                  <div className="form-group">
                    <label>Date of Enrolment</label>
                    <input type="date" name="dateOfEnrolment" value={formData.dateOfEnrolment} onChange={handleInputChange} className="input-field" style={{ background: 'white' }} />
                  </div>
                  <div className="form-group">
                    <label>Mode of Payment</label>
                    <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="input-field" style={{ background: 'white' }}>
                      <option value="Cash">Cash</option>
                      <option value="Online / UPI">Online / UPI</option>
                      <option value="DD">DD</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Identity Card No.</label>
                    <input type="text" name="identityCardNo" value={formData.identityCardNo} onChange={handleInputChange} className="input-field" placeholder="ID Card #" style={{ background: 'white' }} />
                  </div>
                  <div className="form-group">
                    <label>DD / Cheque Details</label>
                    <input type="text" name="chequeDetails" value={formData.chequeDetails} onChange={handleInputChange} className="input-field" placeholder="Bank & Cheque #" style={{ background: 'white' }} />
                  </div>
                  <div className="form-group">
                    <label>Balance Amount (Rs.)</label>
                    <input type="number" name="balanceAmount" value={formData.balanceAmount} onChange={handleInputChange} className="input-field" placeholder="e.g. 10000" style={{ background: 'white' }} />
                  </div>
                  <div className="form-group">
                    <label>Admission Kit</label>
                    <select name="admissionKit" value={formData.admissionKit} onChange={handleInputChange} className="input-field" style={{ background: 'white' }}>
                      <option value="Given">Given</option>
                      <option value="To be given">To be given</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Follow-up Action Notes / Remarks</label>
                  <textarea name="followUpNotes" value={formData.followUpNotes} onChange={handleInputChange} className="input-field" rows={2} placeholder="Office remarks and follow-up notes..." style={{ resize: 'vertical', background: 'white' }}></textarea>
                </div>
              </div>

              <div className="modal-actions" style={{ position: 'sticky', bottom: 0, background: 'white', padding: '1rem 0', borderTop: '1px solid #E2E8F0', marginTop: 'auto' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ background: '#0D9488', padding: '0.65rem 1.75rem' }}>
                  {saving ? 'Saving...' : 'Save Student Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Admission Form View Modal */}
      {isViewModalOpen && currentStudent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src="/logopre.png" alt="Logo" style={{ height: '40px' }} />
                <div>
                  <h2 style={{ margin: 0 }}>EDUNEEV KIDS PRESCHOOL</h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Official Digital Admission Form</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={handlePrintAdmissionForm} style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Printer size={15} /> Print Form
                </button>
                <button className="icon-btn" onClick={() => setIsViewModalOpen(false)}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '1.5rem 0' }}>
              {/* Header Box */}
              <div style={{ border: '2px solid #0F172A', padding: '1.5rem', borderRadius: '12px', background: '#FAFAFA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px dashed #CBD5E1', paddingBottom: '0.5rem' }}>
                  <div><strong>Admission No:</strong> <span style={{ color: '#0D9488', fontWeight: 800 }}>{currentStudent.admission_number}</span></div>
                  <div><strong>Enrolment Program:</strong> <span style={{ color: '#4F46E5', fontWeight: 800 }}>{currentStudent.grade}</span></div>
                  <div><strong>Date:</strong> {currentStudent.created_at ? new Date(currentStudent.created_at).toLocaleDateString() : '-'}</div>
                </div>

                {/* Child Info */}
                <h4 style={{ color: '#0D9488', margin: '1rem 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Child Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
                  <div><strong>Child's Name:</strong> {currentStudent.first_name} {currentStudent.last_name}</div>
                  <div><strong>Gender:</strong> {currentStudent.gender}</div>
                  <div><strong>DOB:</strong> {currentStudent.date_of_birth ? new Date(currentStudent.date_of_birth).toLocaleDateString() : '-'}</div>
                  <div><strong>Blood Group:</strong> {currentStudent.blood_group || '-'}</div>
                </div>

                {/* Parents Info */}
                <h4 style={{ color: '#4F46E5', margin: '1.25rem 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parents Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
                  <div><strong>Father's Name:</strong> {parsedNotes.fatherName || currentStudent.parent_name || '-'}</div>
                  <div><strong>Father's Occupation:</strong> {parsedNotes.fatherOccupation || '-'}</div>
                  <div><strong>Father's Phone:</strong> {parsedNotes.fatherPhone || currentStudent.contact_number || '-'}</div>
                  <div><strong>Mother's Name:</strong> {parsedNotes.motherName || '-'}</div>
                  <div><strong>Mother's Occupation:</strong> {parsedNotes.motherOccupation || '-'}</div>
                  <div><strong>Mother's Phone:</strong> {parsedNotes.motherPhone || currentStudent.alternative_mobile || '-'}</div>
                  <div><strong>Parents Email:</strong> {currentStudent.parent_email || '-'}</div>
                  <div><strong>Emergency Contact:</strong> {currentStudent.emergency_contact_phone || '-'}</div>
                  <div style={{ gridColumn: 'span 2' }}><strong>Residential Address:</strong> {currentStudent.address || '-'}</div>
                </div>

                {/* Referral Source */}
                <h4 style={{ color: '#EA580C', margin: '1.25rem 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Referral & Centre</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
                  <div><strong>Source of Enquiry:</strong> {parsedNotes.sourceOfEnquiry || 'Friends'}</div>
                  <div><strong>Enrolment Centre:</strong> {parsedNotes.enrolmentCentre || 'Chinchwad - Sambhajinagar'}</div>
                </div>

                {/* Office Use Only - Admin Only */}
                {isAdmin && (
                  <>
                    <h4 style={{ color: '#0F172A', margin: '1.25rem 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>For Office Use Only (Accounts)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.9rem', background: '#F1F5F9', padding: '1rem', borderRadius: '8px' }}>
                      <div><strong>Amount Paid:</strong> ₹{parsedNotes.amountPaid || '0'}</div>
                      <div><strong>Receipt No:</strong> {parsedNotes.receiptNo || '-'}</div>
                      <div><strong>Payment Mode:</strong> {parsedNotes.paymentMode || 'Cash'}</div>
                      <div><strong>Date of Enrolment:</strong> {parsedNotes.dateOfEnrolment || '-'}</div>
                      <div><strong>ID Card No:</strong> {parsedNotes.identityCardNo || '-'}</div>
                      <div><strong>Cheque/DD Details:</strong> {parsedNotes.chequeDetails || '-'}</div>
                      <div><strong>Balance Amount:</strong> ₹{parsedNotes.balanceAmount || '0'}</div>
                      <div><strong>Admission Kit:</strong> {parsedNotes.admissionKit || 'Given'}</div>
                    </div>
                  </>
                )}

                {parsedNotes.followUpNotes && (
                  <div style={{ marginTop: '1rem', fontSize: '0.9rem', background: '#FEF3C7', padding: '0.75rem', borderRadius: '8px', color: '#92400E' }}>
                    <strong>Follow-up Action Notes:</strong> {parsedNotes.followUpNotes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '850px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Edit Student Admission Form</h2>
              <button className="icon-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="modal-form">
              
              {/* Section 1: Child Information */}
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} color="#0D9488" /> 1. Child's Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>First Name <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Last Name <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="input-field" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Admission Number <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="admissionNumber" value={formData.admissionNumber} onChange={handleInputChange} required className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Enrol / Program For <span style={{color: 'red'}}>*</span></label>
                    <select 
                      name="grade" 
                      value={formData.isDaycareEnrolled && formData.grade !== 'Daycare' && !formData.grade.toLowerCase().includes('daycare') ? `${formData.grade} + Daycare` : formData.grade} 
                      onChange={handleInputChange} 
                      className="input-field"
                      style={{ fontWeight: 700 }}
                    >
                      <optgroup label="🏫 Regular Classes">
                        <option value="Playgroup">Playgroup</option>
                        <option value="Nursery">Nursery</option>
                        <option value="Jr KG">Jr KG</option>
                        <option value="Sr KG">Sr KG</option>
                      </optgroup>
                      <optgroup label="👶✨ Class + Daycare Both">
                        <option value="Playgroup + Daycare">Playgroup + Daycare</option>
                        <option value="Nursery + Daycare">Nursery + Daycare</option>
                        <option value="Jr KG + Daycare">Jr KG + Daycare</option>
                        <option value="Sr KG + Daycare">Sr KG + Daycare</option>
                      </optgroup>
                      <optgroup label="🧸 Daycare Only">
                        <option value="Daycare">Daycare</option>
                        <option value="Daycare - Infant">Daycare - Infant (6M - 1.5Y)</option>
                        <option value="Daycare - Toddler">Daycare - Toddler (1.5Y - 2.5Y)</option>
                        <option value="Daycare - Junior">Daycare - Junior (2.5Y - 4Y)</option>
                        <option value="Daycare - After School">Daycare - After School (4Y - 10Y)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Daycare Dual Enrollment Option */}
                <div style={{ background: '#F0FDF4', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #BBF7D0', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 800, cursor: 'pointer', color: '#166534', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      name="isDaycareEnrolled" 
                      checked={!!formData.isDaycareEnrolled} 
                      onChange={(e) => setFormData(prev => ({ ...prev, isDaycareEnrolled: e.target.checked }))} 
                      style={{ width: '18px', height: '18px', accentColor: '#16A34A', cursor: 'pointer' }}
                    />
                    👶 Also Enrolled in Daycare?
                  </label>
                  {formData.isDaycareEnrolled && (
                    <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '4px' }}>
                          Daycare Batch & Timing
                        </label>
                        <select 
                          name="daycareBatch" 
                          value={formData.daycareBatch || 'After School (Half Day)'} 
                          onChange={handleInputChange} 
                          className="input-field"
                          style={{ background: 'white' }}
                        >
                          <option value="After School (Half Day)">After School (Half Day)</option>
                          <option value="Full Day Daycare">Full Day Daycare</option>
                          <option value="Morning Daycare">Morning Daycare</option>
                          <option value="Flexible / Hourly">Flexible / Hourly</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="input-field">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="input-field">
                      <option value="">Select...</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Parents */}
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="#4F46E5" /> 2. Parents Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Father's Name</label>
                    <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Father's Occupation</label>
                    <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Father's Contact No.</label>
                    <input type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} className="input-field" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Mother's Name</label>
                    <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Mother's Occupation</label>
                    <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Mother's Contact No.</label>
                    <input type="tel" name="motherPhone" value={formData.motherPhone} onChange={handleInputChange} className="input-field" />
                  </div>
                </div>
              </div>

              {/* Office Use Only */}
              <div style={{ background: '#EEF2FF', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.25rem', border: '1px solid #C7D2FE' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#4F46E5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={18} color="#4F46E5" /> 3. FOR OFFICE USE ONLY
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Amount Paid (Rs.)</label>
                    <input type="number" name="amountPaid" value={formData.amountPaid} onChange={handleInputChange} className="input-field" style={{ background: 'white' }} />
                  </div>
                  <div className="form-group">
                    <label>Receipt No.</label>
                    <input type="text" name="receiptNo" value={formData.receiptNo} onChange={handleInputChange} className="input-field" style={{ background: 'white' }} />
                  </div>
                  <div className="form-group">
                    <label>Mode of Payment</label>
                    <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="input-field" style={{ background: 'white' }}>
                      <option value="Cash">Cash</option>
                      <option value="Online / UPI">Online / UPI</option>
                      <option value="DD">DD</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Admission Kit</label>
                    <select name="admissionKit" value={formData.admissionKit} onChange={handleInputChange} className="input-field" style={{ background: 'white' }}>
                      <option value="Given">Given</option>
                      <option value="To be given">To be given</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Uniform Size</label>
                    <select name="uniformSize" value={formData.uniformSize} onChange={handleInputChange} className="input-field" style={{ background: 'white' }}>
                      <option value="Size 20 (XS)">Size 20 (XS)</option>
                      <option value="Size 22 (S)">Size 22 (S)</option>
                      <option value="Size 24 (M)">Size 24 (M)</option>
                      <option value="Size 26 (L)">Size 26 (L)</option>
                      <option value="Size 28 (XL)">Size 28 (XL)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Books Allocated?</label>
                    <select name="booksIssued" value={formData.booksIssued} onChange={handleInputChange} className="input-field" style={{ background: 'white' }}>
                      <option value="Yes">Yes (Allocated)</option>
                      <option value="No">No (Pending)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Bag Allocated?</label>
                    <select name="bagsIssued" value={formData.bagsIssued} onChange={handleInputChange} className="input-field" style={{ background: 'white' }}>
                      <option value="Yes">Yes (Allocated)</option>
                      <option value="No">No (Pending)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ position: 'sticky', bottom: 0, background: 'white', padding: '1rem 0', borderTop: '1px solid #E2E8F0', marginTop: 'auto' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Student Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {isPromoteModalOpen && (() => {
        const activeClassStudents = students.filter(s => 
          (s.grade || '').toLowerCase() === (promoteData.fromGrade || '').toLowerCase() &&
          (s as any).is_active !== false
        );

        const filteredPromoteStudents = activeClassStudents.filter(s => {
          if (!promoteSearchQuery.trim()) return true;
          const q = promoteSearchQuery.toLowerCase();
          const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
          const adm = (s.admission_number || '').toLowerCase();
          const roll = (s.roll_number || '').toString().toLowerCase();
          return fullName.includes(q) || adm.includes(q) || roll.includes(q);
        });

        const isAllSelected = activeClassStudents.length > 0 && selectedPromoteStudentIds.length === activeClassStudents.length;

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
              <div className="modal-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', color: '#0F172A', margin: 0 }}>
                    <GraduationCap size={24} color="#0D9488" /> Promote Students Class-Wise
                  </h2>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Select students to promote to the next grade. Unselected students will remain in {promoteData.fromGrade}.
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setIsPromoteModalOpen(false)}><X size={20} /></button>
              </div>

              <form onSubmit={handlePromoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>
                {/* Class Selection Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.75rem', background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      From Class
                    </label>
                    <select name="fromGrade" value={promoteData.fromGrade} onChange={handlePromoteChange} className="input-field" style={{ fontWeight: 700, background: 'white' }}>
                      {availableClasses.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {activeClassStudents.length} active students
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#E0F2FE', borderRadius: '50%', color: '#0284C7', margin: '1rem auto 0' }}>
                    <ArrowRight size={18} />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Promote To Class
                    </label>
                    <select name="toGrade" value={promoteData.toGrade} onChange={handlePromoteChange} className="input-field" style={{ fontWeight: 700, background: 'white' }}>
                      {availableClasses.map(g => <option key={g} value={g}>{g}</option>)}
                      <option value="Grade 1 / Passed Out">Grade 1 / Passed Out</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: '#0D9488', fontWeight: 600 }}>
                      Target destination
                    </span>
                  </div>
                </div>

                {/* Student Selection Header & Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>
                      Students in {promoteData.fromGrade}
                    </span>
                    <span style={{ background: selectedPromoteStudentIds.length > 0 ? '#ECFDF5' : '#F1F5F9', color: selectedPromoteStudentIds.length > 0 ? '#059669' : '#64748B', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, border: '1px solid ' + (selectedPromoteStudentIds.length > 0 ? '#A7F3D0' : '#E2E8F0') }}>
                      {selectedPromoteStudentIds.length} of {activeClassStudents.length} Selected
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleSelectAllPromote(activeClassStudents.map(s => s.id))}
                      style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: '#334155' }}
                    >
                      {isAllSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Student Search */}
                {activeClassStudents.length > 4 && (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder={`Filter students in ${promoteData.fromGrade}...`}
                      value={promoteSearchQuery}
                      onChange={(e) => setPromoteSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                    <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                )}

                {/* Scrollable Student List */}
                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px', background: '#FAFAFA' }}>
                  {activeClassStudents.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      <Users size={36} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontWeight: 600, margin: 0 }}>No active students enrolled in {promoteData.fromGrade}.</p>
                      <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.25rem' }}>Change the 'From Class' above to select another group.</p>
                    </div>
                  ) : filteredPromoteStudents.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>No students matching "{promoteSearchQuery}"</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 1 }}>
                          <th style={{ padding: '0.65rem 0.75rem', width: '40px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={() => handleSelectAllPromote(activeClassStudents.map(s => s.id))}
                              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0D9488' }}
                              title="Select / Deselect All"
                            />
                          </th>
                          <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>STUDENT</th>
                          <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>ROLL NO</th>
                          <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>ADMISSION NO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPromoteStudents.map((st) => {
                          const isSelected = selectedPromoteStudentIds.includes(st.id);
                          return (
                            <tr
                              key={st.id}
                              onClick={() => togglePromoteStudent(st.id)}
                              style={{
                                borderBottom: '1px solid #F1F5F9',
                                cursor: 'pointer',
                                background: isSelected ? '#F0FDF4' : 'transparent',
                                transition: 'background 0.15s'
                              }}
                            >
                              <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePromoteStudent(st.id)}
                                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0D9488' }}
                                />
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isSelected ? '#CCFBF1' : '#E2E8F0', color: isSelected ? '#0D9488' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                                    {st.first_name?.[0]}{st.last_name?.[0]}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1E293B' }}>
                                      {st.first_name} {st.last_name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                      Parent: {st.parent_name || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem' }}>
                                <span style={{ background: '#F1F5F9', color: '#334155', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                                  #{st.roll_number || '-'}
                                </span>
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                                {st.admission_number || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Notice banner */}
                <div style={{ padding: '0.65rem 0.9rem', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '0.8rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>ℹ️</span>
                  <span>
                    Only the <strong>{selectedPromoteStudentIds.length}</strong> selected student(s) will be promoted to <strong>{promoteData.toGrade}</strong>. Unselected students will remain in <strong>{promoteData.fromGrade}</strong>.
                  </span>
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsPromoteModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving || selectedPromoteStudentIds.length === 0}
                    style={{ background: '#0D9488', minWidth: '180px' }}
                  >
                    {saving ? 'Promoting...' : `Promote ${selectedPromoteStudentIds.length} Student${selectedPromoteStudentIds.length === 1 ? '' : 's'}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Roll No Modal */}
      {isRollNoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Auto-Assign Roll Numbers (A-Z)</h2>
              <button className="icon-btn" onClick={() => setIsRollNoModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAssignRollNumbers} style={{ padding: '1rem 0' }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Select Grade / Class</label>
                <select value={rollNoGrade} onChange={(e) => setRollNoGrade(e.target.value)} className="input-field">
                  {availableClasses.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsRollNoModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ background: '#0F766E' }}>
                  {saving ? 'Assigning...' : 'Assign Roll Numbers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsDirectory;

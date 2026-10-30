import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import SmartSidebar from '../../components/SmartSidebar';
import { Search, Plus, Filter, ArrowLeft, X, CheckCircle, XCircle, Printer, GraduationCap } from 'lucide-react';
import './Directory.css';

interface Certificate {
  id: string;
  student_id: string;
  student_name: string;
  type: string;
  reason: string;
  status: string;
  created_at: string;
  grade?: string;
  date_of_birth?: string;
  admission_number?: string;
  parent_name?: string;
  address?: string;
  school_name?: string;
  gender?: string;
  issue_date?: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  grade?: string;
  date_of_birth?: string;
  admission_number?: string;
  parent_name?: string;
  school_name?: string;
  address?: string;
  gender?: string;
}

const CertificatesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<{ id?: string; name: string }[]>([
    { id: '1', name: 'Playgroup' },
    { id: '2', name: 'Nursery' },
    { id: '3', name: 'Jr KG' },
    { id: '4', name: 'Sr KG' },
    { id: '5', name: 'Daycare' }
  ]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSelectedClass, setModalSelectedClass] = useState('ALL');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedCertForPrint, setSelectedCertForPrint] = useState<Certificate | null>(null);

  const [formData, setFormData] = useState({
    student_id: '',
    type: 'Bonafide',
    reason: 'Educational Purpose / Bank Account',
    issue_date: new Date().toISOString().split('T')[0]
  });

  const defaultStudents: Student[] = [
    { id: 'stu-1', first_name: 'Arnav', last_name: 'Verma', grade: 'UKG', admission_number: 'EDU/25-26/001', date_of_birth: '29/06/2020', parent_name: 'Ajit Kumar Verma', school_name: 'Chinchwad Branch', address: 'Pote corner, Near Tulja Bhawani Mandir, Sambhajinagar, Chinchwad, Pune - 411019', gender: 'male' },
    { id: 'stu-2', first_name: 'Ananya', last_name: 'Patil', grade: 'Jr KG', admission_number: 'EDU/25-26/002', date_of_birth: '20/08/2020', parent_name: 'Suresh Patil', school_name: 'Chikhali Branch', address: 'Pingale Chowk, Chikhali, Pune - 411062', gender: 'female' },
    { id: 'stu-3', first_name: 'Vihaan', last_name: 'Deshmukh', grade: 'Sr KG', admission_number: 'EDU/25-26/003', date_of_birth: '10/11/2019', parent_name: 'Nitin Deshmukh', school_name: 'Dudulgaon Branch', address: 'S.P College Rd, Dudulgaon, Pune - 412105', gender: 'male' },
    { id: 'stu-4', first_name: 'Myra', last_name: 'Joshi', grade: 'Playgroup', admission_number: 'EDU/25-26/004', date_of_birth: '04/02/2022', parent_name: 'Amit Joshi', school_name: 'Chinchwad Branch', address: 'Sambhajinagar, Chinchwad, Pune - 411019', gender: 'female' },
    { id: 'stu-5', first_name: 'Kabir', last_name: 'Kulkarni', grade: 'Daycare', admission_number: 'EDU/25-26/005', date_of_birth: '18/07/2022', parent_name: 'Prasad Kulkarni', school_name: 'Chikhali Branch', address: 'Chikhali, Pune - 411062', gender: 'male' }
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [certRes, stuRes, clsRes] = await Promise.all([
        apiClient.get('/certificates').catch(() => ({ data: { data: [] } })),
        apiClient.get('/admin/students').catch(() => ({ data: [] })),
        apiClient.get('/classes').catch(() => ({ data: [] }))
      ]);

      const fetchedClasses = clsRes.data || [];
      if (Array.isArray(fetchedClasses) && fetchedClasses.length > 0) {
        setAvailableClasses(fetchedClasses);
      }

      const fetchedStudents = Array.isArray(stuRes.data) ? stuRes.data : (stuRes.data?.data || []);
      
      const normalizedStudents = fetchedStudents.map((s: any) => ({
        id: s.id || s._id,
        first_name: s.first_name || s.firstName || s.name?.split(' ')[0] || 'Student',
        last_name: s.last_name || s.lastName || s.name?.split(' ')[1] || '',
        grade: s.grade || s.class_name || s.standard || 'Nursery',
        admission_number: s.admission_number || s.admissionNumber || s.roll_no || `EDU/25-26/001`,
        date_of_birth: s.date_of_birth ? (s.date_of_birth.includes('/') ? s.date_of_birth : new Date(s.date_of_birth).toLocaleDateString('en-GB')) : (s.dob || '29/06/2020'),
        parent_name: s.parent_name || s.fatherName || s.guardian_name || (s.parent ? s.parent.name : 'Ajit Kumar Verma'),
        address: s.address || s.parent_address || (s.parent ? s.parent.address : 'Pote corner , Near Tulja Bhawani Mandir , Sambhajinagar , Chinchwad, Pune - 411019.'),
        school_name: s.school_name || s.enrolmentCentre || 'Chinchwad Branch',
        gender: s.gender || 'male'
      }));

      setStudents(normalizedStudents.length > 0 ? normalizedStudents : defaultStudents);
      setCertificates(certRes.data?.data || certRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setStudents(defaultStudents);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const [selectedStudentPreview, setSelectedStudentPreview] = useState<Student | null>(null);

  const matchesClass = (student: Student, className: string) => {
    if (className === 'ALL') return true;
    const grade = (student.grade || '').toLowerCase().trim();
    const target = className.toLowerCase().trim();
    if (grade === target) return true;
    if (target === 'jr kg' && (grade.includes('jr') || grade.includes('junior') || grade === 'lkg')) return true;
    if (target === 'sr kg' && (grade.includes('sr') || grade.includes('senior') || grade === 'ukg')) return true;
    if (target === 'playgroup' && grade.includes('play')) return true;
    if (target === 'nursery' && grade.includes('nursery')) return true;
    if (target === 'daycare' && grade.includes('daycare')) return true;
    return grade.includes(target);
  };

  const getStudentCountForClass = (className: string) => {
    return students.filter(s => matchesClass(s, className)).length;
  };

  const handleModalClassChange = (newClass: string) => {
    setModalSelectedClass(newClass);
    const classStudents = students.filter(s => matchesClass(s, newClass));
    if (classStudents.length > 0) {
      setFormData(prev => ({ ...prev, student_id: classStudents[0].id }));
      setSelectedStudentPreview(classStudents[0]);
    } else {
      setFormData(prev => ({ ...prev, student_id: '' }));
      setSelectedStudentPreview(null);
    }
  };

  const modalFilteredStudents = students.filter(s => matchesClass(s, modalSelectedClass));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'student_id') {
      const match = students.find(s => s.id === value);
      setSelectedStudentPreview(match || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/certificates', formData);
      const createdCert = res.data?.data || res.data;
      
      setIsAddModalOpen(false);
      
      const matchedStudent = students.find(s => s.id === formData.student_id) || selectedStudentPreview;
      
      const certObjForPrint: Certificate = {
        id: createdCert?.id || `BON-${Date.now().toString().slice(-4)}`,
        student_id: formData.student_id,
        student_name: matchedStudent ? `${matchedStudent.first_name} ${matchedStudent.last_name}` : 'Student',
        type: formData.type,
        reason: formData.reason,
        status: 'approved',
        created_at: new Date().toISOString(),
        grade: matchedStudent?.grade || 'UKG',
        date_of_birth: matchedStudent?.date_of_birth || '29/06/2020',
        admission_number: matchedStudent?.admission_number || 'ADM-2026-001',
        parent_name: matchedStudent?.parent_name || 'Ajit Kumar Verma',
        address: matchedStudent?.address || 'Pote corner , Near Tulja Bhawani Mandir , Sambhajinagar , Chinchwad, Pune - 411019.',
        school_name: matchedStudent?.school_name || 'Chinchwad Branch',
        gender: matchedStudent?.gender || 'male',
        issue_date: formData.issue_date ? (formData.issue_date.includes('/') ? formData.issue_date : new Date(formData.issue_date).toLocaleDateString('en-GB')) : new Date().toLocaleDateString('en-GB')
      };

      // Auto open print modal for immediate print
      setSelectedCertForPrint(certObjForPrint);
      setIsPrintModalOpen(true);

      // Automated Parent Notification dispatch
      const refNo = getFranchiseRefNo(certObjForPrint);
      const studentFullName = matchedStudent ? `${matchedStudent.first_name} ${matchedStudent.last_name}` : 'your child';
      const parentName = matchedStudent?.parent_name || 'Guardian';
      
      const noticeTitle = `📜 ${formData.type} Certificate Ready for ${studentFullName}`;
      const noticeContent = `Dear Parent (${parentName}), the official ${formData.type} Certificate (Ref No: ${refNo}) for ${studentFullName} has been generated and signed. Please collect it from the school office.`;

      const targetAudience = matchedStudent?.id ? `student:${matchedStudent.id}` : 'parents';

      apiClient.post('/notices', {
        title: noticeTitle,
        content: noticeContent,
        audience: targetAudience,
        date: new Date().toISOString().split('T')[0]
      }).catch(err => console.error('Parent notice dispatch error:', err));

      alert(`✅ Certificate Generated Successfully!\n\n🔔 Notification Sent to Parent (${parentName}):\n"${formData.type} Certificate (Ref: ${refNo}) is ready. Please collect from the school office."`);

      setFormData({
        student_id: '',
        type: 'Bonafide',
        reason: 'Educational Purpose / Bank Account',
        issue_date: new Date().toISOString().split('T')[0]
      });
      setSelectedStudentPreview(null);
      fetchData();
    } catch (error) {
      console.error('Failed to apply certificate', error);
      alert('Failed to submit application');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.put(`/certificates/${id}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status');
    }
  };

  const openPrintModal = (cert: Certificate) => {
    // Find detailed student info if available
    const matchedStudent = students.find(s => s.id === cert.student_id);
    setSelectedCertForPrint({
      ...cert,
      grade: matchedStudent?.grade || cert.grade || 'UKG',
      date_of_birth: matchedStudent?.date_of_birth || cert.date_of_birth || '29/06/2020',
      admission_number: matchedStudent?.admission_number || cert.admission_number || 'NUR-001',
      parent_name: matchedStudent?.parent_name || cert.parent_name || 'Ajit Kumar Verma',
      address: matchedStudent?.address || cert.address || 'Pote corner , Near Tulja Bhawani Mandir , Sambhajinagar , Chinchwad, Pune - 411019.',
      school_name: matchedStudent?.school_name || cert.school_name || 'Chinchwad Branch',
      gender: matchedStudent?.gender || cert.gender || 'male',
      issue_date: cert.created_at ? new Date(cert.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')
    });
    setIsPrintModalOpen(true);
  };

  const getFranchiseRefNo = (cert: Certificate) => {
    const branchName = (cert.school_name || 'Chinchwad Branch').toLowerCase();
    let branchCode = 'CHW';
    if (branchName.includes('chikhali')) branchCode = 'CHK';
    else if (branchName.includes('dudulgaon')) branchCode = 'DDG';
    else if (branchName.includes('eduneev')) branchCode = 'EDU';

    const certsInSameBranch = certificates.filter(c => {
      const b = (c.school_name || 'Chinchwad Branch').toLowerCase();
      if (branchCode === 'CHK') return b.includes('chikhali');
      if (branchCode === 'DDG') return b.includes('dudulgaon');
      if (branchCode === 'EDU') return b.includes('eduneev');
      return b.includes('chinchwad') || (!b.includes('chikhali') && !b.includes('dudulgaon'));
    });

    const certIndex = certsInSameBranch.findIndex(c => c.id === cert.id);
    const seqNum = (certIndex >= 0 ? certIndex + 1 : (certificates.length + 1)).toString().padStart(4, '0');

    return `BON-2026-${branchCode}-${seqNum}`;
  };

  const handlePrintCertificate = () => {
    const printContent = document.getElementById('printable-certificate');
    if (!printContent) return;
    const printWindow = window.open('about:blank', `Print_${Date.now()}`, 'width=900,height=1050');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${selectedCertForPrint?.type || 'Bonafide'} Certificate - EduNeev Kids Pre School</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Times New Roman', Times, serif;
                background: #ffffff;
                color: #000000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                size: A4;
                margin: 10mm;
              }
              @media print {
                body { margin: 0; }
              }
              img { max-width: 100%; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 600);
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cert.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || cert.status === statusFilter;
    
    let matchesClassFilter = true;
    if (selectedClassFilter !== 'ALL') {
      const certGrade = (cert.grade || '').toLowerCase().trim();
      const target = selectedClassFilter.toLowerCase().trim();
      if (certGrade === target) {
        matchesClassFilter = true;
      } else if (target === 'jr kg' && (certGrade.includes('jr') || certGrade.includes('junior') || certGrade === 'lkg')) {
        matchesClassFilter = true;
      } else if (target === 'sr kg' && (certGrade.includes('sr') || certGrade.includes('senior') || certGrade === 'ukg')) {
        matchesClassFilter = true;
      } else if (target === 'playgroup' && certGrade.includes('play')) {
        matchesClassFilter = true;
      } else if (target === 'nursery' && certGrade.includes('nursery')) {
        matchesClassFilter = true;
      } else if (target === 'daycare' && certGrade.includes('daycare')) {
        matchesClassFilter = true;
      } else {
        const matched = students.find(s => s.id === cert.student_id);
        if (matched) {
          matchesClassFilter = matchesClass(matched, selectedClassFilter);
        } else {
          matchesClassFilter = certGrade.includes(target);
        }
      }
    }

    return matchesSearch && matchesStatus && matchesClassFilter;
  });

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userRole = (loggedUser?.role || 'school_admin').toLowerCase();
  const isParent = userRole === 'parent';
  const isAdmin = userRole === 'super_admin' || userRole === 'school_admin' || userRole === 'owner';

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'ready': return '#3B82F6';
      default: return '#F59E0B'; // pending
    }
  };

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">Certificates & Bonafide System</h1>
              <p className="date-text">{isParent ? 'View and download official certificates for your child' : 'Auto-generate and print official Bonafide and school certificates'}</p>
            </div>
          </div>
          {isAdmin && (
            <button className="btn-primary" onClick={() => { setModalSelectedClass('ALL'); setIsAddModalOpen(true); }}>
              <Plus size={20} /> Issue New Certificate
            </button>
          )}
        </header>

        <div className="glass-card table-container">
          {/* Class Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', padding: '0.85rem 1.25rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }} className="no-scrollbar">
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem', marginRight: '0.25rem' }}>
              <GraduationCap size={16} color="#4F46E5" /> Class:
            </span>
            <button
              type="button"
              onClick={() => setSelectedClassFilter('ALL')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '1rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                border: selectedClassFilter === 'ALL' ? 'none' : '1px solid #CBD5E1',
                cursor: 'pointer',
                background: selectedClassFilter === 'ALL' ? '#4F46E5' : 'white',
                color: selectedClassFilter === 'ALL' ? 'white' : '#475569'
              }}
            >
              All Classes ({certificates.length})
            </button>
            {availableClasses.map(cls => {
              const isSel = selectedClassFilter === cls.name;
              return (
                <button
                  key={cls.name}
                  type="button"
                  onClick={() => setSelectedClassFilter(cls.name)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '1rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    border: isSel ? 'none' : '1px solid #CBD5E1',
                    cursor: 'pointer',
                    background: isSel ? '#4F46E5' : 'white',
                    color: isSel ? 'white' : '#475569'
                  }}
                >
                  🎓 {cls.name}
                </button>
              );
            })}
          </div>
          <div className="table-header flex-between">
            <div className="search-box">
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search students or types..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--background)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <Filter size={18} className="text-muted" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem' }}>
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="ready">Ready</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex-center py-8">Loading certificates...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Certificate Type</th>
                  <th>Reason / Details</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Print / Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.length > 0 ? (
                  filteredCertificates.map((cert) => (
                    <tr key={cert.id}>
                      <td>
                        <div className="font-bold text-main">
                          {cert.student_name}
                        </div>
                      </td>
                      <td>
                        <span className="section-badge" style={{ background: '#EEF2FF', color: '#4F46E5', fontWeight: 800 }}>📜 {cert.type}</span>
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cert.reason || '-'}
                      </td>
                      <td>{new Date(cert.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className="section-badge" style={{ background: `${getStatusColor(cert.status)}20`, color: getStatusColor(cert.status) }}>
                          {cert.status ? cert.status.charAt(0).toUpperCase() + cert.status.slice(1) : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn-secondary" 
                            onClick={() => openPrintModal(cert)} 
                            style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Printer size={15} /> Print Certificate
                          </button>
                          
                          {isAdmin && cert.status !== 'approved' && cert.status !== 'ready' && (
                            <button className="icon-btn" style={{ color: '#10B981' }} title="Approve" onClick={() => updateStatus(cert.id, 'approved')}>
                              <CheckCircle size={18} />
                            </button>
                          )}
                          {isAdmin && cert.status !== 'rejected' && (
                            <button className="icon-btn text-red" title="Reject" onClick={() => updateStatus(cert.id, 'rejected')}>
                              <XCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted">
                      No certificates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* System Generated Printable Certificate Modal */}
        {isPrintModalOpen && selectedCertForPrint && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '760px', maxWidth: '96vw', background: '#F1F5F9', padding: 0 }}>
              {/* Modal toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid #E2E8F0' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>
                  🖨️ {selectedCertForPrint.type === 'Offer Letter' ? 'Appointment Letter' : `${selectedCertForPrint.type} Certificate`} — Preview
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handlePrintCertificate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0D9488', color: 'white', border: 'none', padding: '0.5rem 1.1rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                    <Printer size={16} /> Print / Download
                  </button>
                  <button onClick={() => setIsPrintModalOpen(false)} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Certificate paper */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '80vh' }}>
                <div
                  id="printable-certificate"
                  style={{
                    background: '#FFFFFF',
                    fontFamily: "'Times New Roman', Times, serif",
                    color: '#000',
                    width: '100%',
                    boxSizing: 'border-box',
                    position: 'relative',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                  }}
                >
                  {/* Outer decorative double border */}
                  <div style={{ border: '6px double #8B0000', margin: '12px', padding: '0' }}>
                    <div style={{ border: '1.5px solid #8B0000', margin: '4px', padding: '2rem 2.5rem 2.5rem' }}>

                      {/* ── LETTERHEAD ── */}
                      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #8B0000', paddingBottom: '1rem', marginBottom: '1rem', position: 'relative' }}>
                        <img src="/logopre.png" alt="EduNeev Logo" style={{ height: '85px', width: 'auto', objectFit: 'contain', position: 'absolute', left: '10px' }} />
                        <div style={{ textAlign: 'center', width: '100%' }}>
                          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#8B0000', letterSpacing: '1px', lineHeight: 1.1, fontFamily: "'Times New Roman', Times, serif" }}>
                            EDUNEEV KIDS PRESCHOOL
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem', fontFamily: "'Times New Roman', Times, serif" }}>
                            {selectedCertForPrint.school_name || 'Chinchwad Branch'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#777', marginTop: '0.15rem', fontFamily: "'Times New Roman', Times, serif" }}>
                            A Foundation for the Future… Since 2013
                          </div>
                        </div>
                      </div>

                      {/* ── Ref No & Date ── */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#333', marginBottom: '1.5rem', fontFamily: "'Times New Roman', Times, serif" }}>
                        <div><strong>Ref No:</strong> {getFranchiseRefNo(selectedCertForPrint)}</div>
                        <div><strong>Date:</strong> {selectedCertForPrint.issue_date || new Date().toLocaleDateString('en-GB')}</div>
                      </div>

                      {/* ── Certificate Title ── */}
                      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{
                          display: 'inline-block',
                          fontSize: '1.5rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '3px',
                          color: '#8B0000',
                          borderBottom: '2px solid #8B0000',
                          paddingBottom: '0.3rem',
                          fontFamily: "'Times New Roman', Times, serif",
                        }}>
                          {selectedCertForPrint.type === 'Offer Letter' ? 'OFFER LETTER OF APPOINTMENT' : `${selectedCertForPrint.type.toUpperCase()} CERTIFICATE`}
                        </div>
                        <div style={{ marginTop: '0.6rem', fontSize: '1rem', fontStyle: 'italic', color: '#444', fontFamily: "'Times New Roman', Times, serif" }}>
                          {selectedCertForPrint.type === 'Offer Letter' ? '(Private & Confidential)' : '(To Whomsoever it may Concern)'}
                        </div>
                      </div>

                      {/* ── Body ── */}
                      {selectedCertForPrint.type === 'Offer Letter' ? (
                        <div style={{ fontSize: '1rem', lineHeight: '2', textAlign: 'justify', color: '#000', fontFamily: "'Times New Roman', Times, serif", marginBottom: '2rem' }}>
                          <p style={{ marginBottom: '1rem' }}>Dear <strong><u>{selectedCertForPrint.student_name}</u></strong>,</p>
                          <p style={{ marginBottom: '1rem' }}>
                            We are pleased to offer you employment at <strong>Eduneev Kids Pre School ({selectedCertForPrint.school_name || 'Chinchwad Branch'})</strong> as <strong><u>{selectedCertForPrint.reason || 'Faculty / Staff Member'}</u></strong>.
                          </p>
                          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0', border: '1px solid #ccc', fontSize: '0.95rem' }}>
                            <tbody>
                              <tr style={{ background: '#FFF5F5' }}>
                                <td style={{ padding: '0.5rem 0.8rem', fontWeight: 700, borderBottom: '1px solid #ddd', width: '45%' }}>Date of Offer Issue</td>
                                <td style={{ padding: '0.5rem 0.8rem', borderBottom: '1px solid #ddd' }}>{selectedCertForPrint.issue_date || new Date().toLocaleDateString('en-GB')}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '0.5rem 0.8rem', fontWeight: 700, borderBottom: '1px solid #ddd' }}>Expected Date of Joining</td>
                                <td style={{ padding: '0.5rem 0.8rem', borderBottom: '1px solid #ddd' }}>{new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB')}</td>
                              </tr>
                              <tr style={{ background: '#FFF5F5' }}>
                                <td style={{ padding: '0.5rem 0.8rem', fontWeight: 700 }}>Offer Acceptance Deadline</td>
                                <td style={{ padding: '0.5rem 0.8rem' }}>{new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB')}</td>
                              </tr>
                            </tbody>
                          </table>
                          <p>We welcome you to the Eduneev team and look forward to a long and successful association.</p>
                        </div>
                      ) : (
                        <div style={{ fontSize: '1.05rem', lineHeight: '2.4', textAlign: 'justify', color: '#000', fontFamily: "'Times New Roman', Times, serif", marginBottom: '2.5rem', padding: '0 0.5rem' }}>
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;This is to certify that{' '}
                          <strong><u>{selectedCertForPrint.gender === 'female' ? 'Baby' : 'Master'}{' '}{selectedCertForPrint.student_name}</u></strong>
                          {' '}
                          {selectedCertForPrint.gender === 'female' ? 'D/O' : 'S/O'} Mr.{' '}
                          <strong><u>{selectedCertForPrint.parent_name || 'Ajit Kumar Verma'}</u></strong>
                          {' '}is a <strong>bonafide student</strong> of{' '}
                          <strong><u>Eduneev Kids Pre School</u></strong>
                          {' '}at{' '}
                          <strong>{selectedCertForPrint.school_name?.replace('Branch', '').trim() || 'Chinchwad'}</strong>
                          {' '}and is studying in{' '}
                          <strong><u>{selectedCertForPrint.grade || 'UKG'}</u></strong>.{' '}
                          The date of birth of this student as per our records is{' '}
                          <strong><u>{selectedCertForPrint.date_of_birth || '29/06/2020'}</u></strong>.{' '}
                          {selectedCertForPrint.gender === 'female' ? 'Her' : 'His'} address as per our record is{' '}
                          <strong><u>{selectedCertForPrint.address || 'Pote corner, Near Tulja Bhawani Mandir, Sambhajinagar, Chinchwad, Pune - 411019.'}</u></strong>
                        </div>
                      )}

                      {/* ── Purpose line ── */}
                      {selectedCertForPrint.type !== 'Offer Letter' && (
                        <div style={{ fontSize: '0.95rem', color: '#333', marginBottom: '2rem', fontFamily: "'Times New Roman', Times, serif" }}>
                          This certificate is issued for <strong>{selectedCertForPrint.reason || 'Educational Purpose / Bank Account'}</strong> purpose on the request of the concerned.
                        </div>
                      )}

                      {/* ── Signature block ── */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '3rem', fontFamily: "'Times New Roman', Times, serif" }}>
                        <div style={{ fontSize: '0.9rem', color: '#444' }}>
                          <div style={{ borderTop: '1px solid #333', width: '160px', marginBottom: '0.3rem' }}></div>
                          <div>Parent / Guardian Signature</div>
                        </div>

                        {/* Stamp space left empty as stamp is given physically */}
                        <div style={{ width: '90px' }}></div>

                        <div style={{ fontSize: '0.9rem', color: '#000', textAlign: 'right' }}>
                          <div style={{ marginBottom: '2.5rem', fontStyle: 'italic', fontSize: '0.85rem', color: '#555' }}>for Eduneev Kids Pre School</div>
                          <div style={{ borderTop: '1.5px solid #333', width: '180px', marginBottom: '0.3rem', marginLeft: 'auto' }}></div>
                          <div style={{ fontWeight: 700 }}>Principal / Authorized Signatory</div>
                        </div>
                      </div>

                      {/* ── Footer strip ── */}
                      <div style={{ marginTop: '1.5rem', paddingTop: '0.6rem', borderTop: '1px solid #ccc', textAlign: 'center', fontSize: '0.75rem', color: '#888', fontFamily: "'Times New Roman', Times, serif" }}>
                        This is a computer-generated certificate. | Eduneev Kids Preschool — {selectedCertForPrint.school_name || 'Chinchwad Branch'}
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', background: 'white', borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} style={{ padding: '0.5rem 1.2rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, cursor: 'pointer' }}>Close</button>
                <button type="button" onClick={handlePrintCertificate} style={{ padding: '0.5rem 1.4rem', borderRadius: '0.5rem', border: 'none', background: '#6366F1', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Printer size={16} /> Print Certificate Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Certificate Modal */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '580px', width: '95%' }}>
              <div className="modal-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>Issue Certificate</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    Select Class first, then choose student to generate official certificate
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form" style={{ marginTop: '0.75rem' }}>
                
                {/* 1. CLASS SELECTION */}
                <div className="form-group" style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.85rem', border: '1.5px solid #E2E8F0', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, textTransform: 'uppercase' }}>
                      <GraduationCap size={18} color="#4F46E5" /> 1. Select Class *
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: '10px' }}>
                      {modalFilteredStudents.length} Students
                    </span>
                  </div>

                  {/* Class Dropdown */}
                  <select 
                    className="input-field" 
                    value={modalSelectedClass} 
                    onChange={(e) => handleModalClassChange(e.target.value)}
                    style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem', background: 'white' }}
                  >
                    <option value="ALL">🏫 All Classes ({students.length} Students)</option>
                    {availableClasses.map(cls => (
                      <option key={cls.name} value={cls.name}>
                        🎓 {cls.name} ({getStudentCountForClass(cls.name)} Students)
                      </option>
                    ))}
                  </select>

                  {/* Quick Class Pills */}
                  <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingTop: '0.2rem' }} className="no-scrollbar">
                    <button
                      type="button"
                      onClick={() => handleModalClassChange('ALL')}
                      style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        background: modalSelectedClass === 'ALL' ? '#4F46E5' : '#E2E8F0',
                        color: modalSelectedClass === 'ALL' ? 'white' : '#475569'
                      }}
                    >
                      All ({students.length})
                    </button>
                    {availableClasses.map(cls => {
                      const isSel = modalSelectedClass === cls.name;
                      const count = getStudentCountForClass(cls.name);
                      return (
                        <button
                          key={cls.name}
                          type="button"
                          onClick={() => handleModalClassChange(cls.name)}
                          style={{
                            padding: '0.3rem 0.7rem',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            border: isSel ? 'none' : '1px solid #CBD5E1',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            background: isSel ? '#4F46E5' : 'white',
                            color: isSel ? 'white' : '#475569'
                          }}
                        >
                          {cls.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. STUDENT SELECTION (FILTERED BY CLASS) */}
                <div className="form-group">
                  <label style={{ fontWeight: 900, color: '#1E293B', display: 'flex', justifyContent: 'space-between' }}>
                    <span>2. Select Student <span style={{ color: 'red' }}>*</span></span>
                    {modalSelectedClass !== 'ALL' && (
                      <span style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 700 }}>
                        Filtered by: {modalSelectedClass}
                      </span>
                    )}
                  </label>
                  <select name="student_id" className="input-field" value={formData.student_id} onChange={handleInputChange} required>
                    <option value="">
                      {modalFilteredStudents.length > 0 
                        ? `-- Choose Student (${modalFilteredStudents.length} available) --`
                        : `-- No students in ${modalSelectedClass} --`}
                    </option>
                    {modalFilteredStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        [{s.school_name || 'EduNeev Preschool'}] {s.first_name} {s.last_name} — Class: {s.grade || 'Nursery'} (Adm: {s.admission_number || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudentPreview && (
                  <div style={{ background: '#EEF2FF', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #C7D2FE', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#4338CA', fontWeight: 800, textTransform: 'uppercase' }}>AUTO-POPULATED STUDENT DETAILS</span>
                        <h4 style={{ margin: '0.2rem 0 0 0', color: '#1E1B4B', fontWeight: 900, fontSize: '1.05rem' }}>{selectedStudentPreview.first_name} {selectedStudentPreview.last_name}</h4>
                      </div>
                      <span style={{ background: '#3730A3', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                        {selectedStudentPreview.grade || 'Nursery'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#3730A3', borderTop: '1px dashed #C7D2FE', paddingTop: '0.5rem' }}>
                      <div><strong>ADM No:</strong> {selectedStudentPreview.admission_number || 'N/A'}</div>
                      <div><strong>Date of Birth:</strong> {selectedStudentPreview.date_of_birth || 'N/A'}</div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label style={{ fontWeight: 800 }}>Certificate / Letter Type <span style={{ color: 'red' }}>*</span></label>
                  <select name="type" className="input-field" value={formData.type} onChange={handleInputChange} required style={{ fontWeight: 700 }}>
                    <option value="Bonafide">Bonafide Certificate</option>
                    <option value="Offer Letter">📄 Official Offer Letter / Appointment Letter</option>
                    <option value="Leaving">School Leaving Certificate</option>
                    <option value="Character">Character Certificate</option>
                    <option value="Transfer">Transfer Certificate</option>
                    <option value="Other">Other Document</option>
                  </select>
                </div>

                {/* Date Picker Fields Section */}
                <div style={{ display: 'grid', gridTemplateColumns: formData.type === 'Offer Letter' ? '1fr 1fr 1fr' : '1fr', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, fontSize: '0.85rem', color: '#1E293B' }}>
                      📅 {formData.type === 'Offer Letter' ? 'Offer Date' : 'Issue Date'} <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input 
                      type="date" 
                      name="issue_date" 
                      className="input-field" 
                      value={formData.issue_date} 
                      onChange={handleInputChange} 
                      required 
                      style={{ cursor: 'pointer', background: 'white' }}
                    />
                  </div>

                  {formData.type === 'Offer Letter' && (
                    <>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, fontSize: '0.85rem', color: '#166534' }}>
                          🚀 Joining Date <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input 
                          type="date" 
                          name="joining_date" 
                          className="input-field" 
                          value={(formData as any).joining_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]} 
                          onChange={handleInputChange} 
                          required 
                          style={{ cursor: 'pointer', background: 'white' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, fontSize: '0.85rem', color: '#991B1B' }}>
                          ⏳ Offer Expiry Date
                        </label>
                        <input 
                          type="date" 
                          name="offer_expiry_date" 
                          className="input-field" 
                          value={(formData as any).offer_expiry_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]} 
                          onChange={handleInputChange} 
                          style={{ cursor: 'pointer', background: 'white' }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 800 }}>Reason / Designation / Remarks</label>
                  <textarea name="reason" className="input-field" rows={2} placeholder="e.g. Appointed as Assistant Teacher / For Bank Account Opening" value={formData.reason} onChange={handleInputChange} required />
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: '#0D9488' }}>
                    ⚡ Generate {formData.type === 'Offer Letter' ? 'Offer Letter' : 'Certificate'} & Print
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CertificatesManagement;

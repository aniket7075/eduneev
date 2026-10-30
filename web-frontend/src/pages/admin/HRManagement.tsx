import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Sidebar from '../../components/Sidebar';
import { Search, Plus, Users, Briefcase, ArrowLeft, X, Wallet, CheckCircle, FileText, Printer, Download, CreditCard } from 'lucide-react';
import './Directory.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const HRManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchPayrolls = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/hr/payroll', {
        params: { month: selectedMonth, year: selectedYear }
      });
      setPayrolls(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch payroll', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  // Modal states
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  // Disburse / Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedStaffForPay, setSelectedStaffForPay] = useState<any | null>(null);
  const [payMethod, setPayMethod] = useState('Online / NEFT Bank Transfer');
  const [payUtrRef, setPayUtrRef] = useState('');
  const [payingSalary, setPayingSalary] = useState(false);

  // Payslip Modal State
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedStaffForPayslip, setSelectedStaffForPayslip] = useState<any | null>(null);

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await apiClient.post('/hr/payroll/generate', { 
        month: payrollMonth, 
        year: payrollYear,
        allowances: 0,
        deductions: 0
      });
      setIsPayrollModalOpen(false);
      setSelectedMonth(payrollMonth);
      setSelectedYear(payrollYear);
      fetchPayrolls();
      alert('Payroll generated successfully.');
    } catch (error: any) {
      console.error('Failed to generate payroll', error);
      alert(error.response?.data?.error || 'Could not generate payroll.');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenPayModal = (staff: any) => {
    setSelectedStaffForPay(staff);
    setPayMethod('Online / NEFT Bank Transfer');
    setPayUtrRef(`SAL-UTR-${Date.now().toString().slice(-6)}`);
    setIsPayModalOpen(true);
  };

  const handleConfirmDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForPay) return;
    setPayingSalary(true);
    try {
      const fullRef = `${payMethod} - ${payUtrRef.trim() || 'REF#DIRECT'}`;
      await apiClient.put(`/hr/payroll/${selectedStaffForPay.id}/pay`, { 
        payment_reference: fullRef 
      });
      alert(`✅ Salary for ${selectedStaffForPay.staff_name} marked as PAID!\nRef: ${fullRef}`);
      setIsPayModalOpen(false);
      setSelectedStaffForPay(null);
      fetchPayrolls();
    } catch (error: any) {
      console.error('Failed to mark as paid', error);
      alert(error.response?.data?.error || 'Could not update status.');
    } finally {
      setPayingSalary(false);
    }
  };

  const handleOpenPayslip = (staff: any) => {
    setSelectedStaffForPayslip(staff);
    setIsPayslipModalOpen(true);
  };

  const handlePrintPayslip = () => {
    const printContent = document.getElementById('printable-payslip');
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EduNeev Employee Salary Slip</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #0F172A; margin: 0; padding: 15px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px 12px; font-size: 12px; }
            .border-box { border: 1px solid #CBD5E1; border-radius: 8px; margin-bottom: 12px; }
            .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 20px; color: #1E1B4B; }
            .header p { margin: 3px 0 0 0; font-size: 12px; color: #64748B; }
            .table-head { background: #F1F5F9; font-weight: 800; border-bottom: 1px solid #CBD5E1; }
            .net-box { background: #ECFDF5; border: 1px solid #A7F3D0; padding: 12px; border-radius: 8px; text-align: right; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPayrollCSV = () => {
    if (payrolls.length === 0) {
      alert('No payroll records found to export for this month.');
      return;
    }
    const headers = ['Employee ID', 'Staff Name', 'Role', 'Department', 'Month', 'Year', 'Working Days', 'Present Days', 'Basic Salary', 'Allowances', 'Leave Deductions', 'PF Deduction', 'Net Salary', 'Status', 'Payment Ref / UTR'];
    const rows = payrolls.map(p => [
      `"${p.employee_id || 'EMP-N/A'}"`,
      `"${p.staff_name || '-'}"`,
      `"${p.role || '-'}"`,
      `"${p.department || '-'}"`,
      MONTHS[selectedMonth - 1],
      selectedYear,
      p.working_days || 26,
      p.present_days || 26,
      p.base_salary || p.basic_salary || 0,
      p.allowances || 0,
      p.leave_deductions || 0,
      p.pf_deduction || 0,
      p.net_salary || 0,
      `"${p.status || 'pending'}"`,
      `"${p.payment_reference || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `EduNeev_Payroll_${MONTHS[selectedMonth - 1]}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return <span style={{ background: '#D1FAE5', color: '#059669', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 }}>SALARY PAID ✅</span>;
      case 'pending': 
      case 'unpaid': return <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 }}>UNPAID ⏳</span>;
      default: return <span style={{ background: '#F1F5F9', color: '#64748B', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 }}>{status?.toUpperCase()}</span>;
    }
  };

  const filteredStaff = payrolls.filter(staff => {
    const role = (staff.role || '').toLowerCase();
    if (role === 'super_admin' || role === 'school_admin' || role === 'admin' || role === 'owner') return false;
    return staff.staff_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPayroll = filteredStaff.reduce((sum, staff) => sum + Number(staff.net_salary || 0), 0);
  const totalPaid = filteredStaff.filter(s => s.status === 'paid').reduce((sum, staff) => sum + Number(staff.net_salary || 0), 0);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <header className="header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">HR Salary & Payroll Management</h1>
              <p className="date-text">Process salaries, generate staff payslips & track disbursements with UTR reference</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/staff')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#4338CA',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.15rem',
                borderRadius: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '0.9rem',
                boxShadow: '0 4px 6px -1px rgba(67, 56, 202, 0.25)'
              }}
              title="Add Teachers, Principals and manage staff permissions"
            >
              <Users size={17} /> Manage Staff (Teachers & Admins)
            </button>
            <button
              onClick={handleExportPayrollCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#047857',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.15rem',
                borderRadius: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '0.9rem',
                boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.2)'
              }}
              title="Export Current Month Payroll to CSV"
            >
              <Download size={17} /> Export Payroll (CSV)
            </button>
            <button 
              className="btn-primary" 
              onClick={() => setIsPayrollModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4F46E5', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)', fontSize: '0.9rem' }}
            >
              <Plus size={19} /> Process Monthly Payroll
            </button>
          </div>
        </header>

        {/* Dynamic Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '1rem', background: '#F1F5F9', color: '#475569', borderRadius: '1rem' }}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Processed Staff</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#0F172A', fontSize: '1.75rem', fontWeight: 900 }}>{filteredStaff.length}</h3>
            </div>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #FEF3C7' }}>
            <div style={{ padding: '1rem', background: '#FFFBEB', color: '#D97706', borderRadius: '1rem' }}>
              <Briefcase size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#D97706', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Expected Payroll ({MONTHS[selectedMonth - 1]})</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#92400E', fontSize: '1.75rem', fontWeight: 900 }}>₹ {totalPayroll.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #D1FAE5' }}>
            <div style={{ padding: '1rem', background: '#ECFDF5', color: '#059669', borderRadius: '1rem' }}>
              <CheckCircle size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#059669', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Disbursed</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#064E3B', fontSize: '1.75rem', fontWeight: 900 }}>₹ {totalPaid.toLocaleString('en-IN')}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="search-box" style={{ width: '320px' }}>
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search staff name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {MONTHS.map((m, idx) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(idx + 1)}
                  style={{
                    padding: '0.45rem 1.1rem', borderRadius: '99px', fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: selectedMonth === (idx + 1) ? '#4F46E5' : '#F1F5F9',
                    color: selectedMonth === (idx + 1) ? 'white' : '#475569',
                    fontSize: '0.85rem', transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="flex-center py-8 text-muted">Loading payroll records...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee Details</th>
                    <th>Attendance & Working Days</th>
                    <th>Salary Breakup</th>
                    <th>Net Payable (₹)</th>
                    <th>Status & Payment Ref</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff) => {
                    const isPaid = staff.status === 'paid';
                    const baseSal = Number(staff.base_salary || staff.basic_salary || 0);
                    const netSal = Number(staff.net_salary || 0);
                    const workingDays = staff.working_days || 26;
                    const presentDays = staff.present_days || 26;

                    return (
                      <tr key={staff.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.975rem' }}>{staff.staff_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase' }}>
                            {staff.designation || staff.role || 'Teacher'} • {staff.department || 'Academic'}
                          </div>
                          {staff.employee_id && (
                            <span style={{ fontSize: '0.7rem', color: '#6366F1', fontWeight: 800 }}>ID: {staff.employee_id}</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 700 }}>
                            {presentDays} / {workingDays} Days
                          </div>
                          <div style={{ fontSize: '0.75rem', color: presentDays === workingDays ? '#059669' : '#D97706', fontWeight: 700 }}>
                            {Math.round((presentDays / (workingDays || 1)) * 100)}% Attendance
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                            <span style={{ color: '#64748B' }}>Basic: <strong style={{ color: '#334155' }}>₹ {baseSal.toLocaleString('en-IN')}</strong></span>
                            {Number(staff.leave_deductions || 0) > 0 && (
                              <span style={{ color: '#DC2626' }}>Leave Cut: -₹ {Number(staff.leave_deductions).toLocaleString('en-IN')}</span>
                            )}
                            {Number(staff.pf_deduction || 0) > 0 && (
                              <span style={{ color: '#64748B' }}>PF: -₹ {Number(staff.pf_deduction).toLocaleString('en-IN')}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: 900, color: '#059669', fontSize: '1.1rem' }}>
                          ₹ {netSal.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <div>{getStatusBadge(staff.status)}</div>
                          {staff.payment_reference && (
                            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px', fontFamily: 'monospace' }}>
                              Ref: {staff.payment_reference}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => handleOpenPayslip(staff)}
                              style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              title="View & Print Official Payslip"
                            >
                              <FileText size={15} /> Payslip
                            </button>
                            {!isPaid ? (
                              <button 
                                onClick={() => handleOpenPayModal(staff)}
                                style={{ background: '#059669', color: 'white', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)' }}
                              >
                                <CreditCard size={15} /> Disburse / Pay
                              </button>
                            ) : (
                              <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <CheckCircle size={15} /> Disbursed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStaff.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted" style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <Wallet size={48} color="#CBD5E1" />
                          No payroll records found for {MONTHS[selectedMonth - 1]} {selectedYear}.
                          <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Click "Process Monthly Payroll" to generate salaries.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Process Payroll Modal */}
      {isPayrollModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '450px' }}>
            <div className="modal-header">
              <h2>Process Monthly Payroll</h2>
              <button className="icon-btn" onClick={() => setIsPayrollModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              This calculates salaries for all active staff members based on their base salary, attendance register, and approved leaves.
            </p>
            <form onSubmit={handleProcessPayroll} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Month</label>
                  <select 
                    className="input-field" 
                    value={payrollMonth} 
                    onChange={e => setPayrollMonth(parseInt(e.target.value))} 
                    required
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={payrollYear} 
                    onChange={e => setPayrollYear(parseInt(e.target.value))} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsPayrollModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={generating} className="btn-primary" style={{ background: '#4F46E5', padding: '0.75rem 1.5rem', fontWeight: 800 }}>
                  {generating ? 'Processing Salaries...' : 'Generate Payroll Now ⚡'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse / Pay Salary Modal with UTR Ref */}
      {isPayModalOpen && selectedStaffForPay && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '480px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A' }}>Disburse Staff Salary</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Record salary payout with UTR / bank transaction reference
                </p>
              </div>
              <button className="icon-btn" onClick={() => setIsPayModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', margin: '1rem 0', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>EMPLOYEE NAME</p>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: '#1E293B', fontWeight: 900 }}>{selectedStaffForPay.staff_name}</h3>
                <span style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 700 }}>{selectedStaffForPay.role} • {MONTHS[selectedMonth - 1]} {selectedYear}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>NET PAYABLE</p>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem', color: '#059669', fontWeight: 900 }}>
                  ₹ {Number(selectedStaffForPay.net_salary || 0).toLocaleString('en-IN')}
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmDisbursement} className="modal-form">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Payment Method</label>
                <select
                  className="input-field"
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  style={{ fontWeight: 700 }}
                >
                  <option value="Online / NEFT Bank Transfer">Online / NEFT Bank Transfer</option>
                  <option value="UPI / IMPS Transfer">UPI / IMPS Transfer</option>
                  <option value="Cheque Payment">Cheque Payment</option>
                  <option value="Cash Payment">Cash Payment</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>UTR No. / Transaction Reference / Cheque No. <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. UTR# 492019284012 or UPI Ref"
                  value={payUtrRef}
                  onChange={e => setPayUtrRef(e.target.value)}
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsPayModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={payingSalary} className="btn-primary" style={{ background: '#059669', color: 'white', padding: '0.75rem 1.5rem', fontWeight: 800 }}>
                  {payingSalary ? 'Recording...' : 'Confirm Salary Payout ✅'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Payslip Modal */}
      {isPayslipModalOpen && selectedStaffForPayslip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '600px', maxWidth: '95vw', padding: '1.75rem' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={22} color="#4F46E5" />
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Official Staff Payslip</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handlePrintPayslip}
                  className="btn-primary"
                  style={{ background: '#059669', padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Printer size={16} /> Print Payslip 🖨️
                </button>
                <button className="icon-btn" onClick={() => setIsPayslipModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Payslip Container */}
            <div id="printable-payslip" style={{ marginTop: '1.25rem', fontFamily: 'sans-serif', color: '#0F172A' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px double #4F46E5', paddingBottom: '12px', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  EduNeev Kids International Preschool
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                  Staff Salary Slip for {MONTHS[selectedMonth - 1]} {selectedYear}
                </p>
              </div>

              {/* Employee Summary Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                <div><strong>Employee:</strong> {selectedStaffForPayslip.staff_name}</div>
                <div><strong>Designation:</strong> {selectedStaffForPayslip.designation || selectedStaffForPayslip.role}</div>
                <div><strong>Working Days:</strong> {selectedStaffForPayslip.working_days || 26} Days</div>
                <div><strong>Days Present:</strong> {selectedStaffForPayslip.present_days || 26} Days</div>
                <div><strong>Department:</strong> {selectedStaffForPayslip.department || 'Teaching'}</div>
                <div><strong>Status:</strong> {selectedStaffForPayslip.status?.toUpperCase()}</div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#EEF2FF', padding: '6px 10px', fontWeight: 800, fontSize: '0.8rem', color: '#4F46E5' }}>
                    EARNINGS (₹)
                  </div>
                  <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 10px' }}>Basic Salary</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>
                          ₹ {Number(selectedStaffForPayslip.base_salary || selectedStaffForPayslip.basic_salary || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 10px' }}>Allowances</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>
                          ₹ {Number(selectedStaffForPayslip.allowances || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr style={{ background: '#F8FAFC', fontWeight: 800 }}>
                        <td style={{ padding: '6px 10px' }}>Gross Earnings</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                          ₹ {Number((selectedStaffForPayslip.base_salary || 0) + (selectedStaffForPayslip.allowances || 0)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#FEF2F2', padding: '6px 10px', fontWeight: 800, fontSize: '0.8rem', color: '#DC2626' }}>
                    DEDUCTIONS (₹)
                  </div>
                  <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 10px' }}>Leave Deductions</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                          -₹ {Number(selectedStaffForPayslip.leave_deductions || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 10px' }}>PF (12%)</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                          -₹ {Number(selectedStaffForPayslip.pf_deduction || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr style={{ background: '#F8FAFC', fontWeight: 800 }}>
                        <td style={{ padding: '6px 10px' }}>Total Deductions</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', color: '#DC2626' }}>
                          -₹ {Number((selectedStaffForPayslip.leave_deductions || 0) + (selectedStaffForPayslip.pf_deduction || 0)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net Salary Payable */}
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>NET SALARY PAID</span>
                  <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '2px' }}>
                    Ref / UTR: {selectedStaffForPayslip.payment_reference || 'DIRECT-NEFT-PROCESSED'}
                  </div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#047857' }}>
                  ₹ {Number(selectedStaffForPayslip.net_salary || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Signatures */}
              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B', paddingTop: '16px', borderTop: '1px dashed #CBD5E1' }}>
                <div>Employee Signature: __________________</div>
                <div>Authorized Signatory (HR / Director): __________________</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRManagement;

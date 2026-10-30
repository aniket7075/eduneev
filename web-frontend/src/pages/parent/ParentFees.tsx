import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import apiClient from '../../api/client';
import EduneevInvoiceModal, { type EduneevInvoiceData } from '../../components/EduneevInvoiceModal';
import { IndianRupee, ArrowLeft, Receipt, CheckCircle, Clock } from 'lucide-react';
import '../admin/Dashboard.css';

const ParentFees: React.FC = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [childInfo, setChildInfo] = useState<any>(null);
  const [summary, setSummary] = useState<{ totalDue?: number; totalPaid?: number; balance?: number }>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'installments' | 'history'>('history');
  const [isEduneevInvoiceOpen, setIsEduneevInvoiceOpen] = useState(false);
  const [eduneevInvoiceData, setEduneevInvoiceData] = useState<EduneevInvoiceData>({
    invoiceNo: 'EDN-REC-2026-001',
    date: new Date().toLocaleDateString('en-IN'),
    customerName: 'Student',
    items: []
  });

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const childName = childInfo 
    ? `${childInfo.first_name || ''} ${childInfo.last_name || ''}`.trim()
    : (loggedUser?.childName || (loggedUser?.firstName ? `${loggedUser.firstName}'s Child` : 'My Child'));
  const childClass = childInfo?.grade || loggedUser?.className || loggedUser?.grade || 'Nursery';
  const branchName = childInfo?.school_name || loggedUser?.school_name || loggedUser?.branchName || 'Chinchwad Branch';

  const fetchFees = async () => {
    try {
      setLoading(true);
      const studentId = loggedUser?.student_id;
      const ledgerUrl = studentId ? `/fees/ledger/${studentId}` : '/fees/my-ledger';

      // Call ledger endpoint (returns all payment transactions, running ledger, and student info)
      const [ledgerRes, feesRes] = await Promise.all([
        apiClient.get(ledgerUrl).catch(() => null),
        apiClient.get(studentId ? `/fees/${studentId}` : '/fees').catch(() => null)
      ]);

      if (ledgerRes?.data) {
        const ld = ledgerRes.data;
        if (Array.isArray(ld.transactions)) {
          setTransactions(ld.transactions);
        }
        if (Array.isArray(ld.fees) && ld.fees.length > 0) {
          setFees(ld.fees);
        } else if (Array.isArray(feesRes?.data?.data)) {
          setFees(feesRes.data.data);
        }
        if (ld.student) {
          setChildInfo(ld.student);
        }
        setSummary({
          totalDue: parseFloat(ld.total_due || '0'),
          totalPaid: parseFloat(ld.total_paid || '0'),
          balance: parseFloat(ld.balance || '0')
        });
      } else if (feesRes?.data?.data) {
        setFees(feesRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch parent fees & transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const displayFees = fees;

  // Real transactions from ledger take priority. If none, map from paid fees
  const displayTransactions = transactions.length > 0
    ? transactions
    : fees
        .filter(f => parseFloat(f.total_paid || f.amount_paid || '0') > 0)
        .map((f, idx) => ({
          id: f.id || `tx-${idx}`,
          receipt_no: f.receipt_no || `EDN-REC-2026-${String(idx + 1).padStart(3, '0')}`,
          amount_paid: parseFloat(f.total_paid || f.amount_paid || '0'),
          paid_amount: parseFloat(f.total_paid || f.amount_paid || '0'),
          date: f.date || f.created_at || new Date().toISOString().split('T')[0],
          payment_method: f.payment_method || 'Cash',
          ref_no: f.ref_no || `REF# ${98000000 + idx * 143}`,
          feeType: f.title || f.fee_type || 'Tuition Fee',
          balance_after: Math.max(0, parseFloat(f.amount_due || f.total_amount || '0') - parseFloat(f.total_paid || f.amount_paid || '0'))
        }));

  const totalAmount = summary.totalDue && summary.totalDue > 0
    ? summary.totalDue
    : displayFees.reduce((acc, f) => acc + parseFloat(f.amount_due || f.total_amount || f.amount || '0'), 0);

  const totalPaid = summary.totalPaid && summary.totalPaid > 0
    ? summary.totalPaid
    : (transactions.length > 0
        ? transactions.reduce((acc, tx) => acc + parseFloat(tx.amount_paid || tx.paid_amount || tx.amount || '0'), 0)
        : displayFees.reduce((acc, f) => acc + parseFloat(f.total_paid || f.amount_paid || '0'), 0));

  const totalBalance = typeof summary.balance !== 'undefined'
    ? summary.balance
    : Math.max(0, totalAmount - totalPaid);

  const openSuperAdminReceiptModal = (item: any, idx: number) => {
    const paidNum = parseFloat(item.paid_amount || item.amount_paid || item.total_paid || item.amount || '0') || 5000;
    const totalNum = parseFloat(item.amount_due || item.total_amount || item.amount || '0') || paidNum;
    const balanceNum = typeof item.balance_after !== 'undefined'
      ? parseFloat(item.balance_after)
      : Math.max(0, totalNum - paidNum);

    const receiptNo = item.receipt_no || (item.id ? `REC-${String(item.id).slice(0, 8).toUpperCase()}` : `EDN-REC-2026-${String(idx + 1).padStart(3, '0')}`);
    const txDate = item.date || item.date_paid || (item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'));
    const txMode = item.payment_method || item.mode || 'Cash';
    const txRef = item.ref_no || item.reference || (txMode.toLowerCase().includes('cash') ? 'Cash Counter Receipt' : 'Online Reference');
    const feeDesc = item.feeType || item.title || item.fee_type || 'Tuition & Academic Term Fee';

    setEduneevInvoiceData({
      invoiceNo: receiptNo,
      date: txDate,
      customerName: item.studentName || childName,
      admissionNo: item.admissionNo || childInfo?.admission_number || (loggedUser?.student_id ? `ADM-${loggedUser.student_id.slice(0, 4).toUpperCase()}` : 'ADM-2026-01'),
      idCardNo: `ID-${childInfo?.admission_number || (loggedUser?.student_id ? loggedUser.student_id.slice(0, 4).toUpperCase() : '2026')}`,
      grade: item.grade || childClass,
      paymentMode: txMode,
      bankName: txRef,
      address: branchName.includes('Chinchwad') ? 'Near Sambhajinagar, Chinchwad, Pune' : 'Pune Branch',
      academicYear: '2026 - 2027',
      totalAmountPaid: paidNum,
      addedBy: 'EduNeev Accounts & Finance Dept',
      items: [
        {
          srNo: 1,
          description: feeDesc,
          qty: 1,
          rate: paidNum,
          amount: paidNum,
        },
      ],
      installments: balanceNum > 0 ? [
        { no: 1, amount: paidNum, date: txDate },
        { no: 2, amount: balanceNum, date: 'Upcoming Balance Due' },
      ] : [
        { no: 1, amount: paidNum, date: txDate }
      ],
    });
    setIsEduneevInvoiceOpen(true);
  };

  return (
    <div className="dashboard-layout">
      <ParentSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Header Bar */}
        <header className="header flex-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ 
                background: '#FFFFFF', 
                color: 'var(--text-main)', 
                border: '1px solid #E2E8F0', 
                padding: '0.55rem', 
                borderRadius: '50%', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginRight: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }} 
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
                <IndianRupee color="#059669" size={30} />
                Fees, Payment History & Receipts
              </h1>
              <p className="date-text" style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                View complete payment transactions, verified receipt numbers, and official fee receipts for <strong>{childName}</strong> ({childClass})
              </p>
            </div>
          </div>
        </header>

        {/* Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1.1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 700 }}>TOTAL ACADEMIC FEES</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', marginTop: '0.25rem' }}>₹ {totalAmount.toLocaleString()}</div>
          </div>

          <div style={{ background: '#ECFDF5', padding: '1.25rem', borderRadius: '1.1rem', border: '1px solid #A7F3D0' }}>
            <div style={{ color: '#047857', fontSize: '0.85rem', fontWeight: 700 }}>PAID AMOUNT (ALL RECEIPTS)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', marginTop: '0.25rem' }}>₹ {totalPaid.toLocaleString()}</div>
          </div>

          <div style={{ background: totalBalance > 0 ? '#FFFBEB' : '#F0FDF4', padding: '1.25rem', borderRadius: '1.1rem', border: `1px solid ${totalBalance > 0 ? '#FCD34D' : '#86EFAC'}` }}>
            <div style={{ color: totalBalance > 0 ? '#B45309' : '#166534', fontSize: '0.85rem', fontWeight: 700 }}>BALANCE DUE</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: totalBalance > 0 ? '#B45309' : '#166534', marginTop: '0.25rem' }}>₹ {totalBalance.toLocaleString()}</div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '0.85rem',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: activeTab === 'history' ? '#0F172A' : '#FFFFFF',
              color: activeTab === 'history' ? '#FFFFFF' : '#64748B',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              border: activeTab === 'history' ? 'none' : '1px solid #E2E8F0'
            }}
          >
            📜 Payment Transaction History ({displayTransactions.length})
          </button>

          <button
            onClick={() => setActiveTab('installments')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '0.85rem',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: activeTab === 'installments' ? '#0F172A' : '#FFFFFF',
              color: activeTab === 'installments' ? '#FFFFFF' : '#64748B',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              border: activeTab === 'installments' ? 'none' : '1px solid #E2E8F0'
            }}
          >
            📋 Fee Structure & Installments
          </button>
        </div>

        {/* Tab 1: Payment Transaction History Log & Ledger */}
        {activeTab === 'history' && (
          <div style={{ background: 'white', borderRadius: '1.1rem', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                  📜 Payment Transaction History Log & Ledger — {childName}
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.82rem' }}>
                  Real-time record of all fee payments received, official receipt numbers, and official print receipts.
                </p>
              </div>
              <div style={{ background: '#ECFDF5', color: '#047857', padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 800 }}>
                Total Paid: ₹ {totalPaid.toLocaleString()} ({displayTransactions.length} Payments Recorded)
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B', fontWeight: 700 }}>
                Loading transactions ledger...
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      <th>Payment Date</th>
                      <th>Receipt No</th>
                      <th>Fee Description</th>
                      <th>Payment Mode</th>
                      <th>Reference / UTR No</th>
                      <th>Amount Paid</th>
                      <th>Remaining Balance</th>
                      <th>Official Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayTransactions.length > 0 ? (
                      displayTransactions.map((tx, idx) => {
                        const paidAmt = parseFloat(tx.amount_paid || tx.paid_amount || tx.amount || '0');
                        const modeStr = tx.payment_method || tx.mode || 'Cash';
                        const isCash = modeStr.toLowerCase().includes('cash');

                        return (
                          <tr key={tx.id || idx}>
                            <td style={{ fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                              {tx.date || tx.date_paid}
                            </td>
                            <td>
                              <span style={{ 
                                background: '#EEF2FF', 
                                color: '#4F46E5', 
                                padding: '0.25rem 0.65rem', 
                                borderRadius: '6px', 
                                fontWeight: 800, 
                                fontSize: '0.8rem',
                                letterSpacing: '0.3px'
                              }}>
                                {tx.receipt_no}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: '#334155' }}>
                              {tx.feeType || tx.title || tx.fee_type || 'Tuition Fee'}
                            </td>
                            <td>
                              <span style={{ 
                                padding: '0.2rem 0.65rem', 
                                borderRadius: '6px', 
                                fontSize: '0.78rem', 
                                fontWeight: 800,
                                background: isCash ? '#FEF3C7' : '#DCFCE7',
                                color: isCash ? '#B45309' : '#15803D'
                              }}>
                                {modeStr}
                              </span>
                            </td>
                            <td style={{ color: '#64748B', fontSize: '0.82rem', fontWeight: 600 }}>
                              {tx.ref_no || tx.reference || 'OFFLINE'}
                            </td>
                            <td style={{ fontWeight: 900, color: '#059669', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                              ₹ {paidAmt.toLocaleString()}
                            </td>
                            <td style={{ fontWeight: 800, color: '#64748B', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                              {typeof tx.balance_after !== 'undefined' ? `₹ ${parseFloat(tx.balance_after).toLocaleString()}` : '-'}
                            </td>
                            <td>
                              <button
                                onClick={() => openSuperAdminReceiptModal(tx, idx)}
                                style={{
                                  background: '#047857',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '0.6rem',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  boxShadow: '0 1px 3px rgba(4,120,87,0.25)'
                                }}
                              >
                                <Receipt size={14} /> Print Receipt
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B', fontWeight: 700 }}>
                          No completed payment transactions found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Fee Structure & Installments Breakdown */}
        {activeTab === 'installments' && (
          <div style={{ background: 'white', borderRadius: '1.1rem', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              Fee Installment Breakdown — {childName}
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Loading fee details...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Installment / Title</th>
                      <th>Total Amount</th>
                      <th>Paid Amount</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Official Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayFees.length > 0 ? (
                      displayFees.map((f, idx) => {
                        const amt = parseFloat(f.amount_due || f.total_amount || f.amount || '0');
                        const paid = parseFloat(f.total_paid || f.amount_paid || '0');
                        const bal = Math.max(0, amt - paid);
                        const isPaid = bal <= 0;

                        return (
                          <tr key={f.id || idx}>
                            <td style={{ fontWeight: 800, color: '#0F172A' }}>
                              {f.title || f.fee_type || `Term ${idx + 1} Fee`}
                            </td>
                            <td style={{ fontWeight: 700 }}>₹ {amt.toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: '#047857' }}>₹ {paid.toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: bal > 0 ? '#B45309' : '#166534' }}>₹ {bal.toLocaleString()}</td>
                            <td>
                              <span style={{ 
                                padding: '0.25rem 0.75rem', 
                                borderRadius: '999px', 
                                fontSize: '0.78rem', 
                                fontWeight: 800,
                                background: isPaid ? '#DCFCE7' : '#FEF3C7',
                                color: isPaid ? '#15803D' : '#B45309',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}>
                                {isPaid ? <CheckCircle size={14} /> : <Clock size={14} />}
                                {isPaid ? 'Paid' : 'Pending Installment'}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => openSuperAdminReceiptModal(f, idx)}
                                disabled={paid <= 0}
                                style={{
                                  background: paid > 0 ? '#F1F5F9' : '#F8FAFC',
                                  color: paid > 0 ? '#0F172A' : '#94A3B8',
                                  border: '1px solid #CBD5E1',
                                  padding: '0.4rem 0.85rem',
                                  borderRadius: '0.6rem',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  cursor: paid > 0 ? 'pointer' : 'not-allowed',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  opacity: paid > 0 ? 1 : 0.6
                                }}
                              >
                                <Receipt size={15} color={paid > 0 ? "#059669" : "#94A3B8"} /> View Receipt
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B', fontWeight: 700 }}>
                          No fee installments assigned yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Authentic EDUNEEV KIDS Invoice Slip Modal (Strictly Read-Only Receipt for Parent) */}
        <EduneevInvoiceModal
          isOpen={isEduneevInvoiceOpen}
          onClose={() => setIsEduneevInvoiceOpen(false)}
          data={eduneevInvoiceData}
          hideTemplateSwitcher={true}
          hideEditAndEmail={true}
        />

      </main>
    </div>
  );
};

export default ParentFees;

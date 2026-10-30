import React, { useState, useEffect } from 'react';
import { Printer, X, Mail, Edit3, Check, Plus, Trash2 } from 'lucide-react';
import { numberToWordsIndian } from '../utils/numberToWords';

export interface InstallmentRow {
  no: number;
  amount: string | number;
  date: string;
}

export interface InvoiceCumReceiptData {
  receiptNo: string;
  date: string;
  customerName: string; // Mr./Ms.
  amountPaid: number;
  amountInWords?: string;
  paymentMode?: string; // Cash / Cheque / Online
  bankName?: string;
  bankBranch?: string;
  address?: string;
  idCardNo?: string;
  grade?: string;
  academicYear?: string;
  installments?: InstallmentRow[];
  authorizedRole?: string;
  addedBy?: string;

  // Franchisee branding parameters
  franchiseeName?: string;
  franchiseeAddress?: string;
  franchiseePhone?: string;
  brandName?: string;
  centreName?: string;
  centreAddress?: string;
  signatureForText?: string;
}

interface InvoiceCumReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceCumReceiptData;
  hideEditAndEmail?: boolean;
}

import { formatDateToDDMMYYYY } from '../utils/dateUtils';

export const InvoiceCumReceiptModal: React.FC<InvoiceCumReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
  hideEditAndEmail = false,
}) => {
  const isParentUser = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.role === 'parent' || u.role === 'student';
    } catch {
      return false;
    }
  })();

  const canEdit = !hideEditAndEmail && !isParentUser;

  const getLoggedInUserAttribution = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const name = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || '');
      if (name) return `${name} (Franchise Admin & Finance Admin)`;
      return 'Franchise Admin & Finance Admin';
    } catch {
      return 'Franchise Admin & Finance Admin';
    }
  };

  const [receiptNo, setReceiptNo] = useState(data.receiptNo || '986');
  const [date, setDate] = useState(formatDateToDDMMYYYY(data.date));
  const [customerName, setCustomerName] = useState(data.customerName || '');
  const [idCardNo, setIdCardNo] = useState(data.idCardNo || 'ADM-986');
  const [grade, setGrade] = useState(data.grade || 'Nursery');
  const [paymentMode, setPaymentMode] = useState(data.paymentMode || 'Cash');
  const [bankName, setBankName] = useState(data.bankName || 'UPI / Bank Transfer');
  const [address, setAddress] = useState(data.address || 'Sambhajinagar, Chinchwad, Pune');
  const [academicYear, setAcademicYear] = useState(data.academicYear || '2026 - 2027');
  const [amountPaid, setAmountPaid] = useState<number>(data.amountPaid || 5000);
  const [addedBy, setAddedBy] = useState(data.addedBy || getLoggedInUserAttribution());

  const resolveBranch = (bName?: string) => {
    let branch = (bName || '').toLowerCase();
    if (!branch) {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        branch = (u.branchName || u.school_name || u.schoolName || u.branch || '').toLowerCase();
      } catch (e) {
        branch = '';
      }
    }

    if (branch.includes('chikhali')) {
      return {
        centreName: 'CHIKHALI CENTRE',
        centreAddress: 'Spine Road, Chikhali, Pimpri-Chinchwad, Pune - 411062.',
        franchiseeName: 'EduNeev Kids Preschool (Chikhali Branch)',
        franchiseeAddress: 'Spine Road, Chikhali, Pune - 411062',
        franchiseePhone: '9881002030',
        signatureForText: 'For EduNeev Kids Preschool (Chikhali Branch)'
      };
    } else if (branch.includes('dudulgaon')) {
      return {
        centreName: 'DUDULGAON CENTRE',
        centreAddress: 'Survey No 64, Near Manthan Building, S.P. College Road, Dudulgaon-412105.',
        franchiseeName: 'Smart Kids Preschool (Dudulgaon Branch)',
        franchiseeAddress: 'Survey No 64, Near Manthan Building, S.P. College Road, Dudulgaon-412105',
        franchiseePhone: '9960893010',
        signatureForText: 'For Smart Kids Preschool (Dudulgaon Branch)'
      };
    } else {
      return {
        centreName: 'CHINCHWAD CENTRE',
        centreAddress: 'RL-32, G Block, Sambhajinagar, Chinchwad - 411019.',
        franchiseeName: 'EduNeev Kids Preschool (Chinchwad Branch)',
        franchiseeAddress: 'RL-32, G Block, Sambhajinagar, Chinchwad - 411019.',
        franchiseePhone: '9860123456',
        signatureForText: 'For EduNeev Kids Preschool (Chinchwad Branch)'
      };
    }
  };

  const initialBranchInfo = resolveBranch(data.centreName || (data as any).branchName || (data as any).school_name);

  // Franchisee branding states
  const [franchiseeName, setFranchiseeName] = useState(data.franchiseeName || initialBranchInfo.franchiseeName);
  const [franchiseeAddress, setFranchiseeAddress] = useState(data.franchiseeAddress || initialBranchInfo.franchiseeAddress);
  const [franchiseePhone, setFranchiseePhone] = useState(data.franchiseePhone || initialBranchInfo.franchiseePhone);
  const [brandName, setBrandName] = useState(data.brandName || 'EDUNEEV KIDS PRESCHOOL');
  const [centreName, setCentreName] = useState(data.centreName || initialBranchInfo.centreName);
  const [centreAddress, setCentreAddress] = useState(data.centreAddress || initialBranchInfo.centreAddress);
  const [signatureForText, setSignatureForText] = useState(data.signatureForText || initialBranchInfo.signatureForText);

  const [installments, setInstallments] = useState<InstallmentRow[]>(() => {
    if (data.installments && data.installments.length > 0) {
      const valid = data.installments
        .filter(inst => Number(inst.amount) > 0)
        .map((inst, i) => ({
          ...inst,
          no: i + 1,
          date: formatDateToDDMMYYYY(inst.date)
        }));
      if (valid.length > 0) return valid;
    }
    const initialDate = formatDateToDDMMYYYY(data.date);
    return [
      { no: 1, amount: data.amountPaid || 5000, date: initialDate }
    ];
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && data) {
      const bInfo = resolveBranch(data.centreName || (data as any).branchName || (data as any).school_name);
      setReceiptNo(data.receiptNo || '986');
      setDate(formatDateToDDMMYYYY(data.date));
      setCustomerName(data.customerName || '');
      setIdCardNo(data.idCardNo || 'ADM-986');
      setGrade(data.grade || 'Nursery');
      setPaymentMode(data.paymentMode || 'Cash');
      setBankName(data.bankName || 'UPI / Bank Transfer');
      setAddress(data.address || 'Sambhajinagar, Chinchwad, Pune');
      setAcademicYear(data.academicYear || '2026 - 2027');
      setAmountPaid(data.amountPaid || 5000);
      setAddedBy(data.addedBy || getLoggedInUserAttribution());

      setFranchiseeName(data.franchiseeName || bInfo.franchiseeName);
      setFranchiseeAddress(data.franchiseeAddress || bInfo.franchiseeAddress);
      setFranchiseePhone(data.franchiseePhone || bInfo.franchiseePhone);
      setBrandName(data.brandName || 'EDUNEEV KIDS PRESCHOOL');
      setCentreName(data.centreName || bInfo.centreName);
      setCentreAddress(data.centreAddress || bInfo.centreAddress);
      setSignatureForText(data.signatureForText || bInfo.signatureForText);

      if (data.installments && data.installments.length > 0) {
        const valid = data.installments
          .filter(inst => Number(inst.amount) > 0)
          .map((inst, i) => ({
            ...inst,
            no: i + 1,
            date: formatDateToDDMMYYYY(inst.date)
          }));
        setInstallments(valid.length > 0 ? valid : [
          { no: 1, amount: data.amountPaid || 5000, date: formatDateToDDMMYYYY(data.date) }
        ]);
      } else {
        const formattedDate = formatDateToDDMMYYYY(data.date);
        setInstallments([
          { no: 1, amount: data.amountPaid || 5000, date: formattedDate }
        ]);
      }
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const amountWords = data.amountInWords || numberToWordsIndian(amountPaid);

  const handleInstallmentChange = (index: number, field: keyof InstallmentRow, val: any) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: val };
    setInstallments(updated);
  };

  const handleAddInstallment = () => {
    const nextNo = installments.length + 1;
    const lastDate = installments[installments.length - 1]?.date || '10/01/2027';
    setInstallments([
      ...installments,
      { no: nextNo, amount: 0, date: lastDate }
    ]);
  };

  const handleRemoveInstallment = (index: number) => {
    const updated = installments.filter((_, i) => i !== index).map((inst, i) => ({
      ...inst,
      no: i + 1
    }));
    setInstallments(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999 }}>
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
          .sidebar, .parent-sidebar, aside, nav, header, .header, .parent-hero-card, .parent-kpi-grid, .parent-hub-grid, .parent-timeline-card, .glass-card, .no-print, .modal-header, .modal-actions, .bg-decorations-container, .decor {
            display: none !important;
          }
          .dashboard-layout, .parent-layout, .main-content, .parent-main-content {
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
          #receipt-printable-slip {
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

      <div
        className="modal-content"
        style={{
          maxWidth: '860px',
          width: '95%',
          maxHeight: '94vh',
          overflowY: 'auto',
          background: '#F8FAFC',
          borderRadius: '16px',
          padding: 0,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Top Control Bar */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.2rem 1.5rem',
            background: '#1E293B',
            color: 'white',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC' }}>
              🧾 EDUNEEV KIDS Invoice Cum Receipt Slip
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              Official Fee Receipt Slip with Installments Schedule & Refund Policy
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1.1rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)',
              }}
            >
              <Printer size={16} /> Print Receipt
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Paper Invoice Content Wrapper */}
        <div style={{ padding: '1.5rem' }}>
          <div
            id="receipt-printable-slip"
            style={{
              background: 'white',
              border: '2px solid #000',
              borderRadius: '6px',
              padding: '1.75rem',
              color: '#000',
              fontFamily: `'Calibri', 'Segoe UI', Arial, sans-serif`,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr 260px',
                gap: '1rem',
                borderBottom: '2px solid #000',
                paddingBottom: '1rem',
                marginBottom: '1.25rem',
                alignItems: 'center',
              }}
            >
              {/* Left Franchisee Info & Logo */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <img
                    src="/logopre.png"
                    alt="EDUNEEV KIDS PRESCHOOL"
                    style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
                  />
                  <div style={{ flex: 1 }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={franchiseeName}
                        onChange={(e) => setFranchiseeName(e.target.value)}
                        style={{ width: '100%', fontWeight: 900, fontSize: '0.95rem', borderBottom: '1px dashed #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
                      />
                    ) : (
                      <div style={{ fontWeight: 900, fontSize: '1rem', lineHeight: '1.1', color: '#000' }}>
                        {franchiseeName}
                      </div>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={franchiseeAddress}
                      onChange={(e) => setFranchiseeAddress(e.target.value)}
                      placeholder="Franchisee Address"
                      style={{ width: '100%', fontSize: '0.65rem', fontWeight: 700, borderBottom: '1px dashed #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', marginBottom: '2px' }}
                    />
                    <input
                      type="text"
                      value={franchiseePhone}
                      onChange={(e) => setFranchiseePhone(e.target.value)}
                      placeholder="Phone"
                      style={{ width: '100%', fontSize: '0.65rem', fontWeight: 700, borderBottom: '1px dashed #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
                    />
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#333', lineHeight: '1.2' }}>
                      {franchiseeAddress}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#000', marginTop: '2px' }}>
                      📞 {franchiseePhone}
                    </div>
                  </>
                )}
              </div>

              {/* Center Title */}
              <div style={{ textAlign: 'center' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: '#000',
                    borderBottom: '2px solid #000',
                    display: 'inline-block',
                    paddingBottom: '2px',
                  }}
                >
                  INVOICE CUM RECEIPT
                </h2>
              </div>

              {/* Right Centre Info, Receipt No, Date, ID Card No */}
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#444' }}>
                  Franchisee of <span style={{ fontWeight: 900, color: '#000' }}>{brandName}</span>
                </div>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={centreName}
                      onChange={(e) => setCentreName(e.target.value)}
                      style={{ width: '100%', textAlign: 'right', fontWeight: 900, fontSize: '0.85rem', borderBottom: '1px dashed #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
                    />
                    <input
                      type="text"
                      value={centreAddress}
                      onChange={(e) => setCentreAddress(e.target.value)}
                      style={{ width: '100%', textAlign: 'right', fontSize: '0.68rem', borderBottom: '1px dashed #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
                    />
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: '#000' }}>{centreName}</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#333' }}>{centreAddress}</div>
                  </>
                )}
                <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800 }}>Receipt No.</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={receiptNo}
                        onChange={(e) => setReceiptNo(e.target.value)}
                        style={{ width: '90px', borderBottom: '1px solid #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontWeight: 800, textAlign: 'center' }}
                      />
                    ) : (
                      <span style={{ borderBottom: '1px solid #000', minWidth: '90px', display: 'inline-block', textAlign: 'center', fontWeight: 800 }}>{receiptNo}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800 }}>Date</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{ width: '90px', borderBottom: '1px solid #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontWeight: 800, textAlign: 'center' }}
                      />
                    ) : (
                      <span style={{ borderBottom: '1px solid #000', minWidth: '90px', display: 'inline-block', textAlign: 'center', fontWeight: 800 }}>{date}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800 }}>ID Card No.</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={idCardNo}
                        onChange={(e) => setIdCardNo(e.target.value)}
                        style={{ width: '90px', borderBottom: '1px solid #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontWeight: 800, textAlign: 'center' }}
                      />
                    ) : (
                      <span style={{ borderBottom: '1px solid #000', minWidth: '90px', display: 'inline-block', textAlign: 'center', fontWeight: 800 }}>{idCardNo}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Details Block */}
            <div style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: '2.4', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ whiteSpace: 'nowrap', marginRight: '0.5rem' }}>Received with thanks from Mr./Ms.</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ flex: 1, borderBottom: '1.5px dashed #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontWeight: 900, fontSize: '1.05rem' }}
                  />
                ) : (
                  <span style={{ flex: 1, borderBottom: '1.5px solid #000', paddingLeft: '0.5rem', fontWeight: 900, color: '#000' }}>
                    {customerName || '____________________________________________________________________'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ whiteSpace: 'nowrap', marginRight: '0.5rem' }}>an amount of Rupees</span>
                <span style={{ flex: 1, borderBottom: '1.5px solid #000', paddingLeft: '0.5rem', fontWeight: 800, fontStyle: 'italic' }}>
                  {amountWords}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span>by Cash / Cheque / Online. Date </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      style={{ width: '100px', borderBottom: '1px solid #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontWeight: 800, marginLeft: '0.5rem' }}
                    />
                  ) : (
                    <span style={{ borderBottom: '1px solid #000', padding: '0 8px', fontWeight: 900, marginLeft: '0.5rem', minWidth: '80px', display: 'inline-block' }}>{paymentMode}</span>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>Bank </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      style={{ flex: 1, borderBottom: '1px dashed #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontWeight: 800 }}
                    />
                  ) : (
                    <span style={{ flex: 1, borderBottom: '1px solid #000', paddingLeft: '0.4rem', fontWeight: 800, minWidth: '150px', display: 'inline-block' }}>
                      {bankName}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ whiteSpace: 'nowrap', marginRight: '0.5rem' }}>Address :</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ flex: 1, borderBottom: '1px dashed #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontWeight: 800 }}
                  />
                ) : (
                  <span style={{ flex: 1, borderBottom: '1px solid #000', paddingLeft: '0.5rem', fontWeight: 700 }}>
                    {address}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Two Section Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'flex-start', marginTop: '1.5rem' }}>
              
              {/* Left Column: Note & Due Installments Table */}
              <div>
                {/* Note */}
                <div style={{ fontSize: '0.78rem', fontWeight: 800, marginBottom: '1rem', color: '#000', lineHeight: '1.4' }}>
                  as part/full payment as per the details provided alongside.<br />
                  <strong>Note :</strong> Fees once paid will not be refunded under any circumstances.<br />
                  Cheques are subject to realisation.
                </div>

                {/* Due Installments Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                      Due Installments
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleAddInstallment}
                        className="no-print"
                        style={{
                          background: '#4F46E5', color: 'white', border: 'none',
                          padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem',
                          fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
                        }}
                      >
                        <Plus size={12} /> Add Installment
                      </button>
                    )}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '1.5px solid #000' }}>
                        <th style={{ width: '15%', padding: '0.4rem', borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 900 }}>No</th>
                        <th style={{ padding: '0.4rem', borderRight: '1.5px solid #000', textAlign: 'right', fontWeight: 900 }}>Amount</th>
                        <th style={{ padding: '0.4rem', borderRight: isEditing ? '1.5px solid #000' : 'none', textAlign: 'center', fontWeight: 900 }}>Due Date</th>
                        {isEditing && <th style={{ width: '12%', padding: '0.4rem', textAlign: 'center', fontWeight: 900 }}>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {installments.map((inst, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #000' }}>
                          <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 800, padding: '0.35rem' }}>{inst.no}</td>
                          <td style={{ borderRight: '1.5px solid #000', textAlign: 'right', fontWeight: 800, padding: '0.35rem 0.6rem' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={inst.amount}
                                onChange={(e) => handleInstallmentChange(idx, 'amount', e.target.value)}
                                style={{ width: '70px', textAlign: 'right', border: '1px solid #94A3B8', padding: '1px 3px' }}
                              />
                            ) : (
                              `₹ ${Number(inst.amount).toLocaleString()}`
                            )}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, padding: '0.35rem', borderRight: isEditing ? '1.5px solid #000' : 'none' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={inst.date}
                                onChange={(e) => handleInstallmentChange(idx, 'date', e.target.value)}
                                placeholder="DD/MM/YYYY"
                                style={{ width: '95px', textAlign: 'center', border: '1px solid #94A3B8', padding: '1px 3px' }}
                              />
                            ) : (
                              formatDateToDDMMYYYY(inst.date)
                            )}
                          </td>
                          {isEditing && (
                            <td style={{ textAlign: 'center', padding: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveInstallment(idx)}
                                style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Added By Attribution Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                    Added By:
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={addedBy}
                      onChange={(e) => setAddedBy(e.target.value)}
                      style={{ borderBottom: '1.5px dashed #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '1px 6px', fontSize: '0.82rem', fontWeight: 800, minWidth: '220px', outline: 'none' }}
                    />
                  ) : (
                    <span style={{ fontWeight: 800, color: '#0F172A', background: '#F8FAFC', padding: '2px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                      {addedBy || 'Franchise Admin & Finance Admin'}
                    </span>
                  )}
                </div>

                {/* Left Signature - Added & Prepared By */}
                <div style={{ textAlign: 'center', marginTop: '2.5rem', width: '230px' }}>
                  <div style={{ height: '35px', borderBottom: '1.5px solid #000', marginBottom: '0.4rem' }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Added & Prepared By
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                    {addedBy || 'Franchise Admin & Finance Admin'}
                  </div>
                </div>
              </div>

              {/* Right Column: Summary Table & Signature */}
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1.5px solid #000' }}>
                      <td style={{ padding: '0.5rem', borderRight: '1.5px solid #000', fontWeight: 900, background: '#F8FAFC', width: '45%' }}>Class</td>
                      <td style={{ padding: '0.5rem', fontWeight: 900, textAlign: 'right' }}>
                        {isEditing ? (
                          <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} style={{ width: '90px', fontWeight: 900 }} />
                        ) : (
                          grade
                        )}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1.5px solid #000' }}>
                      <td style={{ padding: '0.5rem', borderRight: '1.5px solid #000', fontWeight: 900, background: '#F8FAFC' }}>Academic Year</td>
                      <td style={{ padding: '0.5rem', fontWeight: 900, textAlign: 'right' }}>
                        {isEditing ? (
                          <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} style={{ width: '100px', fontWeight: 800 }} />
                        ) : (
                          academicYear
                        )}
                      </td>
                    </tr>
                    <tr style={{ background: '#F1F5F9' }}>
                      <td style={{ padding: '0.6rem 0.5rem', borderRight: '1.5px solid #000', fontWeight: 900, fontSize: '1rem' }}>Total :</td>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 900, fontSize: '1.15rem', textAlign: 'right' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                            style={{ width: '100px', textAlign: 'right', fontWeight: 900 }}
                          />
                        ) : (
                          `₹ ${amountPaid.toLocaleString()}`
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Right Signature - Authorized Signatory */}
                <div style={{ textAlign: 'center', marginTop: '1.75rem', width: '260px', marginLeft: 'auto' }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={signatureForText}
                      onChange={(e) => setSignatureForText(e.target.value)}
                      style={{ width: '100%', fontSize: '0.85rem', fontWeight: 900, marginBottom: '2.5rem', textAlign: 'center', borderBottom: '1px dashed #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
                    />
                  ) : (
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '2.5rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      {signatureForText.toUpperCase().startsWith('FOR ') ? signatureForText.toUpperCase() : `FOR ${signatureForText.toUpperCase()}`}
                    </div>
                  )}
                  <div style={{ height: '1.5px', background: '#000', marginBottom: '0.4rem' }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Authorised Signatory
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                    (Franchise Admin / Finance & Admin)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCumReceiptModal;

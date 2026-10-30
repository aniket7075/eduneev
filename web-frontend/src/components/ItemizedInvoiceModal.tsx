import React, { useState, useEffect } from 'react';
import { Printer, X, Mail, Plus, Trash2, Edit3, Check } from 'lucide-react';
import { numberToWordsIndian } from '../utils/numberToWords';

export interface InvoiceItem {
  srNo: number;
  description: string;
  qty: number | string;
  rate: number | string;
  amount: number;
}

export interface ItemizedInvoiceData {
  invoiceNo: string;
  date: string;
  customerName: string; // M/S
  items: InvoiceItem[];
  amountInWords?: string;
  admissionNo?: string;
  grade?: string;
}

interface ItemizedInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ItemizedInvoiceData;
}

export const ItemizedInvoiceModal: React.FC<ItemizedInvoiceModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [invoiceNo, setInvoiceNo] = useState(data.invoiceNo || '064');
  const [date, setDate] = useState(data.date || new Date().toLocaleDateString('en-IN'));
  const [customerName, setCustomerName] = useState(data.customerName || '');
  const [items, setItems] = useState<InvoiceItem[]>(
    data.items && data.items.length > 0
      ? data.items
      : [{ srNo: 1, description: 'School Tuition Fee', qty: 1, rate: 5000, amount: 5000 }]
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && data) {
      setInvoiceNo(data.invoiceNo || '064');
      setDate(data.date || new Date().toLocaleDateString('en-IN'));
      setCustomerName(data.customerName || '');
      setItems(
        data.items && data.items.length > 0
          ? data.items
          : [{ srNo: 1, description: 'School Tuition Fee', qty: 1, rate: 5000, amount: 5000 }]
      );
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const totalAmount = calculateTotal();
  const amountWords = data.amountInWords || numberToWordsIndian(totalAmount);

  const handleAddItem = () => {
    const nextSr = items.length + 1;
    setItems([...items, { srNo: nextSr, description: '', qty: 1, rate: 0, amount: 0 }]);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === 'qty' || field === 'rate') {
      const q = parseFloat(String(item.qty)) || 0;
      const r = parseFloat(String(item.rate)) || 0;
      item.amount = q * r;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      srNo: i + 1,
    }));
    setItems(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  // Build grid of 15 rows minimum for Itemized Invoice Slip
  const MIN_ROWS = 15;
  const displayRows = [...items];
  while (displayRows.length < MIN_ROWS) {
    displayRows.push({
      srNo: displayRows.length + 1,
      description: '',
      qty: '',
      rate: '',
      amount: 0,
    });
  }

  const handleAddItemAt = (idx: number) => {
    // Fill all gap rows between current items and this index with empty items
    const needed = idx + 1 - items.length;
    const newItems = [...items];
    for (let i = 0; i < needed; i++) {
      newItems.push({ srNo: newItems.length + 1, description: '', qty: 1, rate: 0, amount: 0 });
    }
    setItems(newItems);
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
          #itemized-printable-slip {
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
          maxWidth: '820px',
          width: '95%',
          maxHeight: '92vh',
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
              📄 EDUNEEV KIDS Itemized Invoice Slip
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              Standard Itemized Invoice Book Slip Format
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                background: isEditing ? '#10B981' : '#334155',
                color: 'white',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {isEditing ? <Check size={16} /> : <Edit3 size={16} />}
              {isEditing ? 'Done Editing' : 'Edit Items'}
            </button>
            <button
              onClick={() => alert(`📧 Invoice ${invoiceNo} emailed to parent!`)}
              style={{
                background: '#4338CA',
                color: 'white',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Mail size={16} /> Email Slip
            </button>
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
              <Printer size={16} /> Print Invoice
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
            id="itemized-printable-slip"
            style={{
              background: 'white',
              border: '2px solid #000',
              borderRadius: '6px',
              padding: '1.5rem',
              color: '#000',
              fontFamily: `'Calibri', 'Segoe UI', Arial, sans-serif`,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Header section matching exact paper invoice format */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                borderBottom: '2px solid #000',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              {/* Top Pill Badge "INVOICE" */}
              <div
                style={{
                  background: '#000',
                  color: '#FFF',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  letterSpacing: '3px',
                  padding: '2px 24px',
                  borderRadius: '14px',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                }}
              >
                INVOICE
              </div>

              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Logo Graphic */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '20%' }}>
                  <img
                    src="/logopre.png"
                    alt="EDUNEEV KIDS PRESCHOOL"
                    style={{ height: '58px', width: 'auto', objectFit: 'contain' }}
                  />
                </div>

                {/* Main Title & Address */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: '2.1rem',
                      fontWeight: 900,
                      letterSpacing: '1px',
                      color: '#000',
                      fontFamily: `'Arial Black', Impact, sans-serif`,
                    }}
                  >
                    EDUNEEV KIDS
                  </h1>
                  <p
                    style={{
                      margin: '0.2rem 0',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#222',
                    }}
                  >
                    📍 RL-32, G Block, Near Sant Bahinabai Chaudhary, Zoo Sambhajinagar, Chinchwad
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.8rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      marginTop: '0.15rem',
                    }}
                  >
                    <span>✉️ eduneevkidspreschool@gmail.com</span>
                    <span>💬 988 988 3033</span>
                    <span>🌐 eduneevkids.com</span>
                  </div>
                </div>

                <div style={{ width: '20%' }} />
              </div>
            </div>

            {/* M/S, Invoice No, Date Header Table */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 240px',
                gap: '1rem',
                marginBottom: '1rem',
                borderBottom: '1px solid #000',
                paddingBottom: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: 800,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ minWidth: '45px' }}>M/S :</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{
                      flex: 1,
                      borderBottom: '1.5px dashed #000',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      outline: 'none',
                      fontWeight: 800,
                      fontSize: '1rem',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      borderBottom: '1.5px solid #000',
                      paddingLeft: '0.5rem',
                      color: '#000',
                    }}
                  >
                    {customerName || '__________________________________________'}
                  </span>
                )}
              </div>

              <div style={{ borderLeft: '1px solid #000', paddingLeft: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span>Invoice No:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      style={{ width: '90px', fontWeight: 900, border: '1px solid #000', padding: '1px 4px' }}
                    />
                  ) : (
                    <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{invoiceNo}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Date:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      style={{ width: '100px', fontWeight: 800, border: '1px solid #000', padding: '1px 4px' }}
                    />
                  ) : (
                    <span style={{ fontWeight: 800 }}>{date}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Table Matching Physical Slip */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.5px solid #000',
                marginBottom: '1rem',
              }}
            >
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1.5px solid #000' }}>
                  <th
                    style={{
                      width: '7%',
                      padding: '0.5rem',
                      borderRight: '1.5px solid #000',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                    }}
                  >
                    SR. NO
                  </th>
                  <th
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRight: '1.5px solid #000',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      width: '10%',
                      padding: '0.5rem',
                      borderRight: '1.5px solid #000',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      width: '15%',
                      padding: '0.5rem',
                      borderRight: '1.5px solid #000',
                      textAlign: 'right',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                    }}
                  >
                    Rate
                  </th>
                  <th
                    style={{
                      width: '16%',
                      padding: '0.5rem',
                      textAlign: 'right',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, idx) => {
                  const isActualItem = idx < items.length;
                  return (
                    <tr key={idx} style={{ height: '32px', borderBottom: '1px solid #CBD5E1' }}>
                      <td
                        style={{
                          borderRight: '1.5px solid #000',
                          textAlign: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                        }}
                      >
                        {row.srNo}
                      </td>
                      <td style={{ borderRight: '1.5px solid #000', padding: '0.2rem 0.75rem' }}>
                        {isEditing ? (
                          isActualItem ? (
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              placeholder="Fee / Item description"
                              style={{ flex: 1, border: '1px solid #94A3B8', padding: '2px 4px', fontSize: '0.85rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          ) : (
                          <div
                            onClick={() => handleAddItemAt(idx)}
                            style={{ width: '100%', minHeight: '24px', cursor: 'text', color: '#94A3B8', fontSize: '0.8rem', fontStyle: 'italic', padding: '2px 4px' }}
                          >
                            Click to add item...
                          </div>
                          )
                        ) : (
                          <span style={{ fontSize: '0.9rem', fontWeight: isActualItem ? 700 : 400 }}>
                            {row.description}
                          </span>
                        )}
                      </td>
                      <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', padding: '0.2rem' }}>
                        {isEditing && isActualItem ? (
                          <input
                            type="number"
                            value={row.qty}
                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                            style={{ width: '50px', textAlign: 'center', border: '1px solid #94A3B8' }}
                          />
                        ) : (
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.qty || ''}</span>
                        )}
                      </td>
                      <td style={{ borderRight: '1.5px solid #000', textAlign: 'right', padding: '0.2rem 0.5rem' }}>
                        {isEditing && isActualItem ? (
                          <input
                            type="number"
                            value={row.rate}
                            onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                            style={{ width: '70px', textAlign: 'right', border: '1px solid #94A3B8' }}
                          />
                        ) : (
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {row.rate ? `₹ ${Number(row.rate).toLocaleString()}` : ''}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.2rem 0.5rem', fontWeight: isActualItem ? 800 : 400 }}>
                        {isActualItem && row.amount > 0 ? `₹ ${Number(row.amount).toLocaleString()}` : ''}
                      </td>
                    </tr>
                  );
                })}

                {/* Subtotal / Total Row */}
                <tr style={{ background: '#F8FAFC', borderTop: '2px solid #000' }}>
                  <td
                    colSpan={4}
                    style={{
                      borderRight: '1.5px solid #000',
                      textAlign: 'right',
                      padding: '0.5rem 1rem',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      letterSpacing: '1px',
                    }}
                  >
                    TOTAL AMOUNT
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '0.5rem',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      color: '#000',
                    }}
                  >
                    ₹ {totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Editing Controls - Add Row */}
            {isEditing && (
              <div className="no-print" style={{ marginBottom: '1rem', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{
                    background: '#6366F1',
                    color: 'white',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Plus size={14} /> Add Line Item
                </button>
              </div>
            )}

            {/* Footer Section */}
            <div style={{ marginTop: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  marginBottom: '2rem',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                }}
              >
                <span style={{ whiteSpace: 'nowrap', marginRight: '0.5rem' }}>Amount.In Words:</span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: '1.5px solid #000',
                    paddingLeft: '0.5rem',
                    fontSize: '0.95rem',
                    color: '#1E293B',
                    fontStyle: 'italic',
                  }}
                >
                  {amountWords}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2.5rem' }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ height: '40px', borderBottom: '1px solid #000', marginBottom: '0.4rem' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#000' }}>
                    Receiver's Signature
                  </span>
                </div>

                <div style={{ textAlign: 'center', width: '240px' }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      color: '#000',
                      letterSpacing: '1px',
                      marginBottom: '2.5rem',
                    }}
                  >
                    FOR, EDUNEEV KIDS
                  </div>
                  <div style={{ height: '1px', background: '#000', marginBottom: '0.4rem' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#000' }}>
                    Authorised Signature (Admin / Finance / Principal)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemizedInvoiceModal;

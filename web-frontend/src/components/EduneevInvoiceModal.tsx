import React from 'react';
import { ItemizedInvoiceModal, type ItemizedInvoiceData } from './ItemizedInvoiceModal';
import { InvoiceCumReceiptModal, type InvoiceCumReceiptData } from './InvoiceCumReceiptModal';

export { ItemizedInvoiceModal, type ItemizedInvoiceData };
export { InvoiceCumReceiptModal, type InvoiceCumReceiptData };

export interface EduneevInvoiceData {
  invoiceNo: string;
  date: string;
  customerName: string;
  items?: Array<{ srNo: number; description: string; qty: number | string; rate: number | string; amount: number }>;
  amountInWords?: string;
  admissionNo?: string;
  idCardNo?: string;
  grade?: string;
  phone?: string;
  paymentMode?: string;
  bankName?: string;
  bankBranch?: string;
  address?: string;
  academicYear?: string;
  totalAmountPaid?: number;
  installments?: Array<{ no: number; amount: string | number; date: string }>;
  franchiseeName?: string;
  franchiseeAddress?: string;
  franchiseePhone?: string;
  brandName?: string;
  centreName?: string;
  centreAddress?: string;
  signatureForText?: string;
  addedBy?: string;
}

interface EduneevInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: EduneevInvoiceData;
  defaultTemplate?: 'cum_receipt' | 'itemized';
  hideTemplateSwitcher?: boolean;
  hideEditAndEmail?: boolean;
}

export const EduneevInvoiceModal: React.FC<EduneevInvoiceModalProps> = ({
  isOpen,
  onClose,
  data,
  hideEditAndEmail,
}) => {
  if (!isOpen) return null;

  const totalPaid = data.totalAmountPaid || data.items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 5000;

  return (
    <InvoiceCumReceiptModal
      isOpen={isOpen}
      onClose={onClose}
      hideEditAndEmail={hideEditAndEmail}
      data={{
        receiptNo: data.invoiceNo || '986',
        date: data.date,
        customerName: data.customerName,
        amountPaid: totalPaid,
        amountInWords: data.amountInWords,
        paymentMode: data.paymentMode || 'Cash',
        bankName: data.bankName || 'UPI / Bank Transfer',
        bankBranch: data.bankBranch,
        address: data.address || 'Sambhajinagar, Chinchwad, Pune',
        idCardNo: data.idCardNo || data.admissionNo || 'ADM-986',
        grade: data.grade || 'Nursery',
        academicYear: data.academicYear || '2026 - 2027',
        installments: data.installments,
        franchiseeName: data.franchiseeName,
        franchiseeAddress: data.franchiseeAddress,
        franchiseePhone: data.franchiseePhone,
        brandName: data.brandName,
        centreName: data.centreName,
        centreAddress: data.centreAddress,
        signatureForText: data.signatureForText,
        addedBy: data.addedBy,
      }}
    />
  );
};

export default EduneevInvoiceModal;

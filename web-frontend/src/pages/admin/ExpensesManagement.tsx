import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/Sidebar";
import { Search, Plus, Filter, MoreVertical, TrendingDown, Calendar, ArrowLeft, X } from 'lucide-react';
import './Directory.css';

// Replaced mock data with live API state

const ExpensesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ date: '', category: 'Utilities', description: '', amount: '', approvedBy: '' });

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      const { default: apiClient } = await import('../../api/client');
      const response = await apiClient.get('/expenses');
      setExpenses(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch expenses', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      const { default: apiClient } = await import('../../api/client');
      await apiClient.delete(`/expenses/${id}`);
      alert('Expense entry deleted successfully');
      setActiveMenuId(null);
      fetchExpenses();
    } catch (error) {
      console.error('Failed to delete expense', error);
      alert('Could not delete expense');
    }
  };

  const handleEditExpense = (exp: any) => {
    setEditingExpense(exp);
    setFormData({
      date: exp.expense_date || exp.date || '',
      category: exp.category || exp.category_name || 'Utilities',
      description: exp.description || exp.title || '',
      amount: String(exp.amount || ''),
      approvedBy: exp.recorded_by_name || exp.notes || ''
    });
    setActiveMenuId(null);
    setIsAddModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setFormData({ date: '', category: 'Utilities', description: '', amount: '', approvedBy: '' });
    setIsAddModalOpen(true);
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || exp.category_name === categoryFilter || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) {
      alert('Please enter expense amount');
      return;
    }
    try {
      const { default: apiClient } = await import('../../api/client');
      const payload = {
        title: formData.description || `${formData.category} Expense`,
        category: formData.category,
        description: formData.description,
        date: formData.date || new Date().toISOString().split('T')[0],
        expense_date: formData.date || new Date().toISOString().split('T')[0],
        amount: Number(formData.amount),
        payment_method: 'Cash',
        approvedBy: formData.approvedBy,
        notes: formData.approvedBy ? `Approved by ${formData.approvedBy}` : null,
        status: 'approved'
      };

      if (editingExpense) {
        await apiClient.put(`/expenses/${editingExpense.id}`, payload);
        alert('Expense entry updated successfully');
      } else {
        await apiClient.post('/expenses', payload);
        alert('Expense added successfully');
      }

      setIsAddModalOpen(false);
      setEditingExpense(null);
      setFormData({ date: '', category: 'Utilities', description: '', amount: '', approvedBy: '' });
      fetchExpenses();
    } catch (error) {
      console.error('Failed to save expense', error);
      alert('Could not save expense');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">Expenses</h1>
          <p className="date-text">Track and manage school expenditures</p>
        </div>
          </div>
          <button className="btn-primary" onClick={handleOpenAddModal}>
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Summary Card */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '15px', width: 'fit-content', marginBottom: '24px' }}>
        <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '10px' }}>
          <TrendingDown size={24} />
        </div>
        <div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Total Expenses (Filtered)</p>
          <h3 style={{ margin: '5px 0 0 0', color: '#111827', fontSize: '24px' }}>₹ {totalExpenses.toLocaleString()}</h3>
        </div>
      </div>

      <div className="glass-card table-container">
        <div className="table-header flex-between">
          <div className="search-box">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search descriptions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--background)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            <Filter size={18} className="text-muted" />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem' }}>
              <option value="All">All Categories</option>
              <option value="Stationery">Stationery</option>
              <option value="Utilities">Utilities</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Supplies">Supplies</option>
              <option value="Events">Events</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="#6B7280" />
                      {new Date(exp.expense_date || exp.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                      {exp.category_name || exp.category || 'General'}
                    </span>
                  </td>
                  <td className="font-medium">{exp.description}</td>
                  <td style={{ fontWeight: 600, color: '#ef4444' }}>₹ {Number(exp.amount || 0).toLocaleString()}</td>
                  <td>{exp.recorded_by_name || exp.approvedBy || 'Admin'}</td>
                  <td style={{ position: 'relative' }}>
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === exp.id ? null : exp.id);
                      }}
                      title="Manage Expense"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeMenuId === exp.id && (
                      <div 
                        style={{
                          position: 'absolute', right: '10px', top: '40px', background: 'white',
                          border: '1px solid #CBD5E1', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          zIndex: 50, minWidth: '130px', overflow: 'hidden'
                        }}
                      >
                        <button
                          onClick={() => handleEditExpense(exp)}
                          style={{ width: '100%', padding: '0.6rem 1rem', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          style={{ width: '100%', padding: '0.6rem 1rem', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid #F1F5F9' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    No expenses found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" className="input-field" value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" className="input-field" value={formData.category} onChange={handleInputChange}>
                  <option value="Stationery">Stationery</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Events">Events</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" name="description" className="input-field" placeholder="Brief description of expense" value={formData.description} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input type="number" name="amount" className="input-field" placeholder="0" min="0" value={formData.amount} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Approved By</label>
                <input type="text" name="approvedBy" className="input-field" placeholder="e.g. Principal" value={formData.approvedBy} onChange={handleInputChange} required />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
    </div>
  );
};

export default ExpensesManagement;

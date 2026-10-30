import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartSidebar from '../../components/SmartSidebar';
import apiClient from '../../api/client';
import { Search, Plus, ArrowLeft, BookOpen, BookText, Trash2, Library, X, Clock, AlertCircle } from 'lucide-react';
import './Directory.css';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  total_copies: number;
  available_copies: number;
}

interface IssuedBook {
  id: string;
  book_id: string;
  student_id: string;
  title: string;
  author: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: string;
  student_name?: string; // Derived or fetched
}

const LibraryManagement: React.FC = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'issued'>('catalog');
  const [books, setBooks] = useState<Book[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', author: '', isbn: '', copies: '1'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resBooks, resIssued] = await Promise.all([
        apiClient.get('/library/books').catch(() => ({ data: { data: [] } })),
        apiClient.get('/library/issued/all').catch(() => ({ data: { data: [] } }))
      ]);
      setBooks(resBooks.data?.data || []);
      setIssuedBooks(resIssued.data?.data || []);
    } catch (err) {
      console.error('Fetch library error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) { alert('Title and Author are required'); return; }
    setSaving(true);
    try {
      await apiClient.post('/library/books', {
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim() || undefined,
        total_copies: parseInt(form.copies, 10) || 1
      });
      setIsAddModalOpen(false);
      setForm({ title: '', author: '', isbn: '', copies: '1' });
      fetchData();
      alert('Book added to catalog successfully!');
    } catch (err: any) { 
      alert(err.response?.data?.error || 'Failed to add book'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if(!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await apiClient.delete(`/library/books/${id}`);
      fetchData();
    } catch { alert('Failed to delete book'); }
  };

  const filteredBooks = books.filter(b => 
    (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.author || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredIssued = issuedBooks.filter(i => 
    (i.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.student_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalBooksCount = books.length;
  const activeIssuesCount = issuedBooks.filter(i => i.status !== 'returned').length;
  const overdueCount = issuedBooks.filter(i => new Date(i.due_date) < new Date() && i.status !== 'returned').length;

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text">Library Management</h1>
              <p className="date-text">Digital catalog & issued books tracker</p>
            </div>
          </div>
          {activeTab === 'catalog' && (
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4F46E5', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}>
              <Plus size={20} /> Add Book
            </button>
          )}
        </header>

        {/* Dynamic Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #E0E7FF' }}>
            <div style={{ padding: '1rem', background: '#EEF2FF', color: '#6366F1', borderRadius: '1rem' }}>
              <Library size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#6366F1', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Books</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#312E81', fontSize: '1.75rem', fontWeight: 900 }}>{totalBooksCount}</h3>
            </div>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #FEF3C7' }}>
            <div style={{ padding: '1rem', background: '#FFFBEB', color: '#D97706', borderRadius: '1rem' }}>
              <BookOpen size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#D97706', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Active Issues</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#92400E', fontSize: '1.75rem', fontWeight: 900 }}>{activeIssuesCount}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #FEE2E2' }}>
            <div style={{ padding: '1rem', background: '#FEF2F2', color: '#EF4444', borderRadius: '1rem' }}>
              <Clock size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Overdue Returns</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#7F1D1D', fontSize: '1.75rem', fontWeight: 900 }}>{overdueCount}</h3>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setActiveTab('catalog')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'catalog' ? '#4F46E5' : '#F1F5F9', color: activeTab === 'catalog' ? 'white' : '#64748B' }}>
            <BookText size={18} /> Book Catalog
          </button>
          <button 
            onClick={() => setActiveTab('issued')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'issued' ? '#4F46E5' : '#F1F5F9', color: activeTab === 'issued' ? 'white' : '#64748B' }}>
            <BookOpen size={18} /> Issued Books
          </button>
        </div>

        {/* Data Grid */}
        <div className="glass-card table-container" style={{ padding: '1.5rem' }}>
          <div className="table-header flex-between" style={{ marginBottom: '1.5rem' }}>
            <div className="search-box" style={{ width: '350px' }}>
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder={`Search by title or author...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex-center py-8 text-muted">Loading {activeTab}...</div>
          ) : activeTab === 'catalog' ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>ISBN</th>
                    <th>Stock Availability</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length > 0 ? (
                    filteredBooks.map((book) => {
                      const outOfStock = book.available_copies === 0;
                      return (
                        <tr key={book.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BookText size={20} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '1rem' }}>
                                  {book.title}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, marginTop: '2px' }}>
                                  By {book.author}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                              {book.isbn || '-'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ 
                                background: outOfStock ? '#FEE2E2' : '#D1FAE5', 
                                color: outOfStock ? '#DC2626' : '#059669', 
                                padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 
                              }}>
                                {outOfStock ? 'Out of Stock' : 'In Stock'}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>
                                ({book.available_copies} of {book.total_copies} available)
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                              <button className="icon-btn text-red" onClick={() => handleDelete(book.id, book.title)} title="Delete Book" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted" style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <Library size={48} color="#CBD5E1" />
                          No books found in catalog.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book Issued</th>
                    <th>Dates</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssued.length > 0 ? (
                    filteredIssued.map((issue) => {
                      const isOverdue = new Date(issue.due_date) < new Date() && issue.status !== 'returned';
                      return (
                        <tr key={issue.id} style={{ backgroundColor: isOverdue ? '#FEF2F2' : 'transparent' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isOverdue ? '#FECACA' : '#F1F5F9', color: isOverdue ? '#DC2626' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BookOpen size={20} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.95rem' }}>{issue.title}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>By {issue.author}</div>
                                {issue.student_name && <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 700, marginTop: '2px' }}>Student: {issue.student_name}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                              <span style={{ color: '#94A3B8' }}>Issued:</span> {issue.issue_date?.substring(0, 10)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: isOverdue ? '#DC2626' : '#475569', fontWeight: isOverdue ? 800 : 600, marginTop: '4px' }}>
                              <span style={{ color: isOverdue ? '#EF4444' : '#94A3B8' }}>Due:</span> {issue.due_date?.substring(0, 10)}
                            </div>
                          </td>
                          <td>
                            <span style={{ 
                              background: issue.status === 'returned' ? '#D1FAE5' : isOverdue ? '#FEE2E2' : '#E0E7FF', 
                              color: issue.status === 'returned' ? '#059669' : isOverdue ? '#DC2626' : '#4F46E5', 
                              padding: '0.3rem 0.7rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}>
                              {isOverdue && <AlertCircle size={12} />}
                              {isOverdue ? 'OVERDUE' : issue.status || 'ISSUED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-muted" style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <BookOpen size={48} color="#CBD5E1" />
                          No books currently issued.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Book Modal */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#1E293B', margin: 0 }}>Add New Book</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>Add a book to the library catalog</p>
                </div>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleAdd} style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Book Title *</label>
                    <input type="text" name="title" className="input-field" placeholder="e.g. Panchatantra Stories" value={form.title} onChange={handleInputChange} required style={{ background: '#F8FAFC' }} />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Author Name *</label>
                    <input type="text" name="author" className="input-field" placeholder="e.g. Vishnu Sharma" value={form.author} onChange={handleInputChange} required style={{ background: '#F8FAFC' }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>ISBN (Optional)</label>
                      <input type="text" name="isbn" className="input-field" placeholder="978-3-16..." value={form.isbn} onChange={handleInputChange} style={{ background: '#F8FAFC' }} />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Total Copies</label>
                      <input type="number" name="copies" className="input-field" placeholder="1" min="1" value={form.copies} onChange={handleInputChange} style={{ background: '#F8FAFC' }} />
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#4F46E5', padding: '0.8rem 2rem', fontSize: '1rem' }}>
                    {saving ? 'Saving...' : 'Save Book'}
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

export default LibraryManagement;

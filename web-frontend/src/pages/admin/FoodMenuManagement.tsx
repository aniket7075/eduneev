import React, { useState, useEffect } from 'react';
import SmartSidebar from "../../components/SmartSidebar";
import apiClient from '../../api/client';
import { Plus, Coffee, X, UtensilsCrossed, Calendar, Trash2 } from 'lucide-react';
import './Directory.css';

interface FoodMenu {
  id: string;
  date: string;
  breakfast: string;
  lunch: string;
  snacks: string;
}

const FoodMenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<FoodMenu[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [date, setDate] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [snacks, setSnacks] = useState('');

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/food');
      if (response.data.data) {
        setMenus(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch food menus', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setBreakfast('');
    setLunch('');
    setSnacks('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert('Please select a date');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/food', {
        date,
        breakfast: breakfast || 'Not specified',
        lunch: lunch || 'Not specified',
        snacks: snacks || 'Not specified',
      });
      setIsModalOpen(false);
      fetchMenus();
    } catch (error: any) {
      console.error('Failed to save food menu', error);
      alert(error.response?.data?.error || 'Could not save food menu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, date: string) => {
    const dateStr = new Date(date).toLocaleDateString();
    if (!window.confirm(`Are you sure you want to delete the menu for ${dateStr}?`)) return;
    
    try {
      await apiClient.delete(`/food/${id}`);
      fetchMenus();
    } catch (error: any) {
      console.error('Failed to delete food menu', error);
      alert(error.response?.data?.error || 'Could not delete food menu');
    }
  };

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        <header className="header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 className="welcome-text" style={{ color: '#C2410C' }}>Food Menu</h1>
            <p className="date-text">Weekly healthy diet plan</p>
          </div>
          <button className="btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F97316', border: 'none', boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.3)' }}>
            <Plus size={20} /> Plan Menu
          </button>
        </header>

        {loading ? (
          <div className="flex-center py-8 text-muted">Loading menus...</div>
        ) : menus.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {menus.map((menu) => (
              <div 
                key={menu.id} 
                className="glass-card" 
                style={{ 
                  padding: '1.5rem', 
                  border: '1px solid #FFEDD5', 
                  background: 'white',
                  transition: 'transform 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(249, 115, 22, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Decorative background element */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, color: '#F97316' }}>
                  <UtensilsCrossed size={120} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
                    <UtensilsCrossed size={24} color="#F97316" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1F2937' }}>
                      {new Date(menu.date).toLocaleDateString(undefined, { weekday: 'long' })}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>
                      {new Date(menu.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(menu.id, menu.date)}
                    style={{ position: 'absolute', top: '0', right: '0', background: '#FEE2E2', border: 'none', color: '#DC2626', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                    title="Delete Menu"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div style={{ backgroundColor: '#FFF7ED', borderRadius: '1rem', padding: '1.25rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', marginBottom: '0.75rem' }}>
                    <div style={{ width: '80px', fontSize: '0.85rem', fontWeight: 700, color: '#EA580C', flexShrink: 0 }}>Breakfast</div>
                    <div style={{ flex: 1, fontSize: '0.85rem', color: '#374151', lineHeight: 1.4 }}>{menu.breakfast || 'Not specified'}</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: '0.75rem' }}>
                    <div style={{ width: '80px', fontSize: '0.85rem', fontWeight: 700, color: '#EA580C', flexShrink: 0 }}>Lunch</div>
                    <div style={{ flex: 1, fontSize: '0.85rem', color: '#374151', lineHeight: 1.4 }}>{menu.lunch || 'Not specified'}</div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: '80px', fontSize: '0.85rem', fontWeight: 700, color: '#EA580C', flexShrink: 0 }}>Snacks</div>
                    <div style={{ flex: 1, fontSize: '0.85rem', color: '#374151', lineHeight: 1.4 }}>{menu.snacks || 'Not specified'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#FFF7ED', border: '1px dashed #FDBA74' }}>
            <Coffee size={64} color="#FDBA74" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#9A3412', fontSize: '1.25rem' }}>No menu available yet</h3>
            <p style={{ margin: 0, color: '#C2410C' }}>Click 'Plan Menu' to create your first food menu.</p>
          </div>
        )}

        {/* Plan Menu Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #FFEDD5', background: '#FFF7ED' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#9A3412', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UtensilsCrossed size={20} /> Plan Food Menu
                  </h2>
                </div>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #FFEDD5' }}>
                  <X size={20} color="#EA580C" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#4B5563', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="#EA580C" /> Date *
                    </label>
                    <input 
                      type="date"
                      className="input-field" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)}
                      required
                      style={{ border: '1px solid #FFEDD5', background: 'white' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#4B5563' }}>Breakfast</label>
                    <textarea 
                      className="input-field" 
                      placeholder="E.g. Oatmeal with fruits, Milk..." 
                      value={breakfast} 
                      onChange={(e) => setBreakfast(e.target.value)} 
                      rows={2}
                      style={{ border: '1px solid #FFEDD5', background: 'white', resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#4B5563' }}>Lunch</label>
                    <textarea 
                      className="input-field" 
                      placeholder="E.g. Rice, Dal, Mixed Vegetables..." 
                      value={lunch} 
                      onChange={(e) => setLunch(e.target.value)} 
                      rows={3}
                      style={{ border: '1px solid #FFEDD5', background: 'white', resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#4B5563' }}>Snacks</label>
                    <textarea 
                      className="input-field" 
                      placeholder="E.g. Apple slices, Juice..." 
                      value={snacks} 
                      onChange={(e) => setSnacks(e.target.value)} 
                      rows={2}
                      style={{ border: '1px solid #FFEDD5', background: 'white', resize: 'vertical' }}
                    />
                  </div>
                  
                  <div style={{ padding: '0.75rem', backgroundColor: '#FFF7ED', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#9A3412', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ marginTop: '0.1rem' }}>ℹ️</div>
                    <div>If a menu already exists for the selected date, it will be automatically updated with these new details.</div>
                  </div>

                </div>

                <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#F97316', border: 'none', boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.3)' }}>
                    {saving ? 'Saving...' : 'Save Menu'}
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

export default FoodMenuManagement;

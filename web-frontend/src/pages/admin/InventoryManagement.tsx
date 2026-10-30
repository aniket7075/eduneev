import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/Sidebar";
import apiClient from '../../api/client';
import { Search, Plus, ArrowLeft, Package, AlertTriangle, Trash2, CheckCircle, FileText, X, PlusCircle, MinusCircle, ShoppingCart } from 'lucide-react';
import './Directory.css';

interface Item {
  id: string;
  name: string;
  category: string;
  sku: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  unit_price: string;
  supplier_name: string;
}

interface Order {
  id: string;
  item_id: string;
  item_name: string;
  quantity_requested: number;
  unit: string;
  priority: string;
  status: string;
  order_date: string;
}

const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'stock' | 'orders'>('stock');
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', category: 'General', sku: '', current_stock: '0',
    minimum_stock: '5', unit: 'pcs', unit_price: '', supplier_name: ''
  });

  const [adjustForm, setAdjustForm] = useState({
    transaction_type: 'stock_in', quantity: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resItems, resOrders] = await Promise.all([
        apiClient.get('/inventory/items').catch(() => ({ data: { data: [] } })),
        apiClient.get('/inventory/orders').catch(() => ({ data: { data: [] } }))
      ]);
      setItems(resItems.data?.data || []);
      setOrders(resOrders.data?.data || []);
    } catch (err) {
      console.error('Fetch inventory error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { alert('Item name is required'); return; }
    setSaving(true);
    try {
      await apiClient.post('/inventory/items', form);
      setIsAddModalOpen(false);
      setForm({ name: '', category: 'General', sku: '', current_stock: '0', minimum_stock: '5', unit: 'pcs', unit_price: '', supplier_name: '' });
      fetchData();
      alert('Inventory item added successfully!');
    } catch (err: any) { 
      alert(err.response?.data?.error || 'Failed to add item'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !adjustForm.quantity) return;
    setSaving(true);
    try {
      await apiClient.post(`/inventory/items/${selectedItem.id}/adjust`, adjustForm);
      setIsAdjustModalOpen(false);
      setAdjustForm({ transaction_type: 'stock_in', quantity: '', notes: '' });
      setSelectedItem(null);
      fetchData();
      alert('Stock adjusted successfully!');
    } catch (err: any) { 
      alert(err.response?.data?.error || 'Failed to adjust stock'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if(!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await apiClient.delete(`/inventory/items/${id}`);
      fetchData();
    } catch { alert('Failed to delete'); }
  };

  const handleMarkReceived = async (id: string) => {
    try {
      await apiClient.put(`/inventory/orders/${id}/status`, { status: 'received' });
      fetchData();
    } catch (e) {
      alert('Failed to update order');
    }
  };

  const filteredItems = items.filter(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOrders = orders.filter(o => (o.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  
  const lowStockCount = items.filter(i => i.current_stock <= i.minimum_stock).length;
  const pendingOrdersCount = orders.filter(o => o.status !== 'received').length;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text">Inventory Management</h1>
              <p className="date-text">Track stock levels, supplies, and purchase orders</p>
            </div>
          </div>
          {activeTab === 'stock' && (
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10B981', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
              <Plus size={20} /> Add Item
            </button>
          )}
        </header>

        {/* Dynamic Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #E0E7FF' }}>
            <div style={{ padding: '1rem', background: '#EEF2FF', color: '#6366F1', borderRadius: '1rem' }}>
              <Package size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#6366F1', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Items</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#312E81', fontSize: '1.75rem', fontWeight: 900 }}>{items.length}</h3>
            </div>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #FEE2E2' }}>
            <div style={{ padding: '1rem', background: '#FEF2F2', color: '#EF4444', borderRadius: '1rem' }}>
              <AlertTriangle size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Low Stock Alert</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#7F1D1D', fontSize: '1.75rem', fontWeight: 900 }}>{lowStockCount}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #FEF3C7' }}>
            <div style={{ padding: '1rem', background: '#FFFBEB', color: '#D97706', borderRadius: '1rem' }}>
              <ShoppingCart size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#D97706', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Pending Orders</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#92400E', fontSize: '1.75rem', fontWeight: 900 }}>{pendingOrdersCount}</h3>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setActiveTab('stock')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'stock' ? '#10B981' : '#F1F5F9', color: activeTab === 'stock' ? 'white' : '#64748B' }}>
            <Package size={18} /> Stock Items
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'orders' ? '#10B981' : '#F1F5F9', color: activeTab === 'orders' ? 'white' : '#64748B' }}>
            <FileText size={18} /> Purchase Orders
          </button>
        </div>

        {/* Data Grid */}
        <div className="glass-card table-container" style={{ padding: '1.5rem' }}>
          <div className="table-header flex-between" style={{ marginBottom: '1.5rem' }}>
            <div className="search-box" style={{ width: '350px' }}>
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab === 'stock' ? 'items' : 'orders'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex-center py-8 text-muted">Loading {activeTab}...</div>
          ) : activeTab === 'stock' ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item Name & Details</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const isLow = item.current_stock <= item.minimum_stock;
                      return (
                        <tr key={item.id} style={{ backgroundColor: isLow ? '#FEF2F2' : 'transparent' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isLow ? '#FECACA' : '#F1F5F9', color: isLow ? '#DC2626' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={20} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {item.name}
                                  {isLow && <span style={{ background: '#EF4444', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Low Stock</span>}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, marginTop: '2px' }}>
                                  SKU: {item.sku || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ background: '#F8FAFC', padding: '0.3rem 0.7rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', border: '1px solid #E2E8F0' }}>
                              {item.category}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: isLow ? '#DC2626' : '#10B981' }}>{item.current_stock}</span>
                              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>{item.unit}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Min: {item.minimum_stock}</div>
                          </td>
                          <td style={{ fontWeight: 700, color: '#475569' }}>
                            {item.unit_price ? `₹${item.unit_price}` : '-'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                              <button className="icon-btn" onClick={() => { setSelectedItem(item); setIsAdjustModalOpen(true); }} title="Adjust Stock" style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE', width: 'auto', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.8rem' }}>
                                Adjust
                              </button>
                              <button className="icon-btn text-red" onClick={() => handleDelete(item.id, item.name)} title="Delete Item" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted" style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <Package size={48} color="#CBD5E1" />
                          No inventory items found.
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
                    <th>Item Requested</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#1E293B' }}>{order.item_name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                            Req: {order.quantity_requested} {order.unit}
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            background: order.priority === 'high' ? '#FEE2E2' : order.priority === 'medium' ? '#FEF3C7' : '#F1F5F9', 
                            color: order.priority === 'high' ? '#DC2626' : order.priority === 'medium' ? '#D97706' : '#64748B', 
                            padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'capitalize' 
                          }}>
                            {order.priority || 'Normal'}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            background: order.status === 'received' ? '#D1FAE5' : order.status === 'approved' ? '#DBEAFE' : '#F1F5F9', 
                            color: order.status === 'received' ? '#059669' : order.status === 'approved' ? '#2563EB' : '#475569', 
                            padding: '0.3rem 0.7rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'capitalize' 
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {order.status === 'approved' && (
                            <button onClick={() => handleMarkReceived(order.id)} style={{ background: '#10B981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                              <CheckCircle size={14} /> Mark Received
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted" style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <FileText size={48} color="#CBD5E1" />
                          No purchase orders found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Item Modal */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#1E293B', margin: 0 }}>Add Inventory Item</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>Create a new trackable item</p>
                </div>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleAdd} style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Item Name *</label>
                    <input type="text" name="name" className="input-field" placeholder="e.g. A4 Printing Paper" value={form.name} onChange={handleInputChange} required style={{ background: '#F8FAFC' }} />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Category</label>
                    <input type="text" name="category" className="input-field" placeholder="e.g. Stationery" value={form.category} onChange={handleInputChange} style={{ background: '#F8FAFC' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>SKU Code</label>
                    <input type="text" name="sku" className="input-field" placeholder="e.g. STAT-001" value={form.sku} onChange={handleInputChange} style={{ background: '#F8FAFC' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Initial Stock</label>
                    <input type="number" name="current_stock" className="input-field" placeholder="0" value={form.current_stock} onChange={handleInputChange} style={{ background: '#F8FAFC' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Min Stock Alert Level</label>
                    <input type="number" name="minimum_stock" className="input-field" placeholder="5" value={form.minimum_stock} onChange={handleInputChange} style={{ background: '#F8FAFC' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Unit Type</label>
                    <input type="text" name="unit" className="input-field" placeholder="e.g. pcs, boxes" value={form.unit} onChange={handleInputChange} style={{ background: '#F8FAFC' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Unit Price (₹)</label>
                    <input type="number" name="unit_price" className="input-field" placeholder="0.00" value={form.unit_price} onChange={handleInputChange} style={{ background: '#F8FAFC' }} />
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#10B981', padding: '0.8rem 2rem', fontSize: '1rem' }}>
                    {saving ? 'Saving...' : 'Save Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {isAdjustModalOpen && selectedItem && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px', width: '95%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#1E293B', margin: 0 }}>Adjust Stock</h2>
                <button className="icon-btn" onClick={() => setIsAdjustModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>ITEM</div>
                <div style={{ fontSize: '1.2rem', color: '#0F172A', fontWeight: 900 }}>{selectedItem.name}</div>
                <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600, marginTop: '4px' }}>Current: <span style={{ color: '#10B981' }}>{selectedItem.current_stock} {selectedItem.unit}</span></div>
              </div>

              <form onSubmit={handleAdjust}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div 
                    onClick={() => setAdjustForm({...adjustForm, transaction_type: 'stock_in'})}
                    style={{ flex: 1, padding: '1rem', borderRadius: '0.75rem', border: `2px solid ${adjustForm.transaction_type === 'stock_in' ? '#10B981' : '#E2E8F0'}`, background: adjustForm.transaction_type === 'stock_in' ? '#ECFDF5' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                    <PlusCircle size={24} color={adjustForm.transaction_type === 'stock_in' ? '#10B981' : '#94A3B8'} />
                    <span style={{ fontWeight: 800, color: adjustForm.transaction_type === 'stock_in' ? '#064E3B' : '#64748B' }}>Stock IN</span>
                  </div>
                  <div 
                    onClick={() => setAdjustForm({...adjustForm, transaction_type: 'stock_out'})}
                    style={{ flex: 1, padding: '1rem', borderRadius: '0.75rem', border: `2px solid ${adjustForm.transaction_type === 'stock_out' ? '#F43F5E' : '#E2E8F0'}`, background: adjustForm.transaction_type === 'stock_out' ? '#FFF1F2' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                    <MinusCircle size={24} color={adjustForm.transaction_type === 'stock_out' ? '#F43F5E' : '#94A3B8'} />
                    <span style={{ fontWeight: 800, color: adjustForm.transaction_type === 'stock_out' ? '#881337' : '#64748B' }}>Stock OUT</span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Quantity *</label>
                  <input type="number" name="quantity" className="input-field" placeholder="0" min="1" value={adjustForm.quantity} onChange={(e) => setAdjustForm({...adjustForm, quantity: e.target.value})} required style={{ background: '#F8FAFC', fontSize: '1.2rem', fontWeight: 800 }} />
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Notes (Optional)</label>
                  <input type="text" name="notes" className="input-field" placeholder="Reason for adjustment" value={adjustForm.notes} onChange={(e) => setAdjustForm({...adjustForm, notes: e.target.value})} style={{ background: '#F8FAFC' }} />
                </div>

                <button type="submit" disabled={saving} className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: adjustForm.transaction_type === 'stock_in' ? '#10B981' : '#F43F5E', border: 'none' }}>
                  {saving ? 'Processing...' : `Confirm ${adjustForm.transaction_type === 'stock_in' ? 'Stock In' : 'Stock Out'}`}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default InventoryManagement;

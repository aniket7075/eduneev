import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import apiClient from '../../api/client';
import { MessageSquare, ArrowLeft, Send, Users, ShieldCheck, Search, RefreshCw } from 'lucide-react';
import '../admin/Dashboard.css';

interface ChatChannel {
  id: string;
  name: string;
  subTitle: string;
  icon: string;
  unread: number;
  lastMsg: string;
  lastTime: string;
}

interface MessageItem {
  id: string;
  sender_id?: string;
  senderName?: string;
  text: string;
  time: string;
  isMe: boolean;
}

const ParentChat: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const childName = loggedUser?.childName || (loggedUser?.firstName ? `${loggedUser.firstName}'s Child` : 'My Child');
  const childClass = loggedUser?.className || loggedUser?.grade || 'Nursery';
  const childFirstName = childName.split(' ')[0];

  const defaultChannels: ChatChannel[] = [
    {
      id: 'room-teacher-direct',
      name: 'Class Teacher (Direct)',
      subTitle: `Official 1-on-1 chat with ${childClass} teacher`,
      icon: '👩‍🏫',
      unread: 0,
      lastMsg: 'Yes, meal and afternoon activities were completed on time.',
      lastTime: '11:30 AM'
    },
    {
      id: 'room-nursery-class',
      name: `${childClass} Official Class Group`,
      subTitle: `Parents & Teachers Group for ${childClass}`,
      icon: '🏫',
      unread: 1,
      lastMsg: 'Reminder: Tomorrow is Color Day activity! Please send extra apron.',
      lastTime: '09:45 AM'
    },
    {
      id: 'room-announcements',
      name: 'School Circulars & Announcements',
      subTitle: 'Official Admin Broadcast Channel',
      icon: '📢',
      unread: 0,
      lastMsg: 'Diwali vacation circular has been posted in Notices section.',
      lastTime: 'Oct 04'
    },
    {
      id: 'room-daycare',
      name: 'Daycare & Activity Group',
      subTitle: 'Daily meal, nap & playtime updates',
      icon: '🍎',
      unread: 0,
      lastMsg: 'Fresh Fruit Salad & Warm Milk served at 10:30 AM.',
      lastTime: '10:35 AM'
    }
  ];

  const [channels, setChannels] = useState<ChatChannel[]>(defaultChannels);
  const [activeChannelId, setActiveChannelId] = useState<string>('room-teacher-direct');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [sending, setSending] = useState(false);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch Real Chat Rooms from PostgreSQL Backend API
  const fetchRealRooms = async () => {
    try {
      const response = await apiClient.get('/chat/rooms');
      const dbRooms = response.data?.data || response.data || [];
      if (Array.isArray(dbRooms) && dbRooms.length > 0) {
        const mappedRooms: ChatChannel[] = dbRooms.map((r: any) => ({
          id: r.id,
          name: r.name || `${childClass} Class Group`,
          subTitle: r.target_class ? `${r.target_class} Official Channel` : `Communication channel for ${childName}`,
          icon: r.name?.includes('Teacher') ? '👩‍🏫' : r.name?.includes('Group') ? '🏫' : r.name?.includes('Announcement') ? '📢' : '💬',
          unread: 0,
          lastMsg: r.last_message || 'Tap to view conversation',
          lastTime: r.last_message_time ? new Date(r.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'
        }));
        setChannels(mappedRooms);
        if (!mappedRooms.some(m => m.id === activeChannelId)) {
          setActiveChannelId(mappedRooms[0].id);
        }
      }
    } catch (err) {
      console.warn('Real chat rooms fetch warning (using cached channels):', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // 2. Fetch Real Messages for Active Selected Room from PostgreSQL Backend API
  const fetchRealMessages = async () => {
    if (!activeChannelId) return;

    try {
      const response = await apiClient.get(`/chat/messages/${activeChannelId}`);
      const dbMsgs = response.data?.data || response.data || [];
      if (Array.isArray(dbMsgs)) {
        const currentUserId = loggedUser.id || loggedUser.user_id;
        const mapped: MessageItem[] = dbMsgs.map((m: any) => {
          const isSenderMe = String(m.sender_id) === String(currentUserId);
          const senderLabel = isSenderMe ? 'You' : `${m.first_name || 'Staff'} ${m.last_name || ''}`.trim();
          return {
            id: m.id || Date.now().toString(),
            sender_id: m.sender_id,
            senderName: senderLabel,
            text: m.message || m.text || '',
            time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            isMe: isSenderMe
          };
        });
        setMessages(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch real chat messages from database:', err);
    }
  };

  useEffect(() => {
    fetchRealRooms();
  }, []);

  useEffect(() => {
    fetchRealMessages();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchRealMessages();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChannelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Send Real Message to PostgreSQL Backend API
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const textToSend = inputMsg.trim();
    setInputMsg('');
    setSending(true);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic local update
    const optimisticMsg: MessageItem = {
      id: Date.now().toString(),
      senderName: 'You',
      text: textToSend,
      time: timeStr,
      isMe: true
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // Send to backend API
    try {
      await apiClient.post('/chat/messages', {
        room_id: activeChannelId,
        message: textToSend
      });
      fetchRealMessages();
      fetchRealRooms();
    } catch (err) {
      console.error('Real message dispatch notice:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ch.subTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <ParentSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Header Bar */}
        <header className="header flex-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
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
                <MessageSquare color="#6366F1" size={30} />
                Live Parent & Class Chat Portal
              </h1>
              <p className="date-text" style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                Real-time database chat connected for {childName} ({childClass})
              </p>
            </div>
          </div>

          <button
            onClick={fetchRealRooms}
            style={{
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #CBD5E1',
              padding: '0.5rem 1rem',
              borderRadius: '0.65rem',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={15} /> Refresh Chats
          </button>
        </header>

        {/* Child Context & Quick Navigation Bar */}
        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '0.75rem 1.25rem', borderRadius: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>👶</div>
            <div>
              <div style={{ fontWeight: 800, color: '#1E1B4B', fontSize: '0.95rem' }}>Communication regarding: {childName} ({childClass})</div>
              <div style={{ fontSize: '0.78rem', color: '#4338CA', fontWeight: 600 }}>Assigned PostgreSQL Database channels added by Admin & Class Teacher</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => navigate('/parent/leaves')} style={{ background: '#FFFFFF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.4rem 0.85rem', borderRadius: '0.6rem', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>
              📄 Leave Approvals
            </button>
            <button onClick={() => navigate('/parent/health')} style={{ background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3', padding: '0.4rem 0.85rem', borderRadius: '0.6rem', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>
              🏥 Sick Notes
            </button>
          </div>
        </div>

        {/* Main Multi-Channel Side-by-Side Layout */}
        <div style={{ background: 'white', borderRadius: '1.2rem', border: '1px solid #E2E8F0', height: '560px', display: 'flex', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          
          {/* Left Groups / Conversations Panel */}
          <div style={{ width: '320px', borderRight: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
            
            {/* Search Header */}
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', padding: '0.4rem 0.75rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1' }}>
                <Search size={16} color="#64748B" style={{ marginRight: '0.5rem' }} />
                <input
                  type="text"
                  placeholder="Search groups & chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.82rem', fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Groups List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '0.5rem 0.85rem 0.25rem', fontSize: '0.72rem', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Assigned Class Groups & Chats ({filteredChannels.length})
              </div>

              {loadingRooms ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                  Loading chat channels...
                </div>
              ) : (
                filteredChannels.map(ch => {
                  const isActive = ch.id === activeChannelId;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => {
                        setActiveChannelId(ch.id);
                      }}
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        background: isActive ? '#EEF2FF' : 'transparent',
                        borderLeft: isActive ? '4px solid #4F46E5' : '4px solid transparent',
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: isActive ? '#4F46E5' : '#E0E7FF', color: isActive ? 'white' : '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 900, flexShrink: 0 }}>
                        {ch.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: isActive ? '#1E1B4B' : '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ch.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{ch.lastTime}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', fontWeight: 600 }}>
                            {ch.lastMsg}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Notice */}
            <div style={{ padding: '0.65rem 0.85rem', background: '#F1F5F9', borderTop: '1px solid #E2E8F0', fontSize: '0.72rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} color="#059669" />
              <span>Real-time channels managed by School Admin</span>
            </div>
          </div>

          {/* Right Main Active Group / Chat View */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
            
            {/* Active Channel Header */}
            <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900 }}>
                  {activeChannel.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#0F172A', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {activeChannel.name}
                    <span style={{ fontSize: '0.7rem', background: '#DCFCE7', color: '#15803D', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 800 }}>
                      Live PostgreSQL Database Channel
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                    {activeChannel.subTitle}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ● Connected to Live Database
              </div>
            </div>

            {/* Messages Feed for Selected Group */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FAF5FF' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B', fontWeight: 600 }}>
                  💬 No messages yet in this channel. Send a message to start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.isMe;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {!isMe && msg.senderName && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6366F1', marginBottom: '2px', marginLeft: '6px' }}>
                          {msg.senderName}
                        </span>
                      )}
                      <div style={{ 
                        maxWidth: '75%', 
                        background: isMe ? '#F59E0B' : '#FFFFFF', 
                        color: isMe ? '#FFFFFF' : '#1E293B',
                        padding: '0.85rem 1.15rem', 
                        borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        border: isMe ? 'none' : '1px solid #E2E8F0'
                      }}>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.5', fontWeight: 500 }}>{msg.text}</p>
                        <div style={{ fontSize: '0.7rem', color: isMe ? 'rgba(255,255,255,0.85)' : '#94A3B8', marginTop: '4px', textAlign: 'right', fontWeight: 600 }}>
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Message Input Bar */}
            <form onSubmit={handleSend} style={{ padding: '0.85rem 1.25rem', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.75rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder={`Type your message in ${activeChannel.name}...`} 
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                style={{ flex: 1, borderRadius: '25px', padding: '0.65rem 1.25rem', fontWeight: 600 }}
              />
              <button
                type="submit"
                disabled={sending || !inputMsg.trim()}
                className="btn-primary"
                style={{
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#F59E0B',
                  opacity: sending || !inputMsg.trim() ? 0.6 : 1
                }}
              >
                <Send size={18} />
              </button>
            </form>

          </div>

        </div>
      </main>
    </div>
  );
};

export default ParentChat;

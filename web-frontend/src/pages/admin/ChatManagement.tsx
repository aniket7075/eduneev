import React, { useState, useEffect, useRef } from 'react';
import Sidebar from "../../components/Sidebar";
import apiClient from '../../api/client';
import { Search, Send, MessageCircle } from 'lucide-react';
import './Directory.css';

interface ChatUser {
  id: string;
  first_name: string;
  last_name: string;
  class_name?: string;
  grade?: string;
  profile_image_url?: string;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const ChatManagement: React.FC = () => {
  // Current user info (needed to align messages Left/Right)
  // Assuming API provides user info or we just check if sender_id === current user
  // Let's assume we have it or we decode token, but here we can deduce it from API logic if needed
  // Since we don't have access to Redux here, we can fetch user profile or assume sender_id logic
  // The API `GET /auth/me` could be used, but let's assume we fetch it if needed.
  // Actually, we can fetch `/auth/me` or just check if `sender_id` matches our admin ID.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Left Panel Data
  const [students, setStudents] = useState<ChatUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Right Panel Data
  const [selectedStudent, setSelectedStudent] = useState<ChatUser | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchStudents();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get('/auth/me'); // Optional depending on how API is structured
      if (response.data && response.data.user) {
        setCurrentUserId(response.data.user.id);
      }
    } catch (error) {
      console.log('Could not fetch current user', error);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      // In the legacy app, admins/teachers fetch `/chat/students` to get whom they can chat with
      const response = await apiClient.get('/chat/students');
      setStudents(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectStudent = async (student: ChatUser) => {
    setSelectedStudent(student);
    setCurrentRoomId(null);
    setMessages([]);
    setLoadingMessages(true);

    try {
      // Create or get room
      const roomResponse = await apiClient.post('/chat/room/student', { student_id: student.id });
      const roomId = roomResponse.data?.data?.id;
      if (roomId) {
        setCurrentRoomId(roomId);
        fetchMessages(roomId);
      }
    } catch (error) {
      console.error('Failed to init chat room', error);
      setLoadingMessages(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const response = await apiClient.get(`/chat/messages/${roomId}`);
      setMessages(response.data?.data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Polling for messages
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentRoomId) {
      interval = setInterval(() => {
        fetchMessages(currentRoomId);
      }, 3000); // Poll every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentRoomId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentRoomId) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setSending(true);

    // Optimistic UI update
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      sender_id: currentUserId || 'me',
      message: textToSend,
      created_at: new Date().toISOString()
    };
    
    // We assume if currentUserId isn't loaded, it will show on right anyway since it won't match student ID
    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      await apiClient.post('/chat/messages', {
        room_id: currentRoomId,
        message: textToSend
      });
      // Silent success, polling will fetch actual message ID next tick
    } catch (error) {
      console.error('Failed to send message', error);
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter(m => m.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
        
        <header style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
          <h1 className="welcome-text">Messaging</h1>
          <p className="date-text">Communicate directly with parents</p>
        </header>

        <div style={{ display: 'flex', flex: 1, background: 'white', borderRadius: '1rem', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          
          {/* Left Panel: Contact List */}
          <div style={{ width: '350px', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '2rem', border: '1px solid #E2E8F0', fontSize: '0.9rem', outline: 'none', backgroundColor: 'white' }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingStudents ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Loading contacts...</div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <div 
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    style={{ 
                      padding: '1rem 1.5rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem', 
                      cursor: 'pointer',
                      borderBottom: '1px solid #F1F5F9',
                      backgroundColor: selectedStudent?.id === student.id ? 'white' : 'transparent',
                      borderLeft: selectedStudent?.id === student.id ? '4px solid #3B82F6' : '4px solid transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => { if (selectedStudent?.id !== student.id) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                    onMouseLeave={(e) => { if (selectedStudent?.id !== student.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {student.profile_image_url ? (
                        <img src={student.profile_image_url} alt={student.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#3B82F6' }}>{student.first_name[0]}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {student.first_name} {student.last_name}
                      </h3>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                        {student.class_name || student.grade || 'Student'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>No contacts found</div>
              )}
            </div>
          </div>

          {/* Right Panel: Chat Window */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
            {selectedStudent ? (
              <>
                {/* Chat Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {selectedStudent.profile_image_url ? (
                      <img src={selectedStudent.profile_image_url} alt={selectedStudent.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#3B82F6' }}>{selectedStudent.first_name[0]}</span>
                    )}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                      Active Channel
                    </span>
                  </div>
                </div>

                {/* Chat Messages */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
                  {loadingMessages ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>Loading messages...</div>
                  ) : messages.length > 0 ? (
                    messages.map((msg, index) => {
                      // If we don't have currentUserId, we assume messages sent by the student are 'other' and rest is 'me'
                      // Usually the API stores the admin's ID as sender_id when the admin sends it.
                      // If we don't have currentUserId fetched properly, fallback: if sender_id === selectedStudent.id, it's 'other', else 'me'.
                      const isMe = currentUserId ? msg.sender_id === currentUserId : msg.sender_id !== selectedStudent.id;
                      
                      return (
                        <div key={msg.id || index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ 
                            maxWidth: '70%', 
                            padding: '0.8rem 1rem', 
                            borderRadius: '1rem',
                            borderBottomRightRadius: isMe ? 0 : '1rem',
                            borderBottomLeftRadius: isMe ? '1rem' : 0,
                            backgroundColor: isMe ? '#2563EB' : 'white',
                            color: isMe ? 'white' : '#0F172A',
                            border: isMe ? 'none' : '1px solid #E2E8F0',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}>
                            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                              {msg.message}
                            </p>
                            <div style={{ fontSize: '0.65rem', marginTop: '0.4rem', textAlign: 'right', color: isMe ? 'rgba(255,255,255,0.7)' : '#94A3B8' }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                      <MessageCircle size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
                      <p>Send a message to start the conversation.</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} style={{ padding: '1.25rem', backgroundColor: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <textarea 
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', outline: 'none', backgroundColor: '#F8FAFC', fontSize: '0.95rem', resize: 'none', maxHeight: '120px', minHeight: '44px', boxSizing: 'border-box' }}
                    rows={1}
                  />
                  <button 
                    type="submit" 
                    disabled={sending || !messageInput.trim()}
                    style={{ 
                      width: '44px', height: '44px', borderRadius: '50%', backgroundColor: messageInput.trim() ? '#2563EB' : '#CBD5E1', color: 'white', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
                      flexShrink: 0, transition: 'background-color 0.2s'
                    }}
                  >
                    <Send size={18} style={{ marginLeft: '2px' }} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                <MessageCircle size={64} color="#E2E8F0" style={{ marginBottom: '1.5rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#64748B' }}>Your Messages</h3>
                <p style={{ margin: 0 }}>Select a student from the left panel to view or start a chat.</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default ChatManagement;

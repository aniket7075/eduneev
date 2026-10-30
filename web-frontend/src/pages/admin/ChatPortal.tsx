import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartSidebar from '../../components/SmartSidebar';
import { MessageSquare, Search, Send, MoreVertical, Phone, Video, ArrowLeft, Plus, X, Users, ShieldAlert, FileText, BellRing, BookOpen, Mic, MicOff, VideoOff, PhoneOff, PhoneCall, PhoneIncoming, MonitorUp, Hand, Maximize2, Minimize2, Grid, Trash2 } from 'lucide-react';
import './Dashboard.css';

interface ChatUser {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
  online?: boolean;
  last_message_time?: string;
  last_message?: string;
  target_class?: string;
}

interface Message {
  id: string;
  text?: string;
  message?: string;
  sender_id: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  time?: string;
}

const ChatPortal: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [activeContact, setActiveContact] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const [newGroupName, setNewGroupName] = useState('');
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState('');

  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [groupMembersData, setGroupMembersData] = useState<{ room?: any; classTeacher?: any; franchiseAdmin?: any; superAdmin?: any; isMainBranch?: boolean; schoolName?: string; members?: any[]; totalCount?: number } | null>(null);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserStr = localStorage.getItem('user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : {};
  const isParent = currentUser.role === 'parent';
  const isTeacherOrAdmin = ['teacher', 'admin', 'school_admin', 'super_admin'].includes(currentUser.role);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const openNewChatModal = async () => {
    setIsNewChatModalOpen(true);
    setLoadingStudents(true);
    try {
      const { default: apiClient } = await import('../../api/client');
      const response = await apiClient.get('/chat/students');
      setStudentsList(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch students/contacts', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const startNewChat = async (contact: any) => {
    try {
      const { default: apiClient } = await import('../../api/client');
      let response;
      if (contact.contact_type === 'staff' || contact.role) {
        // Staff/Admin contact
        response = await apiClient.post('/chat/room/student', { target_user_id: contact.id });
      } else {
        // Student/Parent contact
        response = await apiClient.post('/chat/room/student', { student_id: contact.id });
      }
      const newRoom = response.data.data || response.data;
      
      if (!contacts.find(c => c.id === newRoom.id)) {
        setContacts(prev => [newRoom, ...prev]);
      }
      setActiveContact(newRoom);
      setIsNewChatModalOpen(false);
    } catch (error: any) {
      console.error('Failed to start chat', error);
      alert(error.response?.data?.error || 'Could not start chat.');
    }
  };

  const [selectedTargetClass, setSelectedTargetClass] = useState('Nursery');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalGroupName = newGroupName.trim() || `${selectedTargetClass} Class Group`;
    try {
      const { default: apiClient } = await import('../../api/client');
      const response = await apiClient.post('/chat/rooms', {
        name: finalGroupName,
        target_class: selectedTargetClass
      });
      const newRoom = response.data.data || response.data;
      setContacts(prev => [newRoom, ...prev]);
      setActiveContact(newRoom);
      setIsCreateGroupModalOpen(false);
      setNewGroupName('');
      fetchRooms();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create group');
    }
  };

  const handleAssignHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim() || !hwDesc.trim() || !activeContact) return;

    try {
      const { default: apiClient } = await import('../../api/client');

      // 1. Post to homework endpoint
      await apiClient.post('/homework', {
        title: hwTitle.trim(),
        description: hwDesc.trim(),
        due_date: hwDueDate || new Date().toISOString().split('T')[0],
        grade: activeContact.name?.split(' ')[0] || 'All'
      });

      // 2. Format & post message directly into chat
      const hwMessageText = `📚 [HOMEWORK ASSIGNMENT]\nTitle: ${hwTitle.trim()}\nDetails: ${hwDesc.trim()}\nDue Date: ${hwDueDate || 'As specified'}`;
      
      await apiClient.post('/chat/messages', {
        room_id: activeContact.id,
        message: hwMessageText
      });

      setIsHomeworkModalOpen(false);
      setHwTitle('');
      setHwDesc('');
      setHwDueDate('');
      fetchRooms();
    } catch (error: any) {
      console.error('Homework assignment error:', error);
      alert('Could not assign homework.');
    }
  };

  const lastSeenMsgIdRef = useRef<string | null>(null);


  // Request Browser Notification Permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Web Audio sound chime generator for messages and calls
  const playNotificationSound = useCallback((isCall = false) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isCall) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isCall ? 0.6 : 0.3));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isCall ? 0.6 : 0.3));
    } catch (e) {
      console.warn('Sound chime notice:', e);
    }
  }, []);

  const triggerIncomingAlert = useCallback((senderName: string, text: string, isCall: boolean) => {
    playNotificationSound(isCall);
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = isCall ? `📞 Incoming Call from ${senderName}` : `💬 New Message from ${senderName}`;
      new Notification(title, {
        body: text,
        icon: '/favicon.ico'
      });
    }
  }, [playNotificationSound]);

  const fetchRooms = useCallback(async () => {
    try {
      const { default: apiClient } = await import('../../api/client');
      const response = await apiClient.get('/chat/rooms');
      const rooms = response.data.data || response.data || [];
      setContacts(rooms);

      const savedRoomId = localStorage.getItem('active_chat_room_id');
      const savedRoom = savedRoomId ? rooms.find((r: any) => r.id === savedRoomId) : null;

      if (savedRoom) {
        setActiveContact(savedRoom);
      } else if (rooms.length > 0 && !activeContact) {
        setActiveContact(rooms[0]);
        localStorage.setItem('active_chat_room_id', rooms[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    }
  }, [activeContact]);

  const handleSelectContact = (contact: ChatUser) => {
    setActiveContact(contact);
    localStorage.setItem('active_chat_room_id', contact.id);
  };

  useEffect(() => {
    fetchRooms();
    const roomInterval = setInterval(() => {
      if (!document.hidden) {
        fetchRooms();
      }
    }, 8000);
    return () => clearInterval(roomInterval);
  }, [fetchRooms]);

  const [activeCallType, setActiveCallType] = useState<'voice' | 'video' | null>(null);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callElapsedSeconds, setCallElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const activeCallTypeRef = useRef(activeCallType);
  useEffect(() => { activeCallTypeRef.current = activeCallType; }, [activeCallType]);

  const localStreamRef = useRef(localStream);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  const processedSignalIdsRef = useRef<Set<string>>(new Set());

  const stopRingtone = () => {
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const playRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playBurst = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.8);
        osc2.stop(ctx.currentTime + 1.8);
      };

      playBurst();
      const ringInterval = setInterval(() => {
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          playBurst();
        } else {
          clearInterval(ringInterval);
        }
      }, 3000);
    } catch (e) {
      console.warn('Ringtone WebAudio notice:', e);
    }
  };

  const sendSignalingMessage = async (msgText: string) => {
    if (!activeContact) return;
    try {
      const { default: apiClient } = await import('../../api/client');
      await apiClient.post('/chat/messages', {
        room_id: activeContact.id,
        message: msgText
      });
    } catch (err) {
      console.warn('Signaling message error:', err);
    }
  };

  const createPeerConnection = (stream: MediaStream) => {
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' }
      ]
    });

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && activeContact) {
        const myId = currentUser.id || currentUser.user_id || 'me';
        sendSignalingMessage(`[WEBRTC_ICE:${myId}] ${JSON.stringify(event.candidate)}`);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Live Call Timer Effect
  useEffect(() => {
    if (!activeCallType || callStatus !== 'connected') return;
    const timer = setInterval(() => {
      setCallElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCallType, callStatus]);

  useEffect(() => {
    if (!activeContact) return;
    const fetchMessages = async () => {
      try {
        const { default: apiClient } = await import('../../api/client');
        const response = await apiClient.get(`/chat/messages/${activeContact.id}`);
        const fetchedMsgs: Message[] = response.data.data || response.data || [];
        const currentUserId = currentUser.id || currentUser.user_id || 'me';
        
        if (fetchedMsgs.length > 0) {
          const latestMsg = fetchedMsgs[fetchedMsgs.length - 1];
          
          if (lastSeenMsgIdRef.current && latestMsg.id !== lastSeenMsgIdRef.current && latestMsg.sender_id !== currentUserId) {
            const senderName = latestMsg.first_name ? `${latestMsg.first_name} ${latestMsg.last_name || ''}` : activeContact.name;
            const txt = latestMsg.message || latestMsg.text || '';
            const isCall = txt.includes('[LIVE');
            if (!txt.startsWith('[WEBRTC_')) {
              triggerIncomingAlert(senderName, txt, isCall);
            }
          }
          lastSeenMsgIdRef.current = latestMsg.id;

          // Check if latest call event is CALL HISTORY (ended by host/participant)
          const callEvents = fetchedMsgs.filter((m: any) => {
            const txt = m.message || m.text || '';
            return txt.includes('[LIVE') || txt.includes('[CALL HISTORY');
          });
          if (callEvents.length > 0) {
            const latestCallEvent = callEvents[callEvents.length - 1];
            const latestTxt = latestCallEvent.message || latestCallEvent.text || '';
            if (latestTxt.includes('[CALL HISTORY') && activeCallTypeRef.current !== null) {
              stopRingtone();
              if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                setLocalStream(null);
              }
              if (peerConnectionRef.current) {
                try { peerConnectionRef.current.close(); } catch (e) {}
                peerConnectionRef.current = null;
              }
              setRemoteStream(null);
              setActiveCallType(null);
              setCallStatus('ended');
              setCallElapsedSeconds(0);
            }
          }

          // Process WebRTC Signaling Packets
          for (const m of fetchedMsgs) {
            const txt = m.message || m.text || '';
            if (!txt.startsWith('[WEBRTC_') || m.sender_id === currentUserId || processedSignalIdsRef.current.has(m.id)) {
              continue;
            }

            if (txt.startsWith('[WEBRTC_OFFER:')) {
              processedSignalIdsRef.current.add(m.id);
              const offerSenderId = txt.split(']')[0].split(':')[1];
              const sdpStr = txt.substring(txt.indexOf(']') + 1).trim();
              try {
                const offer = JSON.parse(sdpStr);
                let pc = peerConnectionRef.current;
                if (!pc && localStreamRef.current) {
                  pc = createPeerConnection(localStreamRef.current);
                }
                if (pc) {
                  await pc.setRemoteDescription(new RTCSessionDescription(offer));
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  await sendSignalingMessage(`[WEBRTC_ANSWER:${offerSenderId}] ${JSON.stringify(answer)}`);
                }
              } catch (err) {
                console.warn('Error processing WEBRTC_OFFER:', err);
              }
            } else if (txt.startsWith('[WEBRTC_ANSWER:')) {
              const targetUserId = txt.split(']')[0].split(':')[1];
              if (targetUserId === currentUserId) {
                processedSignalIdsRef.current.add(m.id);
                const sdpStr = txt.substring(txt.indexOf(']') + 1).trim();
                try {
                  const answer = JSON.parse(sdpStr);
                  if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'stable') {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                  }
                } catch (err) {
                  console.warn('Error processing WEBRTC_ANSWER:', err);
                }
              }
            } else if (txt.startsWith('[WEBRTC_ICE:')) {
              processedSignalIdsRef.current.add(m.id);
              const iceStr = txt.substring(txt.indexOf(']') + 1).trim();
              try {
                const candidate = JSON.parse(iceStr);
                if (peerConnectionRef.current) {
                  await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
              } catch (err) {
                console.warn('Error processing WEBRTC_ICE:', err);
              }
            }
          }
        }

        setMessages(fetchedMsgs.filter((m: any) => !((m.message || m.text || '').startsWith('[WEBRTC_'))));
      } catch (error) {
        console.error('Failed to fetch messages', error);
      }
    };
    fetchMessages();
    const pollInterval = activeCallType !== null ? 1500 : 5000;
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchMessages();
      }
    }, pollInterval);
    return () => clearInterval(interval);
  }, [activeContact, triggerIncomingAlert, currentUser.id, currentUser.user_id, activeCallType]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    const textToSend = newMessage.trim();
    setNewMessage('');

    const currentUserId = currentUser.id || currentUser.user_id || 'me';

    const optimisticMsg: Message = {
      id: Date.now().toString(),
      message: textToSend,
      sender_id: currentUserId,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { default: apiClient } = await import('../../api/client');
      await apiClient.post('/chat/messages', {
        room_id: activeContact.id,
        message: textToSend
      });

      // Instantly refresh current room messages and room list
      const msgRes = await apiClient.get(`/chat/messages/${activeContact.id}`);
      const freshMsgs = msgRes.data.data || msgRes.data || [];
      setMessages(freshMsgs.filter((m: any) => !((m.message || m.text || '').startsWith('[WEBRTC_'))));
      fetchRooms();
    } catch (error) {
      console.error('Failed to send message', error);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  const handleShareScreen = async () => {
    try {
      if (isScreenSharing) {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(t => t.stop());
          screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
        if (videoRef.current && localStream) {
          videoRef.current.srcObject = localStream;
        }
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
          }
        };
      }
    } catch (err) {
      console.warn('Screen share notice:', err);
    }
  };

  const toggleRaiseHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    if (newState) {
      const userName = currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : 'Participant';
      alert(`✋ Hand Raised! Members in ${activeContact?.name || 'meeting'} can see your raised hand.`);
    }
  };



  const [activeMsgMenuId, setActiveMsgMenuId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleEditMessage = async (msgId: string) => {
    if (!editingText.trim()) return;
    try {
      const { default: apiClient } = await import('../../api/client');
      await apiClient.put(`/chat/messages/${msgId}`, { message: editingText.trim() });
      setEditingMsgId(null);
      setEditingText('');
      setActiveMsgMenuId(null);

      if (activeContact) {
        const msgRes = await apiClient.get(`/chat/messages/${activeContact.id}`);
        setMessages(msgRes.data.data || msgRes.data || []);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Could not edit message');
    }
  };

  const handleDeleteMessage = async (msgId: string, deleteFor: 'everyone' | 'me') => {
    try {
      const { default: apiClient } = await import('../../api/client');
      await apiClient.delete(`/chat/messages/${msgId}?deleteFor=${deleteFor}`);
      setActiveMsgMenuId(null);

      if (deleteFor === 'me') {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      } else if (activeContact) {
        const msgRes = await apiClient.get(`/chat/messages/${activeContact.id}`);
        setMessages(msgRes.data.data || msgRes.data || []);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Could not delete message');
    }
  };



  const openMembersModal = async () => {
    if (!activeContact) return;
    setIsMembersModalOpen(true);
    setLoadingGroupMembers(true);
    try {
      const { default: apiClient } = await import('../../api/client');
      const response = await apiClient.get(`/chat/rooms/${activeContact.id}/members`);
      setGroupMembersData(response.data);
    } catch (error) {
      console.error('Failed to fetch group members', error);
      setGroupMembersData(null);
    } finally {
      setLoadingGroupMembers(false);
    }
  };

  const handleStartCall = async (type: 'voice' | 'video') => {
    if (isParent) {
      alert('🔒 Direct Calling Restricted:\n\nParents can communicate with teachers via text messaging and attachments. Voice and video calls can only be initiated by Teachers and School Admin.');
      return;
    }
    if (!activeContact) {
      alert('Please select a chat channel first');
      return;
    }
    setActiveCallType(type);
    setCallStatus('ringing');
    setCallElapsedSeconds(0);
    setIsMuted(false);
    setIsVideoOff(false);
    playRingtone();

    const callerName = currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''} (${currentUser.role || 'Staff'})` : 'School Admin';

    try {
      const { default: apiClient } = await import('../../api/client');
      const callMsg = `📞 [LIVE ${type.toUpperCase()} CALL STARTED]\n👤 Initiated by: ${callerName}\n🔔 Ringing all members of ${activeContact.name}... Click to Join!`;
      await apiClient.post('/chat/messages', {
        room_id: activeContact.id,
        message: callMsg
      });
      fetchRooms();
    } catch (e) {
      console.warn('Call alert message notice:', e);
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true
        });
        setLocalStream(stream);

        // Initiate WebRTC Offer
        const pc = createPeerConnection(stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const myId = currentUser.id || currentUser.user_id || 'me';
        await sendSignalingMessage(`[WEBRTC_OFFER:${myId}] ${JSON.stringify(offer)}`);
      }
    } catch (err: any) {
      console.warn('Browser camera/mic access notice:', err);
    }

    setTimeout(() => {
      stopRingtone();
      setCallStatus('connected');
    }, 2000);
  };

  const handleJoinCall = async (type: 'voice' | 'video') => {
    if (!activeContact) return;

    setActiveCallType(type);
    setCallStatus('connected');
    setCallElapsedSeconds(0);
    setIsMuted(false);
    setIsVideoOff(false);

    const participantName = currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : 'User';

    try {
      const { default: apiClient } = await import('../../api/client');
      await apiClient.post('/chat/messages', {
        room_id: activeContact.id,
        message: `🟢 [CALL JOINED] ${participantName} joined the ongoing call.`
      });
      fetchRooms();
    } catch (e) {
      console.warn('Call join event notice:', e);
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true
        });
        setLocalStream(stream);

        // Initiate WebRTC Offer on Join
        const pc = createPeerConnection(stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const myId = currentUser.id || currentUser.user_id || 'me';
        await sendSignalingMessage(`[WEBRTC_OFFER:${myId}] ${JSON.stringify(offer)}`);
      }
    } catch (err: any) {
      console.warn('Browser camera/mic access notice:', err);
    }
  };

  const handleEndCall = async () => {
    stopRingtone();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);

    const durationSecs = callElapsedSeconds;
    const mins = Math.floor(durationSecs / 60);
    const secs = durationSecs % 60;
    const durationFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} mins`;

    const callerName = currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''} (${currentUser.role || 'Staff'})` : 'School Admin';

    let participantsText = '❌ No one joined';
    if (callStatus === 'connected' && durationSecs > 0) {
      participantsText = `👥 Connected: ${callerName}`;
    }

    const summaryCardMsg = `📋 [CALL HISTORY - ${activeCallType === 'video' ? 'VIDEO CALL' : 'VOICE CALL'}]\n👤 Call Ended By: ${callerName}\n⏱️ Call Duration: ${durationFormatted}\n${participantsText}`;

    const currentRoomId = activeContact?.id;

    setActiveCallType(null);
    setCallStatus('ended');
    setCallElapsedSeconds(0);

    // Save Call History Summary Card in DB
    if (currentRoomId) {
      try {
        const { default: apiClient } = await import('../../api/client');
        await apiClient.post('/chat/messages', {
          room_id: currentRoomId,
          message: summaryCardMsg
        });
        fetchRooms();
        const msgRes = await apiClient.get(`/chat/messages/${currentRoomId}`);
        setMessages(msgRes.data.data || msgRes.data || []);
      } catch (e) {
        console.error('Failed to save call history card:', e);
      }
    }
  };

  const toggleMuteMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideoCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  useEffect(() => {
    if (videoRef.current && localStream && activeCallType === 'video') {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCallType, isVideoOff]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCallType]);

  const insertQuickTemplate = (prefix: string) => {
    setNewMessage(prev => `${prefix}${prev}`);
  };

  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chat-portal-wrapper">
      <div className="dashboard-layout">
        <SmartSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10, height: '100vh', padding: '1.5rem 2.5rem', display: 'flex', flexDirection: 'column' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: '#1E293B', border: '1px solid #E2E8F0', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.75rem' }}>
                <MessageSquare color="#4F46E5" size={28} />
                Messaging Portal
              </h1>
              <p className="date-text" style={{ margin: 0, fontSize: '0.9rem' }}>
                Class-Specific Updates, Homework & Staff/Teacher Direct Communication
              </p>
            </div>
          </div>

          {/* Privacy Policy Pill */}
          <div style={{ background: '#EEF2FF', color: '#4F46E5', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.825rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #C7D2FE' }}>
            <ShieldAlert size={16} />
            Class-Isolated • Parent ↔ Teacher & Staff Only
          </div>
        </div>

        {/* Chat Layout Container */}
        <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
          
          {/* Left Sidebar Contacts */}
          <div style={{ width: '320px', background: 'white', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Header Search & Actions */}
            <div style={{ padding: '1.25rem 1rem 0.75rem 1rem', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search chats..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.3rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '0.875rem', outline: 'none', background: '#F8FAFC' }}
                />
              </div>

              {isTeacherOrAdmin && (
                <button 
                  className="btn-primary" 
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#0D9488', border: 'none' }}
                  title="Create Group"
                >
                  <Users size={15} /> Group
                </button>
              )}

              <button 
                className="btn-primary" 
                onClick={openNewChatModal} 
                style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#4F46E5' }} 
                title="New 1-on-1 Chat"
              >
                <Plus size={18} />
              </button>
            </div>
            
            {/* Contacts Scroll List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredContacts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>No recent chats found.</div>
              ) : filteredContacts.map(contact => (
                <div 
                  key={contact.id} 
                  onClick={() => handleSelectContact(contact)}
                  style={{ 
                    padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', cursor: 'pointer',
                    background: activeContact?.id === contact.id ? '#EEF2FF' : 'transparent',
                    borderBottom: '1px solid #F1F5F9',
                    borderLeft: activeContact?.id === contact.id ? '4px solid #4F46E5' : '4px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: contact.name?.includes('Group') ? 'linear-gradient(135deg, #0D9488, #059669)' : 'linear-gradient(135deg, #4F46E5, #8B5CF6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {contact.name?.includes('Group') ? <Users size={20} /> : contact.name?.charAt(0) || 'C'}
                    </div>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem', fontWeight: 600 }}>{contact.name || 'Chat Channel'}</h4>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8', flexShrink: 0 }}>
                        {contact.last_message_time ? new Date(contact.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact.last_message || 'Start chatting...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Main Chat Window */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', height: '100%' }}>
            
            {activeContact ? (
              <>
                {/* Chat Header */}
                <div style={{ height: '65px', padding: '0 1.5rem', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: activeContact.name?.includes('Group') ? 'linear-gradient(135deg, #0D9488, #059669)' : 'linear-gradient(135deg, #4F46E5, #8B5CF6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {activeContact.name?.includes('Group') ? <Users size={20} /> : activeContact.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: '#0F172A', fontSize: '1.05rem', fontWeight: 700 }}>{activeContact.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: '#0D9488', fontWeight: 600 }}>
                        {activeContact.name?.includes('Group') ? '👥 Class Group • Auto-synced Members & Parents' : 'Direct Conversation'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {activeContact.name?.includes('Group') && (
                      <button 
                        onClick={openMembersModal}
                        style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '0.4rem 0.85rem', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        title="View Group Members"
                      >
                        <Users size={16} /> View Group Members
                      </button>
                    )}
                    <button style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="More"><MoreVertical size={18} /></button>
                  </div>
                </div>

                {/* Messages Area */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: 'auto', marginBottom: 'auto', fontSize: '0.95rem' }}>
                      👋 Send a note, detail, or message in {activeContact.name}.
                    </div>
                  ) : (
                    messages.map((msg: any) => {
                      const currentUserId = currentUser.id || currentUser.user_id;
                      const isMe = msg.sender_id === currentUserId || msg.sender_id === 'me';
                      const isMenuOpen = activeMsgMenuId === msg.id;
                      const isEditing = editingMsgId === msg.id;

                      const msgContent = msg.message || msg.text || '';
                      if (msgContent.startsWith('[WEBRTC_')) {
                        return null;
                      }
                      const isLiveCallMsg = msgContent.includes('[LIVE');
                      const isCallHistoryMsg = msgContent.includes('[CALL HISTORY');
                      const isSystemCard = msgContent.includes('[HOMEWORK ASSIGNMENT]') || 
                                           msgContent.includes('[ANNOUNCEMENT]') || 
                                           isLiveCallMsg ||
                                           isCallHistoryMsg ||
                                           msgContent.includes('[CLASS NOTE]');

                      const msgTime = new Date(msg.created_at || Date.now()).getTime();
                      const diffMinutes = (Date.now() - msgTime) / (1000 * 60);
                      const isWithin5Mins = diffMinutes <= 5;

                      const canEdit = (isMe || isTeacherOrAdmin) && !isSystemCard && isWithin5Mins;
                      const canDeleteEveryone = (isMe || isTeacherOrAdmin) && isWithin5Mins;

                      // Hide if user deleted message for me
                      if (msg.deleted_for_users && Array.isArray(msg.deleted_for_users) && msg.deleted_for_users.includes(currentUserId)) {
                        return null;
                      }

                      return (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}>
                          {!isMe && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px', paddingLeft: '4px' }}>
                              {msg.first_name ? `${msg.first_name} ${msg.last_name || ''} (${msg.role || 'User'})` : 'User'}
                            </span>
                          )}

                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', maxWidth: '75%', margin: '0.25rem 0' }}>
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #4F46E5', outline: 'none', fontSize: '0.9rem' }}
                                autoFocus
                              />
                              <button onClick={() => handleEditMessage(msg.id)} style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                              <button onClick={() => setEditingMsgId(null)} style={{ background: '#E2E8F0', color: '#334155', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                              <div style={{ 
                                background: msg.is_deleted_for_everyone ? '#F1F5F9' : isMe ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : 'white', 
                                color: msg.is_deleted_for_everyone ? '#94A3B8' : isMe ? 'white' : '#0F172A', 
                                fontStyle: msg.is_deleted_for_everyone ? 'italic' : 'normal',
                                padding: '0.75rem 1.25rem', 
                                borderRadius: isMe ? '1.25rem 1.25rem 0 1.25rem' : '1.25rem 1.25rem 1.25rem 0',
                                maxWidth: '75%',
                                boxShadow: isMe ? '0 4px 12px rgba(79, 70, 229, 0.25)' : '0 2px 8px rgba(0,0,0,0.05)',
                                border: isMe ? 'none' : '1px solid #E2E8F0',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-line',
                                wordBreak: 'break-word',
                                position: 'relative'
                              }}>
                                {isLiveCallMsg ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.2rem 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: isMe ? '#A7F3D0' : '#059669', fontSize: '0.95rem' }}>
                                      <BellRing size={18} />
                                      <span>LIVE CALL RINGING IN CHANNEL</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.45', whiteSpace: 'pre-line' }}>
                                      {msgContent}
                                    </div>
                                    <button
                                      onClick={() => handleJoinCall(msgContent.includes('VOICE') ? 'voice' : 'video')}
                                      style={{
                                        marginTop: '0.5rem',
                                        padding: '0.7rem 1.25rem',
                                        borderRadius: '0.75rem',
                                        background: 'linear-gradient(135deg, #10B981, #059669)',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '0.95rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)'
                                      }}
                                    >
                                      <PhoneCall size={18} /> 🟢 JOIN LIVE CALL NOW
                                    </button>
                                  </div>
                                ) : isCallHistoryMsg ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.2rem 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: isMe ? '#E0E7FF' : '#4F46E5', fontSize: '0.95rem' }}>
                                      <Phone size={18} />
                                      <span>CALL HISTORY RECORD</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.45', whiteSpace: 'pre-line' }}>
                                      {msgContent}
                                    </div>
                                    <button
                                      onClick={() => handleJoinCall(msgContent.includes('VOICE') ? 'voice' : 'video')}
                                      style={{
                                        marginTop: '0.5rem',
                                        padding: '0.6rem 1.1rem',
                                        borderRadius: '0.65rem',
                                        background: isMe ? 'rgba(255, 255, 255, 0.2)' : '#EEF2FF',
                                        color: isMe ? 'white' : '#4F46E5',
                                        fontWeight: 'bold',
                                        fontSize: '0.875rem',
                                        border: isMe ? '1px solid rgba(255,255,255,0.4)' : '1px solid #C7D2FE',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.45rem'
                                      }}
                                    >
                                      <PhoneCall size={16} /> 📞 RE-JOIN CALL
                                    </button>
                                  </div>
                                ) : (
                                  msg.message || msg.text
                                )}
                              </div>

                              {/* Three Dots Message Options Menu (Only for normal user chat messages) */}
                              {!msg.is_deleted_for_everyone && !isSystemCard && (
                                <div style={{ position: 'relative' }}>
                                  <button 
                                    onClick={() => setActiveMsgMenuId(isMenuOpen ? null : msg.id)}
                                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                                    title="Message Options"
                                  >
                                    <MoreVertical size={16} />
                                  </button>

                                  {isMenuOpen && (
                                    <div style={{ position: 'absolute', right: isMe ? '0' : 'auto', left: isMe ? 'auto' : '0', top: '100%', background: 'white', border: '1px solid #CBD5E1', borderRadius: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '175px', overflow: 'hidden', padding: '0.35rem 0' }}>
                                      {canEdit && (
                                        <button 
                                          onClick={() => {
                                            setEditingMsgId(msg.id);
                                            setEditingText(msg.message || '');
                                            setActiveMsgMenuId(null);
                                          }}
                                          style={{ width: '100%', padding: '0.55rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                          ✏️ Edit Message
                                        </button>
                                      )}

                                      {canDeleteEveryone && (
                                        <button 
                                          onClick={() => handleDeleteMessage(msg.id, 'everyone')}
                                          style={{ width: '100%', padding: '0.55rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                          🗑️ Delete for Everyone
                                        </button>
                                      )}

                                      <button 
                                        onClick={() => handleDeleteMessage(msg.id, 'me')}
                                        style={{ width: '100%', padding: '0.55rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                      >
                                        🙈 Delete for Me
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px', padding: '0 4px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {new Date(msg.created_at || msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.is_edited && <span style={{ fontStyle: 'italic', fontWeight: 600, color: '#6366F1' }}>(edited)</span>}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Share / Homework Bar */}
                {isTeacherOrAdmin && (
                  <div style={{ padding: '0.4rem 1.5rem', background: '#F1F5F9', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Quick Share:</span>
                    <button type="button" onClick={() => setIsHomeworkModalOpen(true)} style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '12px', padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#4F46E5', fontWeight: 600 }}>
                      <BookOpen size={13} color="#4F46E5" /> Give Homework
                    </button>
                    <button type="button" onClick={() => insertQuickTemplate('📝 [CLASS NOTE] ')} style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
                      <FileText size={13} color="#0D9488" /> Daily Note
                    </button>
                    <button type="button" onClick={() => insertQuickTemplate('📌 [ANNOUNCEMENT] ')} style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
                      <BellRing size={13} color="#EA580C" /> Announcement
                    </button>
                  </div>
                )}

                {/* Message Input Bar */}
                <div style={{ padding: '1rem 1.5rem', background: 'white', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a note, homework detail, or message..."
                      style={{ 
                        flex: 1, padding: '0.85rem 1.25rem', borderRadius: '2rem', 
                        border: '1px solid #E2E8F0', background: '#F8FAFC',
                        fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ borderRadius: '50%', width: '46px', height: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#4F46E5', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', flexShrink: 0 }}
                      disabled={!newMessage.trim()}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                <MessageSquare size={64} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
                <h3 style={{ margin: 0, color: '#334155' }}>No chat selected</h3>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Select a contact from the sidebar or click + to start a new chat.</p>
              </div>
            )}

          </div>
        </div>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2>New Chat (Class-Isolated)</h2>
              <button className="icon-btn" onClick={() => setIsNewChatModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#64748B" />
              </button>
            </div>
            
            <div style={{ padding: '1rem 0' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>
                {isParent ? 'Select Class Teacher or Principal to start a direct message:' : 'Select a student/parent in your class or staff member to start a chat:'}
              </p>
              {loadingStudents ? (
                 <div style={{ padding: '3rem', textAlign: 'center', color: '#4F46E5' }}>Loading contacts...</div>
              ) : studentsList.length === 0 ? (
                 <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>No contacts found in your assigned class.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {studentsList.map(contact => (
                    <div key={contact.id} 
                      onClick={() => startNewChat(contact)}
                      style={{ 
                        padding: '0.85rem 1rem', border: '1px solid #E2E8F0', borderRadius: '0.75rem', 
                        display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.2s',
                        background: '#FAFAFA'
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#4F46E5'; }}
                      onMouseOut={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: contact.contact_type === 'staff' ? 'linear-gradient(45deg, #0D9488, #4F46E5)' : 'linear-gradient(45deg, #4F46E5, #F97316)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold', flexShrink: 0 }}>
                         {contact.first_name?.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#0F172A', fontWeight: 600 }}>
                          {contact.first_name} {contact.last_name}
                        </h4>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                          {contact.contact_type === 'staff' || contact.role ? `Staff/Role: ${contact.role || 'Teacher'} ${contact.designation ? `(${contact.designation})` : ''}` : `Parent: ${contact.parent_name || 'N/A'} • Grade: ${contact.grade || 'N/A'}`}
                        </p>
                      </div>
                      <button className="btn-primary" style={{ padding: '0.5rem', borderRadius: '50%', background: '#4F46E5' }}>
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateGroupModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Create Class Group Chat</h2>
              <button className="icon-btn" onClick={() => setIsCreateGroupModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#64748B" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} style={{ padding: '1rem 0' }}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Select Target Class</label>
                <select
                  value={selectedTargetClass}
                  onChange={(e) => {
                    setSelectedTargetClass(e.target.value);
                    if (!newGroupName) {
                      setNewGroupName(`${e.target.value} Class Official Group`);
                    }
                  }}
                  className="input-field"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none', fontWeight: 600 }}
                >
                  <option value="Playgroup">Playgroup (1.5 - 2.5 yrs)</option>
                  <option value="Nursery">Nursery (2.5 - 3.5 yrs)</option>
                  <option value="Jr KG">Junior KG (3.5 - 4.5 yrs)</option>
                  <option value="Sr KG">Senior KG (4.5 - 6 yrs)</option>
                  <option value="Daycare">Daycare Services</option>
                  <option value="All Staff">All School Staff & Teachers</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Group Name</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={`e.g. ${selectedTargetClass} Class Official Group`} 
                  className="input-field"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }}
                  required
                />
              </div>

              {/* Automatic Member Allocation Notice */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.85rem 1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', color: '#166534', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>⚡</span>
                <div>
                  <strong>Automatic Member Addition:</strong>
                  <div>All admitted students, parents & class teachers of <strong>{selectedTargetClass}</strong> are automatically included in this group! All message history is permanently saved.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateGroupModalOpen(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#0D9488', padding: '0.6rem 1.25rem', borderRadius: '0.5rem' }}>Create Class Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Give Homework Modal */}
      {isHomeworkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen color="#4F46E5" size={24} /> Assign Homework
              </h2>
              <button className="icon-btn" onClick={() => setIsHomeworkModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#64748B" />
              </button>
            </div>
            <form onSubmit={handleAssignHomework} style={{ padding: '1rem 0' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Homework Title</label>
                <input 
                  type="text" 
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  placeholder="e.g. Alphabet Tracing & Practice Page 12" 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Instructions / Details</label>
                <textarea 
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  placeholder="Write clear instructions for parents and students..." 
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }}
                  required
                ></textarea>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Due Date</label>
                <input 
                  type="date" 
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsHomeworkModalOpen(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#4F46E5', padding: '0.6rem 1.25rem', borderRadius: '0.5rem' }}>Post Homework to Chat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Group Members Modal */}
      {isMembersModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', margin: 0 }}>
                <Users color="#0D9488" size={24} /> Group Members ({groupMembersData?.totalCount || groupMembersData?.members?.length || 0} Total)
              </h2>
              <button className="icon-btn" onClick={() => setIsMembersModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#64748B" />
              </button>
            </div>
            
            <p style={{ margin: '0.5rem 0 0.75rem 0', color: '#64748B', fontSize: '0.85rem' }}>
              {groupMembersData?.isMainBranch ? (
                <>🏛️ Auto-synced for <strong>{activeContact?.name}</strong> (<strong>Main Branch Head Office</strong>). <strong>Super Admin</strong> and <strong>Class Teacher</strong> are automatically assigned.</>
              ) : (
                <>🏫 Auto-synced for <strong>{activeContact?.name}</strong> (<strong>{groupMembersData?.schoolName || 'Franchise Branch'}</strong>). <strong>Franchise Admin</strong> and <strong>Class Teacher</strong> are assigned. (Super Admin is excluded from franchise groups).</>
              )}
            </p>

            {/* Leadership quick chips */}
            {groupMembersData && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {groupMembersData.isMainBranch ? (
                  <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '0.5rem', padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#C2410C', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>👑</span>
                    <span><strong>Super Admin (Main Branch):</strong> {groupMembersData.superAdmin ? `${groupMembersData.superAdmin.first_name} ${groupMembersData.superAdmin.last_name || ''}` : 'Super Admin'}</span>
                  </div>
                ) : (
                  <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '0.5rem', padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#6D28D9', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>🏫</span>
                    <span><strong>Franchise Admin:</strong> {groupMembersData.franchiseAdmin ? `${groupMembersData.franchiseAdmin.first_name} ${groupMembersData.franchiseAdmin.last_name || ''}` : 'Branch Admin'}</span>
                  </div>
                )}
                <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '0.5rem', padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>🎓</span>
                  <span><strong>Class Teacher:</strong> {groupMembersData.classTeacher ? `${groupMembersData.classTeacher.first_name} ${groupMembersData.classTeacher.last_name || ''}` : 'Class Teacher'}</span>
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
              {loadingGroupMembers ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>Loading group members...</div>
              ) : !groupMembersData?.members || groupMembersData.members.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No group members found.</div>
              ) : (
                groupMembersData.members.map((member: any) => {
                  const isSuperAdmin = member.role_type === 'super_admin';
                  const isSchoolAdmin = member.role_type === 'school_admin';
                  const isTeacher = member.role_type === 'teacher';
                  const avatarBg = isSuperAdmin ? '#EA580C' : isSchoolAdmin ? '#7C3AED' : isTeacher ? '#0D9488' : '#2563EB';

                  return (
                    <div 
                      key={`${member.role_type}-${member.id}`} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '0.7rem 0.85rem', 
                        background: isSuperAdmin ? '#FFF7ED' : isSchoolAdmin ? '#FAF5FF' : isTeacher ? '#F0FDFA' : '#F8FAFC', 
                        borderRadius: '0.75rem', 
                        border: `1px solid ${isSuperAdmin ? '#FED7AA' : isSchoolAdmin ? '#E9D5FF' : isTeacher ? '#CCFBF1' : '#E2E8F0'}` 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: avatarBg, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {member.first_name?.charAt(0) || 'M'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span>{member.first_name} {member.last_name || ''}</span>
                            {isSuperAdmin && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#FFEDD5', color: '#C2410C', padding: '0.15rem 0.45rem', borderRadius: '0.35rem' }}>
                                👑 Super Admin (Main Branch)
                              </span>
                            )}
                            {isSchoolAdmin && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#EDE9FE', color: '#6D28D9', padding: '0.15rem 0.45rem', borderRadius: '0.35rem' }}>
                                Franchise Admin
                              </span>
                            )}
                            {isTeacher && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#CCFBF1', color: '#0F766E', padding: '0.15rem 0.45rem', borderRadius: '0.35rem' }}>
                                Class Teacher
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isSuperAdmin ? (
                              `Head Office Super Admin • ${member.email || ''}`
                            ) : isSchoolAdmin ? (
                              `Branch Franchise Admin • ${member.email || ''}`
                            ) : isTeacher ? (
                              `Assigned Class Teacher • ${member.department || activeContact?.target_class || 'Staff'}`
                            ) : (
                              `Student (Grade: ${member.grade}) • Parent: ${member.parent_name || 'Registered'}`
                            )}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: member.badge_color || '#16A34A', background: member.badge_bg || '#DCFCE7', padding: '0.25rem 0.55rem', borderRadius: '0.5rem', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '0.5rem' }}>
                        {member.badge || 'Auto-Added'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}


      </main>
    </div>
    </div>
  );
};

export default ChatPortal;

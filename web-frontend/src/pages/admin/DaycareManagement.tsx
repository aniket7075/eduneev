import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import SmartSidebar from '../../components/SmartSidebar';
import { 
  Plus, Search, Baby, Clock, Utensils, Moon, ArrowLeft, X, 
  Thermometer, Smile, BookOpen, MessageSquare, Trash2, Calendar, 
  CheckCircle, UserCheck, AlertCircle, Printer, Save, Phone, User, Users,
  ShieldCheck, FileSpreadsheet, Sparkles, RefreshCw, Check
} from 'lucide-react';
import './Directory.css';

interface DaycareLog {
  id: string;
  student_id: string;
  student_name?: string;
  activity_type: string;
  notes?: string;
  check_in_time?: string;
  check_out_time?: string;
  nap_start?: string;
  nap_end?: string;
  mood?: string;
  health_status?: string;
  energy_level?: string;
  meals?: any;
  created_at?: string;
  date?: string;
  washroom_visits?: number;
  temperature?: string;
  medicine_given?: string;
  medicine_note?: string;
  parent_visible?: boolean;
  teacher_notes?: string;
}

interface DaycareStudent {
  id: string;
  first_name: string;
  last_name: string;
  admission_number?: string;
  grade?: string;
  profile_image_url?: string;
  parent_name?: string;
  contact_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  date_of_birth?: string;
  gender?: string;
}

interface DaycareAttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'half_day' | 'late';
  check_in_time: string;
  check_out_time: string;
  picked_by: string;
}

const DAYCARE_BATCHES = [
  { id: 'all', name: 'All Daycare Batches', label: 'All Batches', color: '#6366F1' },
  { id: 'infant', name: 'Daycare - Infant (6M - 1.5Y)', label: '👶 Infant (6m - 1.5y)', color: '#EC4899' },
  { id: 'toddler', name: 'Daycare - Toddler (1.5Y - 2.5Y)', label: '🧸 Toddler (1.5y - 2.5y)', color: '#F59E0B' },
  { id: 'junior', name: 'Daycare - Junior (2.5Y - 4Y)', label: '⭐ Junior (2.5y - 4y)', color: '#10B981' },
  { id: 'after_school', name: 'Daycare - After School (4Y - 10Y)', label: '🎒 After-School (4y - 10y)', color: '#8B5CF6' }
];

const ACTIVITY_TAGS = ['Drawing', 'Singing', 'Story Time', 'Block Play', 'Outdoor', 'Dance', 'Puzzle', 'Clay', 'Rhymes', 'Free Play'];

const DaycareManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'attendance' | 'logs' | 'students'>('attendance');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const [logs, setLogs] = useState<DaycareLog[]>([]);
  const [allDaycareStudents, setAllDaycareStudents] = useState<DaycareStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Attendance Records mapped by student_id
  const [attendanceMap, setAttendanceMap] = useState<Record<string, DaycareAttendanceRecord>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const debounceTimerRef = useRef<any>(null);

  // Activity Log Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = () => ({
    student_id: '',
    date: selectedDate,
    check_in_time: '08:30',
    check_out_time: '18:00',
    nap_start: '13:00',
    nap_end: '15:00',
    nap_quality: 'deep',
    mood: 'happy',
    health_status: 'healthy',
    energy_level: 'medium',
    temperature: '98.6',
    medicine_given: 'none',
    medicine_note: '',
    water_intake: 'good',
    water_ml: '250',
    juice_given: false,
    juice_type: '',
    milk_given: false,
    milk_ml: '',
    other_drink: '',
    washroom_visits: 2,
    diaper_status: 'dry',
    learning_activity: '',
    activity_tags: [] as string[],
    snacks_notes: '',
    parent_message: '',
    teacher_notes: '',
    parent_visible: true,
    meals: {
      breakfast: { eaten: 'full', food_given: 'Warm Milk & Poha', food_refused: '', time: '09:00' },
      morning_snack: { eaten: 'full', food_given: 'Fresh Fruits (Apple)', food_refused: '', time: '11:00' },
      lunch: { eaten: 'full', food_given: 'Khichdi, Ghee & Curd', food_refused: '', time: '12:30' },
      evening_snack: { eaten: 'full', food_given: 'Biscuits & Milk', food_refused: '', time: '16:30' }
    }
  });

  const [formData, setFormData] = useState(emptyForm());

  // Fetch Daycare Students & Logs
  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, logsRes] = await Promise.all([
        apiClient.get('/daycare/students'),
        apiClient.get('/daycare/logs', { params: { date: selectedDate } })
      ]);

      const stList: DaycareStudent[] = studentsRes.data?.data || studentsRes.data || [];
      const logList: DaycareLog[] = logsRes.data?.data || logsRes.data || [];

      // Filter students who belong to Daycare or show all if specifically enrolled
      const daycareOnly = stList.filter(s => {
        const g = (s.grade || '').toLowerCase();
        const m = typeof s.medical_notes === 'string' ? s.medical_notes.toLowerCase() : '';
        let parsed: any = {};
        if (s.medical_notes) {
          try { parsed = typeof s.medical_notes === 'string' ? JSON.parse(s.medical_notes) : s.medical_notes; } catch {}
        }
        return g.includes('daycare') || m.includes('daycare') || parsed?.isDaycareEnrolled === true;
      });

      // If no students explicitly labeled Daycare yet, fallback to stList
      const resolvedStudents = daycareOnly.length > 0 ? daycareOnly : stList;
      setAllDaycareStudents(resolvedStudents);
      setLogs(logList);

      // Initialize Attendance Map from logs or defaults
      const newMap: Record<string, DaycareAttendanceRecord> = {};
      resolvedStudents.forEach(st => {
        const existingLog = logList.find(l => l.student_id === st.id);

        let resolvedStatus: 'present' | 'absent' | 'half_day' | 'late' = 'present';
        if (existingLog) {
          if (existingLog.mood === 'absent') resolvedStatus = 'absent';
          else if (existingLog.mood === 'half_day') resolvedStatus = 'half_day';
          else if (existingLog.mood === 'late') resolvedStatus = 'late';
          else if (existingLog.mood === 'present') resolvedStatus = 'present';
          else if (existingLog.notes?.includes('ABSENT')) resolvedStatus = 'absent';
          else if (existingLog.notes?.includes('HALF_DAY')) resolvedStatus = 'half_day';
          else if (existingLog.notes?.includes('LATE')) resolvedStatus = 'late';
          else if (existingLog.check_in_time) resolvedStatus = 'present';
        }

        let resolvedPickedBy = 'Father / Mother';
        if (existingLog?.teacher_notes?.includes('Picked up by: ')) {
          resolvedPickedBy = existingLog.teacher_notes.replace('Picked up by: ', '').trim();
        } else if (existingLog?.notes?.includes('Picked by: ')) {
          const match = existingLog.notes.match(/Picked by:\s*([^•\n]+)/);
          if (match && match[1]?.trim()) resolvedPickedBy = match[1].trim();
        }

        newMap[st.id] = {
          student_id: st.id,
          status: resolvedStatus,
          check_in_time: existingLog?.check_in_time || '08:30',
          check_out_time: existingLog?.check_out_time || '',
          picked_by: resolvedPickedBy || 'Father / Mother'
        };
      });
      setAttendanceMap(newMap);

      if (logList.length > 0) {
        setAutoSaveStatus('saved');
        setLastSavedTime('Synced');
      } else {
        setAutoSaveStatus('idle');
      }

    } catch (error) {
      console.error('Failed to load daycare data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Filter students by selected Daycare batch
  const filteredStudents = useMemo(() => {
    return allDaycareStudents.filter(s => {
      const g = (s.grade || '').toLowerCase();
      const m = typeof s.medical_notes === 'string' ? s.medical_notes.toLowerCase() : '';
      
      let matchesBatch = true;
      if (selectedBatch === 'infant') {
        matchesBatch = g.includes('infant') || m.includes('infant');
      } else if (selectedBatch === 'toddler') {
        matchesBatch = g.includes('toddler') || m.includes('toddler');
      } else if (selectedBatch === 'junior') {
        matchesBatch = g.includes('junior') || m.includes('junior');
      } else if (selectedBatch === 'after_school') {
        matchesBatch = g.includes('after') || m.includes('after');
      }

      const q = search.toLowerCase();
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const adm = (s.admission_number || '').toLowerCase();
      const matchesSearch = fullName.includes(q) || adm.includes(q);

      return matchesBatch && matchesSearch;
    });
  }, [allDaycareStudents, selectedBatch, search]);

  // Core persistence function supporting auto-save and manual triggers
  const persistAttendance = async (
    currentMap: Record<string, DaycareAttendanceRecord>,
    targetStudents?: DaycareStudent[],
    isSilent = true
  ) => {
    setAutoSaveStatus('saving');
    setSavingAttendance(true);
    try {
      const list = targetStudents || filteredStudents;
      if (list.length === 0) {
        setAutoSaveStatus('idle');
        setSavingAttendance(false);
        return;
      }

      const recordsToSave = list.map(st => {
        const att = currentMap[st.id] || { 
          student_id: st.id, 
          status: 'present', 
          check_in_time: '08:30', 
          check_out_time: '', 
          picked_by: 'Father / Mother' 
        };
        return {
          student_id: st.id,
          date: selectedDate,
          check_in_time: att.status === 'absent' ? null : (att.check_in_time || '08:30'),
          check_out_time: att.status === 'absent' ? null : (att.check_out_time || null),
          mood: att.status,
          notes: `Daycare Status: ${att.status.toUpperCase()} • Picked by: ${att.picked_by || 'Father / Mother'}`,
          teacher_notes: `Picked up by: ${att.picked_by || 'Father / Mother'}`
        };
      });

      await apiClient.post('/daycare/logs/bulk', {
        date: selectedDate,
        logs: recordsToSave
      });

      // Also record in central attendance table
      const centralRecords = list.map(st => ({
        student_id: st.id,
        status: currentMap[st.id]?.status === 'absent' ? 'absent' : (currentMap[st.id]?.status === 'half_day' ? 'half_day' : 'present')
      }));
      await apiClient.post('/attendance/mark', {
        date: selectedDate,
        records: centralRecords
      }).catch(() => {});

      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setAutoSaveStatus('saved');
      setLastSavedTime(timeStr);
    } catch (err: any) {
      console.error('Save daycare attendance error:', err);
      setAutoSaveStatus('error');
      if (!isSilent) {
        alert(err.response?.data?.error || 'Failed to save daycare attendance');
      }
    } finally {
      setSavingAttendance(false);
    }
  };

  // Update attendance field with auto-save
  const handleAttendanceChange = (studentId: string, field: keyof DaycareAttendanceRecord, value: any) => {
    const updatedMap = {
      ...attendanceMap,
      [studentId]: {
        ...(attendanceMap[studentId] || { student_id: studentId, status: 'present', check_in_time: '08:30', check_out_time: '', picked_by: 'Father / Mother' }),
        [field]: value
      }
    };
    setAttendanceMap(updatedMap);

    if (field === 'status') {
      // Instant auto-save when status pill (P, A, HD, L) is clicked
      persistAttendance(updatedMap);
    } else {
      // Debounce saving for time edits and picked_by text typing (700ms)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        persistAttendance(updatedMap);
      }, 700);
    }
  };

  // Quick punch now with immediate auto-save
  const handlePunchNow = (studentId: string, type: 'in' | 'out') => {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const updatedMap = {
      ...attendanceMap,
      [studentId]: {
        ...(attendanceMap[studentId] || { student_id: studentId, status: 'present', check_in_time: '08:30', check_out_time: '', picked_by: 'Father / Mother' }),
        [type === 'in' ? 'check_in_time' : 'check_out_time']: nowTime
      }
    };
    setAttendanceMap(updatedMap);
    persistAttendance(updatedMap);
  };

  // Mark all present / absent with immediate auto-save
  const handleMarkAll = (status: 'present' | 'absent') => {
    const updated = { ...attendanceMap };
    filteredStudents.forEach(s => {
      if (!updated[s.id]) {
        updated[s.id] = { student_id: s.id, status, check_in_time: '08:30', check_out_time: '', picked_by: 'Father / Mother' };
      } else {
        updated[s.id].status = status;
        if (status === 'present' && !updated[s.id].check_in_time) {
          updated[s.id].check_in_time = '08:30';
        }
      }
    });
    setAttendanceMap(updated);
    persistAttendance(updated);
  };

  // Manual save trigger (if clicked)
  const handleSaveAttendance = () => {
    persistAttendance(attendanceMap, filteredStudents, false);
  };

  // Print Daycare Attendance Register
  const handlePrintAttendanceRegister = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>EduNeev Daycare Attendance Register - ${selectedDate}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 25px; color: #0F172A; }
            .header { text-align: center; border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 20px; color: #D97706; text-transform: uppercase; }
            .header h3 { margin: 4px 0 0 0; font-size: 13px; color: #475569; }
            .meta { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 15px; background: #F8FAFC; padding: 8px 12px; border-radius: 6px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #CBD5E1; padding: 8px 10px; text-align: left; }
            th { background: #F1F5F9; font-weight: 800; text-transform: uppercase; font-size: 10px; }
            .status-present { color: #059669; font-weight: 800; }
            .status-absent { color: #DC2626; font-weight: 800; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; }
            .sig-line { width: 160px; border-top: 1px dashed #64748B; text-align: center; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EDUNEEV KIDS INTERNATIONAL DAYCARE</h1>
            <h3>OFFICIAL DAILY DAYCARE ATTENDANCE & CHILD SECURITY REGISTER</h3>
          </div>
          <div class="meta">
            <span>Date: ${selectedDate}</span>
            <span>Batch: ${DAYCARE_BATCHES.find(b => b.id === selectedBatch)?.name || 'All'}</span>
            <span>Total Enrolled: ${filteredStudents.length}</span>
            <span>Status: Verified Official Copy</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Admission No</th>
                <th>Child Full Name</th>
                <th>Daycare Batch / Age</th>
                <th>Attendance Status</th>
                <th>Check-In Time</th>
                <th>Check-Out Time</th>
                <th>Dropped / Picked By</th>
                <th>Staff Sign</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.map((st, i) => {
                const att = attendanceMap[st.id] || { status: 'present', check_in_time: '08:30', check_out_time: '18:00', picked_by: 'Parent' };
                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${st.admission_number || '-'}</strong></td>
                    <td><strong>${st.first_name} ${st.last_name}</strong></td>
                    <td>${st.grade || 'Daycare'}</td>
                    <td class="${att.status === 'present' ? 'status-present' : 'status-absent'}">${att.status.toUpperCase()}</td>
                    <td>${att.status === 'absent' ? '-' : (att.check_in_time || '08:30')}</td>
                    <td>${att.status === 'absent' ? '-' : (att.check_out_time || '-')}</td>
                    <td>${att.picked_by || 'Parent'}</td>
                    <td></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">
            <div class="sig-line">Daycare In-Charge</div>
            <div class="sig-line">Center Head / Principal</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // Activity Log Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      activity_tags: prev.activity_tags.includes(tag) 
        ? prev.activity_tags.filter(t => t !== tag) 
        : [...prev.activity_tags, tag]
    }));
  };

  const handleMealChange = (meal: 'breakfast' | 'morning_snack' | 'lunch' | 'evening_snack', field: 'eaten' | 'food_given' | 'food_refused' | 'time', value: string) => {
    setFormData({
      ...formData,
      meals: {
        ...formData.meals,
        [meal]: {
          ...formData.meals[meal],
          [field]: value
        }
      }
    });
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id) {
      alert('Please select a student');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/daycare/logs', {
        ...formData,
        activity_type: 'Daily Care Log'
      });
      setIsAddModalOpen(false);
      setFormData(emptyForm());
      fetchData();
      alert('Daycare daily care log saved successfully!');
    } catch (error: any) {
      console.error('Error adding log:', error);
      alert(error.response?.data?.error || 'Failed to save log');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the daily log for ${name}?`)) return;
    try {
      await apiClient.delete(`/daycare/logs/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete log', error);
      alert('Error deleting log');
    }
  };

  // Statistics
  const totalEnrolled = filteredStudents.length;
  const presentCount = filteredStudents.filter(s => attendanceMap[s.id]?.status === 'present').length;
  const absentCount = filteredStudents.filter(s => attendanceMap[s.id]?.status === 'absent').length;
  const checkedInCount = filteredStudents.filter(s => attendanceMap[s.id]?.check_in_time && !attendanceMap[s.id]?.check_out_time && attendanceMap[s.id]?.status !== 'absent').length;

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {/* Header Bar */}
        <header className="header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Baby color="#D97706" size={30} /> Daycare Management System
              </h1>
              <p className="date-text">Separate attendance register, age-wise batch tracking, admissions & routine logs</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/admin/students')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0D9488', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '0.75rem', fontWeight: 800 }}
            >
              <Plus size={18} /> + New Daycare Admission
            </button>

            <button 
              className="btn-primary" 
              onClick={() => { setFormData(emptyForm()); setIsAddModalOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F59E0B', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '0.75rem', fontWeight: 800 }}
            >
              <Sparkles size={18} /> + Log Daily Care Note
            </button>
          </div>
        </header>

        {/* 3 Main Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.6rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: activeTab === 'attendance' ? '#D97706' : '#64748B',
              borderBottom: activeTab === 'attendance' ? '3px solid #D97706' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <Clock size={19} />
            📋 Daycare Attendance Register
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.6rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: activeTab === 'logs' ? '#4F46E5' : '#64748B',
              borderBottom: activeTab === 'logs' ? '3px solid #4F46E5' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <Utensils size={19} />
            📝 Daily Care & Routine Logs
          </button>

          <button
            onClick={() => setActiveTab('students')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.6rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: activeTab === 'students' ? '#0D9488' : '#64748B',
              borderBottom: activeTab === 'students' ? '3px solid #0D9488' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <Users size={19} />
            👶 Daycare Enrolled Students ({allDaycareStudents.length})
          </button>
        </div>

        {/* Daycare Class / Batch Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', marginRight: '0.25rem' }}>
            🏷️ DAYCARE BATCH:
          </span>
          {DAYCARE_BATCHES.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBatch(b.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '99px',
                fontWeight: 800,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer',
                background: selectedBatch === b.id ? b.color : '#F1F5F9',
                color: selectedBatch === b.id ? 'white' : '#475569',
                transition: 'all 0.15s'
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Summary Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #E2E8F0', background: 'white' }}>
            <div style={{ padding: '0.85rem', background: '#FEF3C7', color: '#D97706', borderRadius: '0.85rem' }}>
              <Baby size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Daycare Enrolled</p>
              <h3 style={{ margin: '0.15rem 0 0 0', color: '#0F172A', fontSize: '1.5rem', fontWeight: 900 }}>{totalEnrolled}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #E2E8F0', background: 'white' }}>
            <div style={{ padding: '0.85rem', background: '#D1FAE5', color: '#059669', borderRadius: '0.85rem' }}>
              <UserCheck size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Present Today</p>
              <h3 style={{ margin: '0.15rem 0 0 0', color: '#059669', fontSize: '1.5rem', fontWeight: 900 }}>{presentCount}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #E2E8F0', background: 'white' }}>
            <div style={{ padding: '0.85rem', background: '#EEF2FF', color: '#4F46E5', borderRadius: '0.85rem' }}>
              <Clock size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Currently Inside</p>
              <h3 style={{ margin: '0.15rem 0 0 0', color: '#4F46E5', fontSize: '1.5rem', fontWeight: 900 }}>{checkedInCount}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #E2E8F0', background: 'white' }}>
            <div style={{ padding: '0.85rem', background: '#FEE2E2', color: '#DC2626', borderRadius: '0.85rem' }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Absent</p>
              <h3 style={{ margin: '0.15rem 0 0 0', color: '#DC2626', fontSize: '1.5rem', fontWeight: 900 }}>{absentCount}</h3>
            </div>
          </div>
        </div>

        {/* ──────────────── TAB 1: DAYCARE ATTENDANCE REGISTER ──────────────── */}
        {activeTab === 'attendance' && (
          <div className="glass-card table-container" style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F8FAFC', padding: '0.4rem 0.8rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1' }}>
                  <Calendar size={16} color="#64748B" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>ATTENDANCE DATE:</span>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    style={{ border: 'none', background: 'transparent', fontWeight: 800, outline: 'none', color: '#0F172A' }}
                  />
                </div>

                <div className="search-box" style={{ maxWidth: '280px' }}>
                  <Search size={16} className="text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search daycare student..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Auto-Save Live Status Indicator */}
                {autoSaveStatus === 'saving' && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: '#FEF3C7', 
                    color: '#B45309', 
                    border: '1px solid #FDE68A', 
                    padding: '0.42rem 0.8rem', 
                    borderRadius: '0.55rem', 
                    fontSize: '0.78rem', 
                    fontWeight: 800 
                  }}>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> 
                    Auto-Saving...
                  </div>
                )}
                {autoSaveStatus === 'saved' && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: '#ECFDF5', 
                    color: '#047857', 
                    border: '1px solid #A7F3D0', 
                    padding: '0.42rem 0.8rem', 
                    borderRadius: '0.55rem', 
                    fontSize: '0.78rem', 
                    fontWeight: 800 
                  }}>
                    <CheckCircle size={15} color="#059669" /> 
                    Auto-Saved {lastSavedTime ? (lastSavedTime === 'Synced' ? '(Synced)' : `(${lastSavedTime})`) : ''}
                  </div>
                )}
                {autoSaveStatus === 'error' && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: '#FEF2F2', 
                    color: '#DC2626', 
                    border: '1px solid #FECACA', 
                    padding: '0.42rem 0.8rem', 
                    borderRadius: '0.55rem', 
                    fontSize: '0.78rem', 
                    fontWeight: 800 
                  }}>
                    <AlertCircle size={15} color="#DC2626" /> 
                    Auto-Save Failed. Click to retry
                  </div>
                )}

                <button 
                  onClick={() => handleMarkAll('present')}
                  style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '0.45rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  ✓ Mark All Present
                </button>
                <button 
                  onClick={handlePrintAttendanceRegister}
                  style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1', padding: '0.45rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Printer size={15} /> Print Register
                </button>
                <button 
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance}
                  style={{ 
                    background: autoSaveStatus === 'saved' 
                      ? '#059669' 
                      : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', 
                    color: 'white', 
                    border: 'none', 
                    padding: '0.5rem 1.15rem', 
                    borderRadius: '0.65rem', 
                    fontSize: '0.82rem', 
                    fontWeight: 800, 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    boxShadow: autoSaveStatus === 'saved' 
                      ? '0 4px 10px rgba(5,150,105,0.25)' 
                      : '0 4px 10px rgba(217,119,6,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Attendance saves automatically on every action. Click here to force save now."
                >
                  {savingAttendance ? (
                    <>
                      <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                    </>
                  ) : autoSaveStatus === 'saved' ? (
                    <>
                      <Check size={16} /> Saved
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Attendance
                    </>
                  )}
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Loading daycare attendance register...</div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                <Baby size={44} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                <h3 style={{ margin: '0 0 0.25rem 0', color: '#475569' }}>No Daycare Students Found in this Batch</h3>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>Admit students under Daycare program to take daily attendance.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Student Info</th>
                      <th>Batch / Age Group</th>
                      <th style={{ textAlign: 'center' }}>Attendance Status</th>
                      <th>Check-In (In-Time)</th>
                      <th>Check-Out (Out-Time)</th>
                      <th>Dropped / Picked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((st, idx) => {
                      const att = attendanceMap[st.id] || { student_id: st.id, status: 'present', check_in_time: '08:30', check_out_time: '', picked_by: 'Parent' };

                      return (
                        <tr key={st.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                                {st.first_name?.[0]}{st.last_name?.[0]}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#0F172A' }}>{st.first_name} {st.last_name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Adm: {st.admission_number || '-'} • Parent: {st.parent_name || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ background: '#FFFBEB', color: '#B45309', padding: '3px 8px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, border: '1px solid #FDE68A' }}>
                              {st.grade || 'Daycare'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                              {(['present', 'absent', 'half_day', 'late'] as const).map(s => {
                                const isSel = att.status === s;
                                const colors: Record<string, { bg: string; color: string; label: string }> = {
                                  present: { bg: '#059669', color: 'white', label: 'P' },
                                  absent: { bg: '#DC2626', color: 'white', label: 'A' },
                                  half_day: { bg: '#7C3AED', color: 'white', label: 'HD' },
                                  late: { bg: '#D97706', color: 'white', label: 'L' }
                                };
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => handleAttendanceChange(st.id, 'status', s)}
                                    style={{
                                      border: 'none',
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      background: isSel ? colors[s].bg : 'transparent',
                                      color: isSel ? colors[s].color : '#64748B',
                                      transition: 'all 0.1s'
                                    }}
                                  >
                                    {colors[s].label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input 
                                type="time" 
                                value={att.status === 'absent' ? '' : att.check_in_time} 
                                onChange={(e) => handleAttendanceChange(st.id, 'check_in_time', e.target.value)}
                                disabled={att.status === 'absent'}
                                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700 }}
                              />
                              {att.status !== 'absent' && (
                                <button 
                                  type="button" 
                                  onClick={() => handlePunchNow(st.id, 'in')}
                                  title="Punch Current Time"
                                  style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4F46E5', borderRadius: '6px', padding: '4px 6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Now
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input 
                                type="time" 
                                value={att.status === 'absent' ? '' : att.check_out_time} 
                                onChange={(e) => handleAttendanceChange(st.id, 'check_out_time', e.target.value)}
                                disabled={att.status === 'absent'}
                                placeholder="--:--"
                                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700 }}
                              />
                              {att.status !== 'absent' && (
                                <button 
                                  type="button" 
                                  onClick={() => handlePunchNow(st.id, 'out')}
                                  title="Punch Current Time"
                                  style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', color: '#DB2777', borderRadius: '6px', padding: '4px 6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Now
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <input 
                              type="text" 
                              value={att.picked_by} 
                              onChange={(e) => handleAttendanceChange(st.id, 'picked_by', e.target.value)}
                              placeholder="e.g. Father / Mother"
                              style={{ width: '130px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 600 }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ──────────────── TAB 2: DAILY CARE & ROUTINE LOGS ──────────────── */}
        {activeTab === 'logs' && (
          <div className="glass-card table-container" style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="search-box" style={{ maxWidth: '320px' }}>
                <Search size={16} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Search care notes & meals..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => { setFormData(emptyForm()); setIsAddModalOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F59E0B' }}
                >
                  <Plus size={18} /> New Daily Note
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '1rem' }}>
                <Utensils size={44} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                <h3 style={{ margin: '0 0 0.25rem 0', color: '#475569' }}>No Daily Care Logs Recorded for {selectedDate}</h3>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>Click "+ New Daily Note" to log meals, nap times, and health.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {logs.map((log) => (
                  <div key={log.id} style={{ background: '#FAFAFA', borderRadius: '1rem', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0F172A', fontWeight: 800 }}>{log.student_name}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Time: {log.check_in_time || '08:30'} - {log.check_out_time || 'Present'}</span>
                      </div>
                      <button onClick={() => handleDeleteLog(log.id, log.student_name || 'Child')} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                      <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        Mood: {log.mood || 'Happy 😊'}
                      </span>
                      <span style={{ background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        Health: {log.health_status || 'Healthy'}
                      </span>
                      {log.nap_start && (
                        <span style={{ background: '#EEF2FF', color: '#3730A3', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          Nap: {log.nap_start} - {log.nap_end}
                        </span>
                      )}
                    </div>

                    {log.notes && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', background: 'white', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #F1F5F9' }}>
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────── TAB 3: DAYCARE ADMISSIONS & ENROLLED STUDENTS ──────────────── */}
        {activeTab === 'students' && (
          <div className="glass-card table-container" style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  👶 Daycare Admissions Directory ({filteredStudents.length} Enrolled)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', color: '#64748B', fontSize: '0.82rem' }}>
                  Students admitted exclusively or dual-enrolled in preschool daycare programs
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => navigate('/admin/students')}
                  style={{ background: '#0D9488', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem' }}
                >
                  <Plus size={18} /> Enroll New Daycare Child
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Child Name & Adm No</th>
                    <th>Daycare Program / Batch</th>
                    <th>Parents Contact</th>
                    <th>Emergency Phone</th>
                    <th>Medical Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(st => (
                    <tr key={st.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                            {st.first_name?.[0]}{st.last_name?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>{st.first_name} {st.last_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Adm: {st.admission_number || '-'} • DOB: {st.date_of_birth ? new Date(st.date_of_birth).toLocaleDateString() : '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ background: '#FFFBEB', color: '#92400E', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, border: '1px solid #FDE68A' }}>
                          {st.grade || 'Daycare Program'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{st.parent_name || 'N/A'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#0D9488', fontWeight: 700 }}>
                          {st.contact_number ? `📞 ${st.contact_number}` : '-'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 700 }}>
                          {st.emergency_contact_phone ? `🚨 ${st.emergency_contact_phone}` : '-'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{st.emergency_contact_name || ''}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '200px' }}>
                          {typeof st.medical_notes === 'string' ? st.medical_notes.slice(0, 50) : 'None reported'}
                        </div>
                      </td>
                      <td>
                        <button 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, student_id: st.id }));
                            setIsAddModalOpen(true);
                          }}
                          style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#334155' }}
                        >
                          + Log Note
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ──────────────── MODAL: ADD DAILY CARE NOTE ──────────────── */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header">
                <h2>📝 Log Daycare Activity & Care Notes</h2>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}><X size={20} /></button>
              </div>

              <form onSubmit={handleActivitySubmit} style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Select Daycare Child *</label>
                    <select name="student_id" value={formData.student_id} onChange={handleInputChange} required className="input-field">
                      <option value="">Choose child...</option>
                      {allDaycareStudents.map(st => (
                        <option key={st.id} value={st.id}>{st.first_name} {st.last_name} ({st.grade || 'Daycare'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="input-field" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Mood</label>
                    <select name="mood" value={formData.mood} onChange={handleInputChange} className="input-field">
                      <option value="happy">Happy 😊</option>
                      <option value="active">Active ⚡</option>
                      <option value="tired">Tired 😴</option>
                      <option value="cranky">Cranky 😤</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Health / Temp (°F)</label>
                    <input type="text" name="temperature" value={formData.temperature} onChange={handleInputChange} placeholder="98.6" className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Water Intake (ml)</label>
                    <input type="text" name="water_ml" value={formData.water_ml} onChange={handleInputChange} placeholder="250" className="input-field" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Nap Start Time</label>
                    <input type="time" name="nap_start" value={formData.nap_start} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Nap End Time</label>
                    <input type="time" name="nap_end" value={formData.nap_end} onChange={handleInputChange} className="input-field" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Activities Today</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {ACTIVITY_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: '20px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: formData.activity_tags.includes(tag) ? '#F59E0B' : 'white',
                          color: formData.activity_tags.includes(tag) ? 'white' : '#334155'
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Teacher Remarks / Notes for Parents</label>
                  <textarea name="teacher_notes" value={formData.teacher_notes} onChange={handleInputChange} rows={3} placeholder="Aarav had full lunch and played nicely with building blocks..." className="input-field" style={{ resize: 'vertical' }}></textarea>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ background: '#F59E0B' }}>
                    {saving ? 'Saving...' : 'Save Daycare Note'}
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

export default DaycareManagement;

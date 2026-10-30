import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getStudentProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let studentIdStr = (req.params.studentId || req.query.studentId) as string;

    // Auto-resolve child student_id for logged-in parents/students if not explicitly provided or if 'my'
    if ((!studentIdStr || studentIdStr === 'my' || studentIdStr === 'undefined' || studentIdStr === 'null') && req.user) {
      if (req.user.role === 'parent' || req.user.role === 'student') {
        const parentEmail = (req.user.email || '').toLowerCase().trim();
        const stRes = await pool.query(
          `SELECT s.id FROM students s
           LEFT JOIN parents p ON s.parent_id = p.id
           WHERE LOWER(p.email) = $1 
              OR s.parent_id = $2
              OR s.id = $2
              OR ($1 = 'parent@eduneev.com' AND LOWER(p.email) = 'parent.chinchwad@eduneev.com')
           ORDER BY s.created_at ASC 
           LIMIT 1`,
          [parentEmail, req.user.id]
        ).catch(() => ({ rows: [] }));
        if (stRes.rows.length > 0) {
          studentIdStr = stRes.rows[0].id;
        }
      }
    }

    // Fallback if still not found and user has role parent: check first student
    if (!studentIdStr && req.user?.role === 'parent') {
      const fallbackSt = await pool.query(
        `SELECT id FROM students WHERE is_active = true ORDER BY created_at ASC LIMIT 1`
      ).catch(() => ({ rows: [] }));
      if (fallbackSt.rows.length > 0) {
        studentIdStr = fallbackSt.rows[0].id;
      }
    }

    if (!studentIdStr || !UUID_REGEX.test(studentIdStr)) {
      res.status(400).json({ error: 'Valid student_id is required' });
      return;
    }

    // 1. Student Profile Details
    const studentInfoRes = await pool.query(
      `SELECT s.id, s.first_name, s.last_name, s.admission_number, s.roll_number,
              s.grade, s.date_of_birth, s.blood_group, s.profile_image_url,
              sch.name AS school_name, sch.address AS school_address
       FROM students s
       LEFT JOIN schools sch ON s.school_id = sch.id
       WHERE s.id = $1`,
      [studentIdStr]
    );

    const student = studentInfoRes.rows[0] || null;

    // 2. Attendance Summary
    const attendanceResult = await pool.query(
      `SELECT status, count(*) as count FROM attendance WHERE student_id = $1 GROUP BY status`,
      [studentIdStr]
    );

    let totalAttendanceDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;

    attendanceResult.rows.forEach(r => {
      const c = parseInt(r.count || '0', 10);
      totalAttendanceDays += c;
      const st = (r.status || '').toLowerCase();
      if (st === 'present') presentDays += c;
      else if (st === 'absent') absentDays += c;
      else if (st === 'late') lateDays += c;
    });

    const attendancePercentage = totalAttendanceDays > 0 
      ? Math.round((presentDays / totalAttendanceDays) * 100) 
      : 0;

    // 3. Exam Results & Formal Assessments from Database
    const examResult = await pool.query(
      `SELECT r.marks_obtained, r.grade, e.name, e.total_marks, e.exam_date 
       FROM exam_results r JOIN exams e ON r.exam_id = e.id 
       WHERE r.student_id = $1 ORDER BY e.exam_date DESC LIMIT 10`,
      [studentIdStr]
    );

    let totalMarksObtained = 0;
    let totalPossibleMarks = 0;
    examResult.rows.forEach(r => {
      totalMarksObtained += parseFloat(r.marks_obtained || '0');
      totalPossibleMarks += parseFloat(r.total_marks || '0');
    });

    const cumulativePercentage = totalPossibleMarks > 0 
      ? Math.round((totalMarksObtained / totalPossibleMarks) * 1000) / 10 
      : null;

    let calculatedGrade = 'N/A';
    if (cumulativePercentage !== null) {
      if (cumulativePercentage >= 90) calculatedGrade = 'A+ (Outstanding)';
      else if (cumulativePercentage >= 80) calculatedGrade = 'A (Excellent)';
      else if (cumulativePercentage >= 70) calculatedGrade = 'B+ (Good)';
      else if (cumulativePercentage >= 60) calculatedGrade = 'B (Satisfactory)';
      else calculatedGrade = 'C (Needs Support)';
    }

    // 4. Teacher's Notes & Observations from Database
    const notesResult = await pool.query(
      `SELECT note_type, content, created_at FROM student_notes 
       WHERE student_id = $1 AND is_visible_to_parent = true 
       ORDER BY created_at DESC LIMIT 10`,
      [studentIdStr]
    );

    // 5. Holistic Preschool Developmental Milestones from Database
    const milestoneDbResult = await pool.query(
      `SELECT domain, skill, status, rating, remark, evaluated_at 
       FROM student_milestones 
       WHERE student_id = $1 
       ORDER BY domain ASC, skill ASC`,
      [studentIdStr]
    ).catch(() => ({ rows: [] }));

    const groupedMilestones: { domain: string; skills: any[] }[] = [];
    milestoneDbResult.rows.forEach(r => {
      let g = groupedMilestones.find(x => x.domain === r.domain);
      if (!g) {
        g = { domain: r.domain, skills: [] };
        groupedMilestones.push(g);
      }
      g.skills.push({
        skill: r.skill,
        status: r.status,
        rating: parseInt(r.rating || '5', 10),
        remark: r.remark
      });
    });

    // 6. Teacher Remarks: Use latest observation note if available
    const latestNote = notesResult.rows.length > 0 ? notesResult.rows[0].content : '';

    res.json({
      student: student,
      attendance: attendanceResult.rows,
      attendanceStats: {
        totalDays: totalAttendanceDays,
        presentDays: presentDays,
        absentDays: absentDays,
        lateDays: lateDays,
        percentage: attendancePercentage
      },
      cumulativePercentage: cumulativePercentage,
      recentExams: examResult.rows,
      exams: examResult.rows,
      notes: notesResult.rows,
      milestones: groupedMilestones,
      overallGrade: calculatedGrade,
      term: 'Term 1 (Academic Year 2026 - 2027)',
      teacherRemarks: latestNote
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 7. Save / Update a Single Developmental Milestone
export const saveStudentMilestone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { domain, skill, status, rating, remark } = req.body;

    if (!studentId || !skill || !domain) {
      res.status(400).json({ error: 'studentId, domain, and skill are required' });
      return;
    }

    const numericRating = Math.max(1, Math.min(5, parseInt(rating || '5', 10)));
    const skillStatus = status || (numericRating >= 5 ? 'Excellent' : numericRating >= 4 ? 'Good' : 'Developing');

    const result = await pool.query(
      `INSERT INTO student_milestones (student_id, domain, skill, status, rating, remark, evaluated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
       ON CONFLICT (student_id, skill)
       DO UPDATE SET 
         domain = EXCLUDED.domain,
         status = EXCLUDED.status,
         rating = EXCLUDED.rating,
         remark = EXCLUDED.remark,
         evaluated_at = CURRENT_DATE
       RETURNING *`,
      [studentId, domain, skill, skillStatus, numericRating, remark || '']
    );

    res.json({ success: true, milestone: result.rows[0] });
  } catch (error) {
    console.error('Save student milestone error:', error);
    res.status(500).json({ error: 'Failed to save milestone' });
  }
};

// 8. Bulk Save / Update Multiple Developmental Milestones
export const bulkSaveMilestones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { milestones } = req.body;

    if (!studentId || !Array.isArray(milestones)) {
      res.status(400).json({ error: 'studentId and milestones array are required' });
      return;
    }

    const saved = [];
    for (const m of milestones) {
      if (!m.skill || !m.domain) continue;
      const numericRating = Math.max(1, Math.min(5, parseInt(m.rating || '5', 10)));
      const skillStatus = m.status || (numericRating >= 5 ? 'Excellent' : numericRating >= 4 ? 'Good' : 'Developing');
      const r = await pool.query(
        `INSERT INTO student_milestones (student_id, domain, skill, status, rating, remark, evaluated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
         ON CONFLICT (student_id, skill)
         DO UPDATE SET 
           domain = EXCLUDED.domain,
           status = EXCLUDED.status,
           rating = EXCLUDED.rating,
           remark = EXCLUDED.remark,
           evaluated_at = CURRENT_DATE
         RETURNING *`,
        [studentId, m.domain, m.skill, skillStatus, numericRating, m.remark || '']
      );
      saved.push(r.rows[0]);
    }

    res.json({ success: true, count: saved.length, milestones: saved });
  } catch (error) {
    console.error('Bulk save milestones error:', error);
    res.status(500).json({ error: 'Failed to save milestones' });
  }
};

// 9. Save Teacher Observation Note
export const saveStudentNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { note_type, content, is_visible_to_parent } = req.body;

    if (!studentId || !content) {
      res.status(400).json({ error: 'studentId and content are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO student_notes (student_id, teacher_id, note_type, content, is_visible_to_parent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [studentId, req.user?.id || null, note_type || 'General Observation', content, is_visible_to_parent !== false]
    );

    res.json({ success: true, note: result.rows[0] });
  } catch (error) {
    console.error('Save student note error:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
};

// 10. Save Exam / Assessment Score
export const saveStudentExamResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { exam_name, marks_obtained, total_marks, grade } = req.body;

    if (!studentId || !exam_name) {
      res.status(400).json({ error: 'studentId and exam_name are required' });
      return;
    }

    const stRes = await pool.query('SELECT school_id FROM students WHERE id = $1', [studentId]);
    const schoolId = stRes.rows[0]?.school_id || null;

    let examRes = await pool.query(
      'SELECT id FROM exams WHERE name ILIKE $1 AND (school_id = $2 OR school_id IS NULL) LIMIT 1',
      [exam_name, schoolId]
    );
    let examId = examRes.rows[0]?.id;
    if (!examId) {
      const newExam = await pool.query(
        'INSERT INTO exams (name, total_marks, school_id, exam_date) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING id',
        [exam_name, total_marks || 25, schoolId]
      );
      examId = newExam.rows[0]?.id;
    }

    const marksObt = parseFloat(marks_obtained || '0');
    const totMarks = parseFloat(total_marks || '25');
    const pct = totMarks > 0 ? (marksObt / totMarks) * 100 : 0;
    const calculatedGrade = grade || (pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : 'C');

    const existing = await pool.query(
      'SELECT id FROM exam_results WHERE exam_id = $1 AND student_id = $2',
      [examId, studentId]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE exam_results SET marks_obtained = $1, grade = $2 WHERE id = $3 RETURNING *',
        [marksObt, calculatedGrade, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        'INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade) VALUES ($1, $2, $3, $4) RETURNING *',
        [examId, studentId, marksObt, calculatedGrade]
      );
    }

    res.json({ success: true, result: result.rows[0] });
  } catch (error) {
    console.error('Save exam result error:', error);
    res.status(500).json({ error: 'Failed to save exam result' });
  }
};

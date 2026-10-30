"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveStudentExamResult = exports.saveStudentNote = exports.bulkSaveMilestones = exports.saveStudentMilestone = exports.getStudentProgress = void 0;
const database_1 = require("../config/database");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const getStudentProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let studentIdStr = (req.params.studentId || req.query.studentId);
        // Auto-resolve child student_id for logged-in parents/students if not explicitly provided or if 'my'
        if ((!studentIdStr || studentIdStr === 'my' || studentIdStr === 'undefined' || studentIdStr === 'null') && req.user) {
            if (req.user.role === 'parent' || req.user.role === 'student') {
                const parentEmail = (req.user.email || '').toLowerCase().trim();
                const stRes = yield database_1.pool.query(`SELECT s.id FROM students s
           LEFT JOIN parents p ON s.parent_id = p.id
           WHERE LOWER(p.email) = $1 
              OR s.parent_id = $2
              OR s.id = $2
              OR ($1 = 'parent@eduneev.com' AND LOWER(p.email) = 'parent.chinchwad@eduneev.com')
           ORDER BY s.created_at ASC 
           LIMIT 1`, [parentEmail, req.user.id]).catch(() => ({ rows: [] }));
                if (stRes.rows.length > 0) {
                    studentIdStr = stRes.rows[0].id;
                }
            }
        }
        // Fallback if still not found and user has role parent: check first student
        if (!studentIdStr && ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'parent') {
            const fallbackSt = yield database_1.pool.query(`SELECT id FROM students WHERE is_active = true ORDER BY created_at ASC LIMIT 1`).catch(() => ({ rows: [] }));
            if (fallbackSt.rows.length > 0) {
                studentIdStr = fallbackSt.rows[0].id;
            }
        }
        if (!studentIdStr || !UUID_REGEX.test(studentIdStr)) {
            res.status(400).json({ error: 'Valid student_id is required' });
            return;
        }
        // 1. Student Profile Details
        const studentInfoRes = yield database_1.pool.query(`SELECT s.id, s.first_name, s.last_name, s.admission_number, s.roll_number,
              s.grade, s.date_of_birth, s.blood_group, s.profile_image_url,
              sch.name AS school_name, sch.address AS school_address
       FROM students s
       LEFT JOIN schools sch ON s.school_id = sch.id
       WHERE s.id = $1`, [studentIdStr]);
        const student = studentInfoRes.rows[0] || null;
        // 2. Attendance Summary
        const attendanceResult = yield database_1.pool.query(`SELECT status, count(*) as count FROM attendance WHERE student_id = $1 GROUP BY status`, [studentIdStr]);
        let totalAttendanceDays = 0;
        let presentDays = 0;
        let absentDays = 0;
        let lateDays = 0;
        attendanceResult.rows.forEach(r => {
            const c = parseInt(r.count || '0', 10);
            totalAttendanceDays += c;
            const st = (r.status || '').toLowerCase();
            if (st === 'present')
                presentDays += c;
            else if (st === 'absent')
                absentDays += c;
            else if (st === 'late')
                lateDays += c;
        });
        const attendancePercentage = totalAttendanceDays > 0
            ? Math.round((presentDays / totalAttendanceDays) * 100)
            : 0;
        // 3. Exam Results & Formal Assessments from Database
        const examResult = yield database_1.pool.query(`SELECT r.marks_obtained, r.grade, e.name, e.total_marks, e.exam_date 
       FROM exam_results r JOIN exams e ON r.exam_id = e.id 
       WHERE r.student_id = $1 ORDER BY e.exam_date DESC LIMIT 10`, [studentIdStr]);
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
            if (cumulativePercentage >= 90)
                calculatedGrade = 'A+ (Outstanding)';
            else if (cumulativePercentage >= 80)
                calculatedGrade = 'A (Excellent)';
            else if (cumulativePercentage >= 70)
                calculatedGrade = 'B+ (Good)';
            else if (cumulativePercentage >= 60)
                calculatedGrade = 'B (Satisfactory)';
            else
                calculatedGrade = 'C (Needs Support)';
        }
        // 4. Teacher's Notes & Observations from Database
        const notesResult = yield database_1.pool.query(`SELECT note_type, content, created_at FROM student_notes 
       WHERE student_id = $1 AND is_visible_to_parent = true 
       ORDER BY created_at DESC LIMIT 10`, [studentIdStr]);
        // 5. Holistic Preschool Developmental Milestones from Database
        const milestoneDbResult = yield database_1.pool.query(`SELECT domain, skill, status, rating, remark, evaluated_at 
       FROM student_milestones 
       WHERE student_id = $1 
       ORDER BY domain ASC, skill ASC`, [studentIdStr]).catch(() => ({ rows: [] }));
        const groupedMilestones = [];
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
    }
    catch (error) {
        console.error('Get student progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getStudentProgress = getStudentProgress;
// 7. Save / Update a Single Developmental Milestone
const saveStudentMilestone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const { domain, skill, status, rating, remark } = req.body;
        if (!studentId || !skill || !domain) {
            res.status(400).json({ error: 'studentId, domain, and skill are required' });
            return;
        }
        const numericRating = Math.max(1, Math.min(5, parseInt(rating || '5', 10)));
        const skillStatus = status || (numericRating >= 5 ? 'Excellent' : numericRating >= 4 ? 'Good' : 'Developing');
        const result = yield database_1.pool.query(`INSERT INTO student_milestones (student_id, domain, skill, status, rating, remark, evaluated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
       ON CONFLICT (student_id, skill)
       DO UPDATE SET 
         domain = EXCLUDED.domain,
         status = EXCLUDED.status,
         rating = EXCLUDED.rating,
         remark = EXCLUDED.remark,
         evaluated_at = CURRENT_DATE
       RETURNING *`, [studentId, domain, skill, skillStatus, numericRating, remark || '']);
        res.json({ success: true, milestone: result.rows[0] });
    }
    catch (error) {
        console.error('Save student milestone error:', error);
        res.status(500).json({ error: 'Failed to save milestone' });
    }
});
exports.saveStudentMilestone = saveStudentMilestone;
// 8. Bulk Save / Update Multiple Developmental Milestones
const bulkSaveMilestones = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const { milestones } = req.body;
        if (!studentId || !Array.isArray(milestones)) {
            res.status(400).json({ error: 'studentId and milestones array are required' });
            return;
        }
        const saved = [];
        for (const m of milestones) {
            if (!m.skill || !m.domain)
                continue;
            const numericRating = Math.max(1, Math.min(5, parseInt(m.rating || '5', 10)));
            const skillStatus = m.status || (numericRating >= 5 ? 'Excellent' : numericRating >= 4 ? 'Good' : 'Developing');
            const r = yield database_1.pool.query(`INSERT INTO student_milestones (student_id, domain, skill, status, rating, remark, evaluated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
         ON CONFLICT (student_id, skill)
         DO UPDATE SET 
           domain = EXCLUDED.domain,
           status = EXCLUDED.status,
           rating = EXCLUDED.rating,
           remark = EXCLUDED.remark,
           evaluated_at = CURRENT_DATE
         RETURNING *`, [studentId, m.domain, m.skill, skillStatus, numericRating, m.remark || '']);
            saved.push(r.rows[0]);
        }
        res.json({ success: true, count: saved.length, milestones: saved });
    }
    catch (error) {
        console.error('Bulk save milestones error:', error);
        res.status(500).json({ error: 'Failed to save milestones' });
    }
});
exports.bulkSaveMilestones = bulkSaveMilestones;
// 9. Save Teacher Observation Note
const saveStudentNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { studentId } = req.params;
        const { note_type, content, is_visible_to_parent } = req.body;
        if (!studentId || !content) {
            res.status(400).json({ error: 'studentId and content are required' });
            return;
        }
        const result = yield database_1.pool.query(`INSERT INTO student_notes (student_id, teacher_id, note_type, content, is_visible_to_parent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [studentId, ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null, note_type || 'General Observation', content, is_visible_to_parent !== false]);
        res.json({ success: true, note: result.rows[0] });
    }
    catch (error) {
        console.error('Save student note error:', error);
        res.status(500).json({ error: 'Failed to save note' });
    }
});
exports.saveStudentNote = saveStudentNote;
// 10. Save Exam / Assessment Score
const saveStudentExamResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { studentId } = req.params;
        const { exam_name, marks_obtained, total_marks, grade } = req.body;
        if (!studentId || !exam_name) {
            res.status(400).json({ error: 'studentId and exam_name are required' });
            return;
        }
        const stRes = yield database_1.pool.query('SELECT school_id FROM students WHERE id = $1', [studentId]);
        const schoolId = ((_a = stRes.rows[0]) === null || _a === void 0 ? void 0 : _a.school_id) || null;
        let examRes = yield database_1.pool.query('SELECT id FROM exams WHERE name ILIKE $1 AND (school_id = $2 OR school_id IS NULL) LIMIT 1', [exam_name, schoolId]);
        let examId = (_b = examRes.rows[0]) === null || _b === void 0 ? void 0 : _b.id;
        if (!examId) {
            const newExam = yield database_1.pool.query('INSERT INTO exams (name, total_marks, school_id, exam_date) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING id', [exam_name, total_marks || 25, schoolId]);
            examId = (_c = newExam.rows[0]) === null || _c === void 0 ? void 0 : _c.id;
        }
        const marksObt = parseFloat(marks_obtained || '0');
        const totMarks = parseFloat(total_marks || '25');
        const pct = totMarks > 0 ? (marksObt / totMarks) * 100 : 0;
        const calculatedGrade = grade || (pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : 'C');
        const existing = yield database_1.pool.query('SELECT id FROM exam_results WHERE exam_id = $1 AND student_id = $2', [examId, studentId]);
        let result;
        if (existing.rows.length > 0) {
            result = yield database_1.pool.query('UPDATE exam_results SET marks_obtained = $1, grade = $2 WHERE id = $3 RETURNING *', [marksObt, calculatedGrade, existing.rows[0].id]);
        }
        else {
            result = yield database_1.pool.query('INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade) VALUES ($1, $2, $3, $4) RETURNING *', [examId, studentId, marksObt, calculatedGrade]);
        }
        res.json({ success: true, result: result.rows[0] });
    }
    catch (error) {
        console.error('Save exam result error:', error);
        res.status(500).json({ error: 'Failed to save exam result' });
    }
});
exports.saveStudentExamResult = saveStudentExamResult;

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
exports.getStudentResults = exports.addResults = exports.createExam = void 0;
const database_1 = require("../config/database");
// Add an exam
const createExam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { schoolId, sectionId, name, examDate, totalMarks } = req.body;
    try {
        const result = yield database_1.pool.query(`INSERT INTO exams (school_id, section_id, name, exam_date, total_marks)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [schoolId, sectionId, name, examDate, totalMarks]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createExam = createExam;
// Add results for an exam
const addResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { examId, results } = req.body;
    // results = [{ studentId, marksObtained, grade, remarks }]
    try {
        // using transaction if possible or bulk insert
        yield database_1.pool.query('BEGIN');
        for (const r of results) {
            yield database_1.pool.query(`INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade, remarks)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (exam_id, student_id) DO UPDATE 
         SET marks_obtained = EXCLUDED.marks_obtained, grade = EXCLUDED.grade, remarks = EXCLUDED.remarks`, [examId, r.studentId, r.marksObtained, r.grade, r.remarks]);
        }
        yield database_1.pool.query('COMMIT');
        res.json({ message: 'Results saved successfully' });
    }
    catch (error) {
        yield database_1.pool.query('ROLLBACK');
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.addResults = addResults;
// View results for a student
const getStudentResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId } = req.params;
    try {
        const result = yield database_1.pool.query(`SELECT r.marks_obtained, r.grade, r.remarks, e.name as exam_name, e.exam_date, e.total_marks
       FROM exam_results r
       JOIN exams e ON r.exam_id = e.id
       WHERE r.student_id = $1
       ORDER BY e.exam_date DESC`, [studentId]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getStudentResults = getStudentResults;

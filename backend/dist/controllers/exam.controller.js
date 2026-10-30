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
exports.getReportCard = exports.enterMarks = exports.getExams = exports.createExam = void 0;
const database_1 = require("../config/database");
const createExam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { term, name, grade, year } = req.body;
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role === 'parent') {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const result = yield database_1.pool.query(`INSERT INTO exams (term, name, grade, year) VALUES ($1, $2, $3, $4) RETURNING *`, [term, name, grade, year]);
        res.status(201).json({ message: 'Exam created', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create exam error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createExam = createExam;
const getExams = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { grade } = req.params;
        const result = yield database_1.pool.query(`SELECT * FROM exams WHERE grade = $1 ORDER BY created_at DESC`, [grade]);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get exams error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getExams = getExams;
const enterMarks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { exam_id, student_id, subject, marks_obtained, max_marks } = req.body;
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role === 'parent') {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const result = yield database_1.pool.query(`INSERT INTO exam_marks (exam_id, student_id, subject, marks_obtained, max_marks) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (exam_id, student_id, subject) 
       DO UPDATE SET marks_obtained = $4, max_marks = $5 
       RETURNING *`, [exam_id, student_id, subject, marks_obtained, max_marks]);
        res.status(200).json({ message: 'Marks updated', data: result.rows[0] });
    }
    catch (error) {
        console.error('Enter marks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.enterMarks = enterMarks;
const getReportCard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { student_id } = req.params;
        // Fetch all marks for this student, joined with exam info
        const query = `
      SELECT em.*, e.term, e.name as exam_name, e.year 
      FROM exam_marks em
      JOIN exams e ON em.exam_id = e.id
      WHERE em.student_id = $1
      ORDER BY e.term ASC, e.created_at ASC
    `;
        const result = yield database_1.pool.query(query, [student_id]);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get report card error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getReportCard = getReportCard;

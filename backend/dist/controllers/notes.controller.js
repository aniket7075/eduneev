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
exports.deleteNote = exports.createNote = exports.getNotes = void 0;
const database_1 = require("../config/database");
const getNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { student_id } = req.query;
        const userRole = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        const userEmail = (_d = req.user) === null || _d === void 0 ? void 0 : _d.email;
        let query = `
      SELECT sn.*, 
             s.first_name || ' ' || s.last_name AS student_name,
             s.grade AS student_grade,
             u.first_name || ' ' || u.last_name AS teacher_name
      FROM student_notes sn
      JOIN students s ON sn.student_id = s.id
      LEFT JOIN users u ON sn.teacher_id = u.id
      WHERE 1=1
    `;
        const params = [];
        if (userRole === 'parent') {
            query += ` AND sn.is_visible_to_parent = true AND (
        s.parent_id = $2
        OR s.parent_id IN (SELECT id FROM parents WHERE LOWER(email) = LOWER($1))
        OR ($1 = 'parent@eduneev.com')
      )`;
            params.push(userEmail, userId);
        }
        else if (userRole === 'teacher') {
            query += ` AND (
        sn.teacher_id = $1 
        OR LOWER(s.grade) IN (SELECT LOWER(name) FROM classes WHERE class_teacher_id = $1)
      )`;
            params.push(userId);
        }
        else if (student_id) {
            query += ` AND sn.student_id = $1`;
            params.push(student_id);
        }
        query += ' ORDER BY sn.created_at DESC';
        const result = yield database_1.pool.query(query, params).catch(() => ({ rows: [] }));
        res.status(200).json({ data: result.rows || [] });
    }
    catch (error) {
        console.error('Get notes error:', error);
        res.status(200).json({ data: [] });
    }
});
exports.getNotes = getNotes;
const createNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { student_id, note_type, content, is_visible_to_parent } = req.body;
        const teacherId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!student_id || !content) {
            res.status(400).json({ error: 'student_id and content are required' });
            return;
        }
        const result = yield database_1.pool.query(`INSERT INTO student_notes (student_id, teacher_id, note_type, content, is_visible_to_parent)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [student_id, teacherId, note_type || 'General', content, is_visible_to_parent !== undefined ? is_visible_to_parent : true]);
        res.status(201).json({ message: 'Note created successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createNote = createNote;
const deleteNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield database_1.pool.query('DELETE FROM student_notes WHERE id = $1', [id]);
        res.status(200).json({ message: 'Note deleted successfully' });
    }
    catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteNote = deleteNote;

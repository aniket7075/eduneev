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
exports.issueBook = exports.getIssuedBooks = exports.addBook = exports.getBooks = void 0;
const database_1 = require("../config/database");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const getBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.pool.query(`SELECT * FROM library_books ORDER BY title ASC`);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getBooks = getBooks;
const addBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, author, isbn, total_copies } = req.body;
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role === 'parent') {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        if (!title || !author) {
            res.status(400).json({ error: 'Title and author are required' });
            return;
        }
        const copies = parseInt(total_copies) || 1;
        const result = yield database_1.pool.query(`INSERT INTO library_books (title, author, isbn, total_copies, available_copies) 
       VALUES ($1, $2, $3, $4, $4) RETURNING *`, [title, author, isbn || null, copies]);
        res.status(201).json({ message: 'Book added', data: result.rows[0] });
    }
    catch (error) {
        console.error('Add book error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.addBook = addBook;
const getIssuedBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { student_id } = req.params;
        const studentIdStr = Array.isArray(student_id) ? student_id[0] : student_id;
        if (!studentIdStr || typeof studentIdStr !== 'string' || !UUID_REGEX.test(studentIdStr)) {
            res.status(200).json({ data: [] });
            return;
        }
        const result = yield database_1.pool.query(`SELECT bi.*, lb.title, lb.author 
       FROM book_issues bi
       JOIN library_books lb ON bi.book_id = lb.id
       WHERE bi.student_id = $1
       ORDER BY bi.issue_date DESC`, [studentIdStr]);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get issued books error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getIssuedBooks = getIssuedBooks;
const issueBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { book_id, student_id, due_date } = req.body;
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role === 'parent') {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        if (!book_id || !student_id || !UUID_REGEX.test(student_id) || !UUID_REGEX.test(book_id)) {
            res.status(400).json({ error: 'Valid book_id and student_id are required' });
            return;
        }
        const bookCheck = yield database_1.pool.query(`SELECT available_copies FROM library_books WHERE id = $1`, [book_id]);
        if (bookCheck.rows.length === 0 || bookCheck.rows[0].available_copies <= 0) {
            res.status(400).json({ error: 'Book not available' });
            return;
        }
        yield database_1.pool.query(`UPDATE library_books SET available_copies = available_copies - 1 WHERE id = $1`, [book_id]);
        const result = yield database_1.pool.query(`INSERT INTO book_issues (book_id, student_id, due_date) VALUES ($1, $2, $3) RETURNING *`, [book_id, student_id, due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]]);
        res.status(201).json({ message: 'Book issued', data: result.rows[0] });
    }
    catch (error) {
        console.error('Issue book error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.issueBook = issueBook;

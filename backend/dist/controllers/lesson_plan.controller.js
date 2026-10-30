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
exports.createLessonPlan = exports.getLessonPlans = void 0;
const database_1 = require("../config/database");
const getLessonPlans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { grade } = req.params;
        const result = yield database_1.pool.query(`SELECT * FROM lesson_plans WHERE grade = $1 ORDER BY created_at DESC`, [grade]);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get lesson plans error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getLessonPlans = getLessonPlans;
const createLessonPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { grade, subject, chapter_name, status } = req.body;
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (role === 'parent') {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const result = yield database_1.pool.query(`INSERT INTO lesson_plans (grade, subject, chapter_name, status, created_by) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [grade, subject, chapter_name, status || 'Planned', userId]);
        res.status(201).json({ message: 'Lesson plan created', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create lesson plan error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createLessonPlan = createLessonPlan;

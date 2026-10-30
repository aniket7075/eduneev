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
exports.logDailyActivity = exports.getDailyActivities = void 0;
const database_1 = require("../config/database");
const getDailyActivities = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { student_id } = req.params;
        const { date } = req.query; // optional filter by date
        let query = `SELECT * FROM daily_activities WHERE student_id = $1`;
        const params = [student_id];
        if (date) {
            query += ` AND date = $2`;
            params.push(date);
        }
        query += ` ORDER BY date DESC, created_at DESC LIMIT 30`;
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get daily activities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getDailyActivities = getDailyActivities;
const logDailyActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { student_id } = req.params;
        const { date, nap_start, nap_end, meals_eaten, mood, notes } = req.body;
        yield database_1.pool.query(`INSERT INTO daily_activities (student_id, date, nap_start, nap_end, meals_eaten, mood, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [student_id, date, nap_start || null, nap_end || null, meals_eaten, mood, notes]);
        res.status(201).json({ message: 'Daily activity logged successfully' });
    }
    catch (error) {
        console.error('Log daily activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.logDailyActivity = logDailyActivity;

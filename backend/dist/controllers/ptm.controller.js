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
exports.bookPtmSlot = exports.createPtmSchedule = exports.getPtmSchedules = void 0;
const database_1 = require("../config/database");
const getPtmSchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id } = req.user;
        const result = yield database_1.pool.query(`SELECT * FROM ptm_schedules WHERE school_id = $1 ORDER BY date DESC`, [school_id]);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get PTM schedules error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getPtmSchedules = getPtmSchedules;
const createPtmSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id } = req.user;
        const { teacher_id, date, start_time, end_time, slot_duration } = req.body;
        const result = yield database_1.pool.query(`INSERT INTO ptm_schedules (school_id, teacher_id, date, start_time, end_time, slot_duration) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [school_id, teacher_id, date, start_time, end_time, slot_duration || 15]);
        res.status(201).json({ message: 'PTM Schedule created successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create PTM schedule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createPtmSchedule = createPtmSchedule;
const bookPtmSlot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id } = req.user;
        const { ptm_id, student_id, time_slot } = req.body;
        // Check if slot is already booked
        const existing = yield database_1.pool.query(`SELECT id FROM ptm_bookings WHERE ptm_id = $1 AND time_slot = $2`, [ptm_id, time_slot]);
        if (existing.rows.length > 0) {
            res.status(400).json({ error: 'Slot already booked' });
            return;
        }
        const result = yield database_1.pool.query(`INSERT INTO ptm_bookings (ptm_id, student_id, school_id, time_slot) 
       VALUES ($1, $2, $3, $4) RETURNING *`, [ptm_id, student_id, school_id, time_slot]);
        res.status(201).json({ message: 'PTM Slot booked successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Book PTM slot error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.bookPtmSlot = bookPtmSlot;

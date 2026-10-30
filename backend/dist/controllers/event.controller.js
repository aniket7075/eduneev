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
exports.deleteEvent = exports.createEvent = exports.getEvents = void 0;
const database_1 = require("../config/database");
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const school_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.school_id;
        let query = `SELECT * FROM events`;
        const params = [];
        if (school_id) {
            query += ` WHERE school_id = $1`;
            params.push(school_id);
        }
        query += ` ORDER BY start_date ASC`;
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows || [] });
    }
    catch (error) {
        console.error('Get events error:', error);
        res.status(200).json({ data: [] });
    }
});
exports.getEvents = getEvents;
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id } = req.user;
        const { title, description, start_date, end_date, type } = req.body;
        const result = yield database_1.pool.query(`INSERT INTO events (school_id, title, description, start_date, end_date, type) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [school_id, title, description, start_date, end_date, type || 'event']);
        res.status(201).json({ message: 'Event created successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createEvent = createEvent;
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield database_1.pool.query(`DELETE FROM events WHERE id = $1`, [id]);
        res.status(200).json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteEvent = deleteEvent;

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
exports.deleteFoodMenu = exports.createFoodMenu = exports.getFoodMenus = void 0;
const database_1 = require("../config/database");
const getFoodMenus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const schoolId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.school_id) || req.query.school_id || null;
        const result = yield database_1.pool.query(`SELECT * FROM food_menus WHERE ($1::uuid IS NULL OR school_id = $1::uuid) ORDER BY date DESC LIMIT 30`, [schoolId]);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get food menus error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getFoodMenus = getFoodMenus;
const createFoodMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let schoolId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.school_id) || req.body.school_id;
        if (!schoolId) {
            const s = yield database_1.pool.query('SELECT id FROM schools LIMIT 1');
            if (s.rows.length > 0)
                schoolId = s.rows[0].id;
        }
        const { date, breakfast, lunch, snacks } = req.body;
        // Check if menu for date exists
        const existing = yield database_1.pool.query(`SELECT id FROM food_menus WHERE school_id = $1 AND date = $2`, [schoolId, date]);
        if (existing.rows.length > 0) {
            yield database_1.pool.query(`UPDATE food_menus SET breakfast = $1, lunch = $2, snacks = $3 WHERE school_id = $4 AND date = $5`, [breakfast, lunch, snacks, schoolId, date]);
            res.status(200).json({ message: 'Food menu updated successfully' });
        }
        else {
            yield database_1.pool.query(`INSERT INTO food_menus (school_id, date, breakfast, lunch, snacks) 
         VALUES ($1, $2, $3, $4, $5)`, [schoolId, date, breakfast, lunch, snacks]);
            res.status(201).json({ message: 'Food menu created successfully' });
        }
    }
    catch (error) {
        console.error('Create food menu error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createFoodMenu = createFoodMenu;
const deleteFoodMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Check if the record exists
        const existing = yield database_1.pool.query(`SELECT id FROM food_menus WHERE id = $1`, [id]);
        if (existing.rows.length === 0) {
            res.status(404).json({ error: 'Food menu not found' });
            return;
        }
        yield database_1.pool.query(`DELETE FROM food_menus WHERE id = $1`, [id]);
        res.status(200).json({ message: 'Food menu deleted successfully' });
    }
    catch (error) {
        console.error('Delete food menu error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteFoodMenu = deleteFoodMenu;

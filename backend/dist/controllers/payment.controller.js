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
exports.createPayment = exports.getPayments = void 0;
const database_1 = require("../config/database");
const getPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id } = req.user;
        const result = yield database_1.pool.query(`SELECT * FROM payments WHERE school_id = $1 ORDER BY date DESC`, [school_id]);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getPayments = getPayments;
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id } = req.user;
        const { student_id, fee_id, amount, transaction_id, payment_method } = req.body;
        const result = yield database_1.pool.query(`INSERT INTO payments (student_id, fee_id, school_id, amount, transaction_id, status, payment_method) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [student_id, fee_id, school_id, amount, transaction_id, 'Completed', payment_method || 'Online']);
        res.status(201).json({ message: 'Payment recorded successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createPayment = createPayment;

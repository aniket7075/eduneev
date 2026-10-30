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
exports.getPendingFeeRemindersHandler = exports.triggerFeeRemindersHandler = exports.getStudentLedger = exports.getReceipt = exports.getAllStudentsFeeSummary = exports.assignFee = exports.verifyPayment = exports.getNextReceiptNumberHandler = exports.getNextGSTReceiptNumber = exports.createRazorpayOrder = exports.getStudentFees = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const feeReminder_service_1 = require("../services/feeReminder.service");
// import Razorpay from 'razorpay';
// const razorpay = new Razorpay({
//   key_id: (process.env.RAZORPAY_KEY_ID as any) || 'dummy_key',
//   key_secret: (process.env.RAZORPAY_KEY_SECRET as any) || 'dummy_secret',
// });
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const getStudentFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { student_id } = req.params;
        let query = `
      SELECT sf.*, fs.fee_type,
             COALESCE(SUM(p.amount_paid), 0) as total_paid,
             MAX(p.created_at) as last_payment_date
      FROM student_fees sf
      JOIN fee_structures fs ON sf.fee_structure_id = fs.id
      LEFT JOIN payments p ON p.student_fee_id = sf.id
      GROUP BY sf.id, fs.fee_type
      ORDER BY sf.due_date DESC
    `;
        const params = [];
        let studentIdStr = Array.isArray(student_id) ? student_id[0] : student_id;
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        if ((!studentIdStr || studentIdStr === 'undefined') && req.user) {
            if (req.user.role === 'parent' || req.user.role === 'student') {
                const parentEmail = (req.user.email || '').toLowerCase().trim();
                const stRes = yield database_1.pool.query(`SELECT s.id FROM students s
           LEFT JOIN parents p ON s.parent_id = p.id
           WHERE LOWER(p.email) = $1 
              OR s.parent_id = $2
              OR s.id = $2
              OR ($1 = 'parent@eduneev.com' AND LOWER(p.email) = 'parent.chinchwad@eduneev.com')
           ORDER BY s.created_at ASC 
           LIMIT 1`, [parentEmail, req.user.id]).catch(() => ({ rows: [] }));
                if (stRes.rows.length > 0) {
                    studentIdStr = stRes.rows[0].id;
                }
            }
        }
        if (studentIdStr && typeof studentIdStr === 'string' && UUID_REGEX.test(studentIdStr)) {
            if (!isSuper && tenantSchoolId) {
                const checkSt = yield database_1.pool.query('SELECT id FROM students WHERE id = $1 AND school_id = $2', [studentIdStr, tenantSchoolId]);
                if (checkSt.rows.length === 0) {
                    res.status(403).json({ error: 'Access denied: Student does not belong to your branch.' });
                    return;
                }
            }
            query = `
        SELECT sf.*, fs.fee_type,
               COALESCE(SUM(p.amount_paid), 0) as total_paid,
               MAX(p.created_at) as last_payment_date
        FROM student_fees sf
        JOIN fee_structures fs ON sf.fee_structure_id = fs.id
        LEFT JOIN payments p ON p.student_fee_id = sf.id
        WHERE sf.student_id = $1
        GROUP BY sf.id, fs.fee_type
        ORDER BY sf.due_date DESC
      `;
            params.push(studentIdStr);
        }
        else if (!isSuper && tenantSchoolId) {
            query = `
        SELECT sf.*, fs.fee_type,
               COALESCE(SUM(p.amount_paid), 0) as total_paid,
               MAX(p.created_at) as last_payment_date
        FROM student_fees sf
        JOIN fee_structures fs ON sf.fee_structure_id = fs.id
        JOIN students s ON sf.student_id = s.id
        LEFT JOIN payments p ON p.student_fee_id = sf.id
        WHERE s.school_id = $1
        GROUP BY sf.id, fs.fee_type
        ORDER BY sf.due_date DESC
      `;
            params.push(tenantSchoolId);
        }
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get fees error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getStudentFees = getStudentFees;
const createRazorpayOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, fee_id } = req.body;
        if (!amount || !fee_id) {
            res.status(400).json({ error: 'Amount and fee_id are required' });
            return;
        }
        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency: 'INR',
            receipt: `receipt_${fee_id}_${Date.now()}`,
        };
        // const order = await razorpay.orders.create(options);
        // res.status(200).json({ data: order });
        res.status(501).json({ error: 'Payment gateway disabled for now' });
    }
    catch (error) {
        console.error('Razorpay create order error:', error);
        res.status(500).json({ error: 'Payment gateway error' });
    }
});
exports.createRazorpayOrder = createRazorpayOrder;
const getNextGSTReceiptNumber = (branchName_1, schoolId_1, ...args_1) => __awaiter(void 0, [branchName_1, schoolId_1, ...args_1], void 0, function* (branchName, schoolId, clientOrPool = database_1.pool) {
    try {
        let resolvedName = branchName || '';
        if (!resolvedName && schoolId) {
            const sRes = yield clientOrPool.query(`SELECT name FROM schools WHERE id = $1`, [schoolId]);
            if (sRes.rows.length > 0)
                resolvedName = sRes.rows[0].name;
        }
        const currentYear = new Date().getFullYear();
        let branchCode = 'CHI';
        if (resolvedName) {
            const lower = resolvedName.toLowerCase();
            if (lower.includes('chinchwad'))
                branchCode = 'CHI';
            else if (lower.includes('chikhali'))
                branchCode = 'CHK';
            else if (lower.includes('dudulgaon'))
                branchCode = 'DUD';
            else {
                const clean = resolvedName.trim().toUpperCase().replace(/BRANCH/gi, '').trim();
                branchCode = clean.slice(0, 3) || 'CHI';
            }
        }
        const prefix = `REC-${branchCode}-${currentYear}-`;
        const res = yield clientOrPool.query(`SELECT razorpay_order_id FROM payments WHERE razorpay_order_id LIKE $1`, [`${prefix}%`]);
        let maxSeq = 0;
        for (const row of res.rows) {
            if (row.razorpay_order_id) {
                const parts = row.razorpay_order_id.split('-');
                const lastNumStr = parts[parts.length - 1];
                const parsedNum = parseInt(lastNumStr, 10);
                if (!isNaN(parsedNum) && parsedNum > maxSeq) {
                    maxSeq = parsedNum;
                }
            }
        }
        try {
            const sRes = yield clientOrPool.query(`SELECT medical_notes FROM students WHERE medical_notes LIKE $1`, [`%${prefix}%`]);
            for (const sRow of sRes.rows) {
                try {
                    const parsed = typeof sRow.medical_notes === 'string' ? JSON.parse(sRow.medical_notes) : sRow.medical_notes;
                    const rNo = (parsed === null || parsed === void 0 ? void 0 : parsed.receiptNo) || '';
                    if (rNo && rNo.startsWith(prefix)) {
                        const parts = rNo.split('-');
                        const num = parseInt(parts[parts.length - 1], 10);
                        if (!isNaN(num) && num > maxSeq) {
                            maxSeq = num;
                        }
                    }
                }
                catch (_) { }
            }
        }
        catch (_) { }
        const nextSeq = maxSeq + 1;
        const paddedSeq = nextSeq.toString().padStart(3, '0');
        return `${prefix}${paddedSeq}`;
    }
    catch (e) {
        return `REC-CHI-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    }
});
exports.getNextGSTReceiptNumber = getNextGSTReceiptNumber;
const getNextReceiptNumberHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { branch_name, school_id } = req.query;
        const branchId = school_id ? parseInt(school_id) : ((0, auth_middleware_1.getTenantSchoolId)(req) ? parseInt((0, auth_middleware_1.getTenantSchoolId)(req)) : undefined);
        const recNo = yield (0, exports.getNextGSTReceiptNumber)(branch_name, branchId);
        res.json({ success: true, receipt_no: recNo });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to generate receipt number' });
    }
});
exports.getNextReceiptNumberHandler = getNextReceiptNumberHandler;
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.pool.connect();
    try {
        yield client.query('BEGIN');
        const { fee_id, student_id, amount_paid, payment_method, transaction_ref, receipt_no, notes } = req.body;
        const paymentAmount = parseFloat(amount_paid);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            yield client.query('ROLLBACK');
            res.status(400).json({ error: 'Valid amount_paid is required' });
            return;
        }
        let targetStudentId = student_id;
        if (!targetStudentId && fee_id) {
            const sfCheck = yield client.query('SELECT student_id FROM student_fees WHERE id = $1', [fee_id]);
            if (sfCheck.rows.length > 0) {
                targetStudentId = sfCheck.rows[0].student_id;
            }
        }
        if (!targetStudentId && !fee_id) {
            yield client.query('ROLLBACK');
            res.status(400).json({ error: 'student_id or fee_id is required' });
            return;
        }
        const parentEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
        let parentId = null;
        if (parentEmail) {
            const parentRes = yield client.query('SELECT id FROM parents WHERE email = $1', [parentEmail]);
            if (parentRes.rows.length > 0) {
                parentId = parentRes.rows[0].id;
            }
        }
        let branchName = '';
        if (targetStudentId) {
            const sRes = yield client.query(`SELECT s.name AS school_name FROM students st JOIN schools s ON s.id = st.school_id WHERE st.id = $1`, [targetStudentId]);
            if (sRes.rows.length > 0)
                branchName = sRes.rows[0].school_name;
        }
        let finalReceiptNo = receipt_no && receipt_no.trim() !== '' ? receipt_no.trim() : '';
        if (finalReceiptNo) {
            const existingCheck = yield client.query(`SELECT id FROM payments WHERE razorpay_order_id = $1 LIMIT 1`, [finalReceiptNo]);
            if (existingCheck.rows.length > 0) {
                finalReceiptNo = yield (0, exports.getNextGSTReceiptNumber)(branchName, undefined, client);
            }
        }
        else {
            finalReceiptNo = yield (0, exports.getNextGSTReceiptNumber)(branchName, undefined, client);
        }
        let primaryPaymentRecord = null;
        let remainingAmountToDistribute = paymentAmount;
        // If a specific fee_id is provided, allocate to it first
        if (fee_id) {
            const targetFeeRes = yield client.query(`SELECT sf.id, sf.amount_due, sf.status, COALESCE(SUM(p.amount_paid), 0) AS total_paid
         FROM student_fees sf
         LEFT JOIN payments p ON p.student_fee_id = sf.id
         WHERE sf.id = $1
         GROUP BY sf.id, sf.amount_due, sf.status`, [fee_id]);
            if (targetFeeRes.rows.length > 0) {
                const feeRow = targetFeeRes.rows[0];
                const feeDue = parseFloat(feeRow.amount_due || '0');
                const currentPaid = parseFloat(feeRow.total_paid || '0');
                const unpaidForThisFee = Math.max(0, feeDue - currentPaid);
                const payThis = unpaidForThisFee > 0 ? Math.min(remainingAmountToDistribute, unpaidForThisFee) : remainingAmountToDistribute;
                const pRes = yield client.query(`INSERT INTO payments (student_fee_id, parent_id, amount_paid, payment_method, razorpay_order_id, razorpay_payment_id)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [
                    fee_id,
                    parentId,
                    payThis,
                    payment_method || 'Cash',
                    finalReceiptNo,
                    transaction_ref || 'OFFLINE'
                ]);
                primaryPaymentRecord = pRes.rows[0];
                remainingAmountToDistribute = Math.round((remainingAmountToDistribute - payThis) * 100) / 100;
                const newTotalPaid = currentPaid + payThis;
                const newStatus = Math.round(newTotalPaid * 100) >= Math.round(feeDue * 100)
                    ? 'paid'
                    : (newTotalPaid > 0 ? 'partial' : 'pending');
                yield client.query('UPDATE student_fees SET status = $1 WHERE id = $2', [newStatus, fee_id]);
            }
        }
        // Now, if there is remaining amount to distribute and we have targetStudentId, cascade across oldest unpaid fees
        if (remainingAmountToDistribute > 0 && targetStudentId) {
            const pendingFeesRes = yield client.query(`SELECT sf.id, sf.amount_due, sf.status, fs.fee_type, COALESCE(SUM(p.amount_paid), 0) AS total_paid
         FROM student_fees sf
         JOIN fee_structures fs ON fs.id = sf.fee_structure_id
         LEFT JOIN payments p ON p.student_fee_id = sf.id
         WHERE sf.student_id = $1 AND sf.status != 'paid' ${fee_id ? 'AND sf.id != $2' : ''}
         GROUP BY sf.id, sf.amount_due, sf.status, fs.fee_type, sf.due_date, sf.created_at
         ORDER BY 
           CASE 
             WHEN LOWER(fs.fee_type) LIKE '%admission%' OR LOWER(fs.fee_type) LIKE '%part 1%' THEN 1
             WHEN LOWER(fs.fee_type) LIKE '%part 2%' OR LOWER(fs.fee_type) LIKE '%5th may%' THEN 2
             WHEN LOWER(fs.fee_type) LIKE '%term 1%' THEN 3
             WHEN LOWER(fs.fee_type) LIKE '%term 2%' THEN 4
             ELSE 5
           END ASC,
           sf.due_date ASC, sf.created_at ASC`, fee_id ? [targetStudentId, fee_id] : [targetStudentId]);
            for (const feeRow of pendingFeesRes.rows) {
                if (remainingAmountToDistribute <= 0)
                    break;
                const feeDue = parseFloat(feeRow.amount_due || '0');
                const currentPaid = parseFloat(feeRow.total_paid || '0');
                const unpaid = Math.max(0, feeDue - currentPaid);
                if (unpaid > 0) {
                    const payPortion = Math.min(remainingAmountToDistribute, unpaid);
                    const pRes = yield client.query(`INSERT INTO payments (student_fee_id, parent_id, amount_paid, payment_method, razorpay_order_id, razorpay_payment_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [
                        feeRow.id,
                        parentId,
                        payPortion,
                        payment_method || 'Cash',
                        finalReceiptNo,
                        transaction_ref || 'OFFLINE'
                    ]);
                    if (!primaryPaymentRecord) {
                        primaryPaymentRecord = pRes.rows[0];
                    }
                    remainingAmountToDistribute = Math.round((remainingAmountToDistribute - payPortion) * 100) / 100;
                    const newTotalPaid = currentPaid + payPortion;
                    const newStatus = Math.round(newTotalPaid * 100) >= Math.round(feeDue * 100)
                        ? 'paid'
                        : (newTotalPaid > 0 ? 'partial' : 'pending');
                    yield client.query('UPDATE student_fees SET status = $1 WHERE id = $2', [newStatus, feeRow.id]);
                }
            }
        }
        // If still remainingAmountToDistribute > 0 (advance or no fees)
        if (remainingAmountToDistribute > 0 && targetStudentId) {
            const anyFeeRes = yield client.query(`SELECT id FROM student_fees WHERE student_id = $1 ORDER BY due_date DESC LIMIT 1`, [targetStudentId]);
            let targetId = null;
            if (anyFeeRes.rows.length > 0) {
                targetId = anyFeeRes.rows[0].id;
            }
            else {
                const fsRes = yield client.query(`INSERT INTO fee_structures (fee_type, amount) VALUES ('Tuition Fee', $1) RETURNING id`, [paymentAmount]);
                const sfRes = yield client.query(`INSERT INTO student_fees (student_id, fee_structure_id, amount_due, status, due_date)
           VALUES ($1, $2, $3, 'paid', CURRENT_DATE) RETURNING id`, [targetStudentId, fsRes.rows[0].id, paymentAmount]);
                targetId = sfRes.rows[0].id;
            }
            const pRes = yield client.query(`INSERT INTO payments (student_fee_id, parent_id, amount_paid, payment_method, razorpay_order_id, razorpay_payment_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [
                targetId,
                parentId,
                remainingAmountToDistribute,
                payment_method || 'Cash',
                finalReceiptNo,
                transaction_ref || 'OFFLINE'
            ]);
            if (!primaryPaymentRecord) {
                primaryPaymentRecord = pRes.rows[0];
            }
        }
        yield client.query('COMMIT');
        res.status(200).json({
            message: 'Payment recorded successfully',
            data: primaryPaymentRecord || { amount_paid: paymentAmount, razorpay_order_id: finalReceiptNo }
        });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.verifyPayment = verifyPayment;
const assignFee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield database_1.pool.connect();
    try {
        const { fee_type, amount, grade, student_id, due_date, utr_number, initial_paid_amount, payment_method, bulk_items } = req.body;
        // Support either single fee or bulk_items array from Excel import
        const itemsToAssign = Array.isArray(bulk_items) && bulk_items.length > 0
            ? bulk_items
            : [{ fee_type, amount: parseFloat(amount), due_date, grade }];
        if (itemsToAssign.length === 0 || !itemsToAssign[0].fee_type || isNaN(itemsToAssign[0].amount)) {
            res.status(400).json({ error: 'Missing required fee structure details (fee_type, amount, due_date)' });
            return;
        }
        if (!grade && !student_id && (!bulk_items || bulk_items.length === 0)) {
            res.status(400).json({ error: 'Must provide either grade or student_id' });
            return;
        }
        yield client.query('BEGIN');
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || (req.body.school_id ? String(req.body.school_id) : undefined);
        let students = [];
        if (student_id) {
            // Assign to a specific student strictly in tenant school
            const studentResult = yield client.query(`SELECT id FROM students WHERE id = $1 ${tenantSchoolId ? 'AND school_id = $2' : ''}`, tenantSchoolId ? [student_id, tenantSchoolId] : [student_id]);
            if (studentResult.rows.length === 0) {
                throw new Error('Student not found in your branch');
            }
            students = studentResult.rows;
        }
        else if (grade && grade !== 'All') {
            // Assign to specific grade strictly in tenant school
            const studentsResult = yield client.query(`SELECT id FROM students WHERE grade = $1 AND (is_active IS NULL OR is_active = true) ${tenantSchoolId ? 'AND school_id = $2' : ''}`, tenantSchoolId ? [grade, tenantSchoolId] : [grade]);
            students = studentsResult.rows;
        }
        else {
            // Assign to ALL active students strictly in tenant school
            const studentsResult = yield client.query(`SELECT id FROM students WHERE (is_active IS NULL OR is_active = true) ${tenantSchoolId ? 'AND school_id = $1' : ''}`, tenantSchoolId ? [tenantSchoolId] : []);
            students = studentsResult.rows;
        }
        if (students.length === 0) {
            yield client.query('ROLLBACK');
            res.status(404).json({ error: 'No active students found matching the selected grade/target in your branch' });
            return;
        }
        const initPaid = parseFloat(initial_paid_amount || '0');
        const finalUtr = utr_number ? String(utr_number).trim() : null;
        // Loop through each fee item (single or from Excel import)
        const createdStudentFees = [];
        for (const item of itemsToAssign) {
            const itemGrade = item.grade || grade || null;
            const fsResult = yield client.query(`INSERT INTO fee_structures (fee_type, amount, grade, school_id) VALUES ($1, $2, $3, $4) RETURNING id`, [item.fee_type, item.amount, itemGrade, tenantSchoolId]);
            const feeStructureId = fsResult.rows[0].id;
            for (const student of students) {
                const itemDueDate = item.due_date || due_date || new Date().toISOString().split('T')[0];
                const sfResult = yield client.query(`INSERT INTO student_fees (student_id, fee_structure_id, amount_due, due_date, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING id`, [student.id, feeStructureId, item.amount, itemDueDate]);
                createdStudentFees.push({
                    id: sfResult.rows[0].id,
                    student_id: student.id,
                    amount_due: parseFloat(item.amount.toString()),
                    due_date: itemDueDate,
                    fee_type: item.fee_type
                });
            }
        }
        // If initial payment with UTR number or cash was provided for a single student
        if (initPaid > 0 && student_id) {
            let remainingInitPaid = initPaid;
            const branchId = tenantSchoolId ? parseInt(tenantSchoolId) : undefined;
            const recNo = yield (0, exports.getNextGSTReceiptNumber)('', branchId);
            const getMilestonePriority = (ft) => {
                const lower = (ft || '').toLowerCase();
                if (lower.includes('admission') || lower.includes('part 1'))
                    return 1;
                if (lower.includes('part 2') || lower.includes('5th may'))
                    return 2;
                if (lower.includes('term 1'))
                    return 3;
                if (lower.includes('term 2'))
                    return 4;
                return 5;
            };
            // Sort by milestone priority first (Admission -> May Split -> Term 1 -> Term 2) then due_date
            const studentCreatedFees = createdStudentFees
                .filter(cf => cf.student_id === student_id)
                .sort((a, b) => {
                const pA = getMilestonePriority(a.fee_type);
                const pB = getMilestonePriority(b.fee_type);
                if (pA !== pB)
                    return pA - pB;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            });
            for (const sf of studentCreatedFees) {
                if (remainingInitPaid <= 0)
                    break;
                const payPortion = Math.min(remainingInitPaid, sf.amount_due);
                yield client.query(`INSERT INTO payments (student_fee_id, amount_paid, payment_method, razorpay_order_id, razorpay_payment_id)
           VALUES ($1, $2, $3, $4, $5)`, [
                    sf.id,
                    payPortion,
                    payment_method || 'Online / UPI (UTR)',
                    recNo,
                    finalUtr || 'OFFLINE'
                ]);
                remainingInitPaid = Math.round((remainingInitPaid - payPortion) * 100) / 100;
                const newStatus = payPortion >= sf.amount_due ? 'paid' : 'partial';
                yield client.query(`UPDATE student_fees SET status = $1 WHERE id = $2`, [newStatus, sf.id]);
            }
        }
        yield client.query('COMMIT');
        res.status(201).json({
            message: `Fee structure assigned to ${students.length} student(s) successfully${finalUtr ? ` with UTR #${finalUtr}` : ''}`
        });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Assign fee error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.assignFee = assignFee;
// ─── GET ALL STUDENTS FEE SUMMARY & PENDING REPORT ──────────────────────────
const getAllStudentsFeeSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, grade, school_id } = req.query;
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || (school_id && school_id !== 'All' ? String(school_id) : undefined);
        let query = `
      SELECT 
        s.id AS student_id,
        s.first_name,
        s.last_name,
        s.admission_number,
        s.grade,
        s.profile_image_url,
        sch.name AS school_name,
        p.name AS parent_name,
        p.contact_number AS parent_phone,
        sf_due.earliest_due_date,
        COALESCE(sf_sum.total_due, 0) AS total_due,
        COALESCE(p_sum.total_paid, 0) AS total_paid,
        (COALESCE(sf_sum.total_due, 0) - COALESCE(p_sum.total_paid, 0)) AS balance,
        CASE 
          WHEN COALESCE(sf_sum.total_due, 0) = 0 THEN 'NO_FEE'
          WHEN (COALESCE(sf_sum.total_due, 0) - COALESCE(p_sum.total_paid, 0)) <= 0 THEN 'PAID'
          WHEN COALESCE(p_sum.total_paid, 0) > 0 THEN 'PARTIAL'
          ELSE 'PENDING'
        END AS fee_status
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN parents p ON s.parent_id = p.id
      LEFT JOIN (
        SELECT student_id, SUM(amount_due) AS total_due
        FROM student_fees
        GROUP BY student_id
      ) sf_sum ON s.id = sf_sum.student_id
      LEFT JOIN (
        SELECT student_id, MIN(due_date) AS earliest_due_date
        FROM student_fees
        WHERE status != 'paid'
        GROUP BY student_id
      ) sf_due ON s.id = sf_due.student_id
      LEFT JOIN (
        SELECT sf.student_id, SUM(p.amount_paid) AS total_paid
        FROM payments p
        JOIN student_fees sf ON p.student_fee_id = sf.id
        GROUP BY sf.student_id
      ) p_sum ON s.id = p_sum.student_id
      WHERE s.is_active = true
    `;
        const params = [];
        let idx = 1;
        if (tenantSchoolId) {
            query += ` AND s.school_id = $${idx++}`;
            params.push(tenantSchoolId);
        }
        else if (!isSuper) {
            res.status(200).json({
                summary: { totalExpected: 0, totalCollected: 0, totalPending: 0, defaultersCount: 0, totalStudents: 0 },
                data: []
            });
            return;
        }
        if (search) {
            query += ` AND (LOWER(s.first_name) LIKE $${idx} OR LOWER(s.last_name) LIKE $${idx} OR LOWER(s.admission_number) LIKE $${idx})`;
            params.push(`%${search.toLowerCase()}%`);
            idx++;
        }
        if (grade && grade !== 'All') {
            query += ` AND s.grade = $${idx}`;
            params.push(grade);
            idx++;
        }
        query += ' ORDER BY balance DESC, s.first_name ASC';
        const result = yield database_1.pool.query(query, params);
        let totalExpected = 0;
        let totalCollected = 0;
        let totalPending = 0;
        let defaultersCount = 0;
        result.rows.forEach(row => {
            const due = parseFloat(row.total_due);
            const paid = parseFloat(row.total_paid);
            const bal = parseFloat(row.balance);
            totalExpected += due;
            totalCollected += paid;
            if (bal > 0) {
                totalPending += bal;
                defaultersCount++;
            }
        });
        res.status(200).json({
            summary: {
                totalExpected,
                totalCollected,
                totalPending,
                defaultersCount,
                totalStudents: result.rows.length,
            },
            data: result.rows,
        });
    }
    catch (error) {
        console.error('Get all students fee summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllStudentsFeeSummary = getAllStudentsFeeSummary;
// ─── GENERATE RECEIPT ──────────────────────────────────────────────────────────
const getReceipt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { payment_id } = req.params;
        const result = yield database_1.pool.query(`SELECT p.*, sf.amount_due, fs.fee_type,
              s.first_name || ' ' || s.last_name AS student_name,
              sch.name AS school_name, sch.address AS school_address
       FROM payments p
       JOIN student_fees sf ON p.student_fee_id = sf.id
       JOIN fee_structures fs ON sf.fee_structure_id = fs.id
       JOIN students s ON sf.student_id = s.id
       LEFT JOIN schools sch ON s.school_id = sch.id
       WHERE p.id = $1`, [payment_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Receipt not found' });
            return;
        }
        res.status(200).json({ data: result.rows[0] });
    }
    catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getReceipt = getReceipt;
// ─── GET STUDENT PAYMENT LEDGER ──────────────────────────────────────────────
const getStudentLedger = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentIdParam = (req.params.student_id || req.query.student_id);
        let studentIdStr = Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam;
        if ((!studentIdStr || studentIdStr === 'undefined' || studentIdStr === 'my') && req.user) {
            if (req.user.role === 'parent' || req.user.role === 'student') {
                const parentEmail = (req.user.email || '').toLowerCase().trim();
                const stRes = yield database_1.pool.query(`SELECT s.id FROM students s
           LEFT JOIN parents p ON s.parent_id = p.id
           WHERE LOWER(p.email) = $1 
              OR s.parent_id = $2
              OR s.id = $2
              OR ($1 = 'parent@eduneev.com' AND LOWER(p.email) = 'parent.chinchwad@eduneev.com')
           ORDER BY s.created_at ASC 
           LIMIT 1`, [parentEmail, req.user.id]).catch(() => ({ rows: [] }));
                if (stRes.rows.length > 0) {
                    studentIdStr = stRes.rows[0].id;
                }
            }
        }
        if (!studentIdStr || !UUID_REGEX.test(studentIdStr)) {
            res.status(400).json({ error: 'Valid student_id is required' });
            return;
        }
        // Student info
        const stInfoRes = yield database_1.pool.query(`SELECT s.id, s.first_name, s.last_name, s.admission_number, s.grade, sch.name AS school_name
       FROM students s
       LEFT JOIN schools sch ON s.school_id = sch.id
       WHERE s.id = $1`, [studentIdStr]);
        // Total fees assigned with total_paid per fee structure
        const feesRes = yield database_1.pool.query(`SELECT sf.id, sf.amount_due, sf.status, sf.due_date, fs.fee_type,
              COALESCE(SUM(p.amount_paid), 0) AS total_paid
       FROM student_fees sf
       JOIN fee_structures fs ON sf.fee_structure_id = fs.id
       LEFT JOIN payments p ON p.student_fee_id = sf.id
       WHERE sf.student_id = $1
       GROUP BY sf.id, fs.fee_type
       ORDER BY 
         CASE 
           WHEN LOWER(fs.fee_type) LIKE '%admission%' OR LOWER(fs.fee_type) LIKE '%part 1%' THEN 1
           WHEN LOWER(fs.fee_type) LIKE '%part 2%' OR LOWER(fs.fee_type) LIKE '%5th may%' THEN 2
           WHEN LOWER(fs.fee_type) LIKE '%term 1%' THEN 3
           WHEN LOWER(fs.fee_type) LIKE '%term 2%' THEN 4
           ELSE 5
         END ASC,
         sf.due_date ASC, sf.created_at ASC`, [studentIdStr]);
        const totalDue = feesRes.rows.reduce((sum, r) => sum + parseFloat(r.amount_due || '0'), 0);
        // Payments ordered chronologically for calculating running balance
        const paymentsRes = yield database_1.pool.query(`SELECT p.id, p.student_fee_id, p.amount_paid, p.payment_method,
              p.razorpay_order_id AS receipt_no,
              p.razorpay_payment_id AS transaction_ref,
              p.created_at,
              fs.fee_type,
              s.first_name, s.last_name, s.admission_number, s.grade,
              sch.name AS school_name
       FROM payments p
       JOIN student_fees sf ON p.student_fee_id = sf.id
       JOIN fee_structures fs ON sf.fee_structure_id = fs.id
       JOIN students s ON sf.student_id = s.id
       LEFT JOIN schools sch ON s.school_id = sch.id
       WHERE sf.student_id = $1
       ORDER BY p.created_at ASC, p.id ASC`, [studentIdStr]);
        let cumulativePaid = 0;
        const transactions = paymentsRes.rows.map((p, idx) => {
            const amt = parseFloat(p.amount_paid || '0');
            cumulativePaid += amt;
            const balanceAfter = Math.max(0, Math.round((totalDue - cumulativePaid) * 100) / 100);
            return {
                id: p.id,
                student_fee_id: p.student_fee_id,
                receipt_no: p.receipt_no || `REC-EDN-2026-${String(idx + 1).padStart(3, '0')}`,
                date: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                date_paid: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                amount: amt,
                amount_paid: amt,
                paid_amount: amt,
                payment_method: p.payment_method || 'Cash',
                mode: p.payment_method || 'Cash',
                ref_no: p.transaction_ref || 'OFFLINE',
                reference: p.transaction_ref || 'OFFLINE',
                feeType: p.fee_type || 'Tuition Fee',
                title: p.fee_type || 'Tuition Fee',
                balance_after: balanceAfter,
                studentName: `${p.first_name} ${p.last_name}`.trim(),
                admissionNo: p.admission_number || '-',
                grade: p.grade || '-',
                schoolName: p.school_name || ''
            };
        });
        // Show recent transactions first for user convenience in transaction log
        const recentTransactionsFirst = [...transactions].reverse();
        res.status(200).json({
            student: stInfoRes.rows[0] || null,
            total_due: totalDue,
            total_paid: cumulativePaid,
            balance: Math.max(0, Math.round((totalDue - cumulativePaid) * 100) / 100),
            fees: feesRes.rows,
            transactions: recentTransactionsFirst
        });
    }
    catch (error) {
        console.error('Get student ledger error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getStudentLedger = getStudentLedger;
const triggerFeeRemindersHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const summary = yield (0, feeReminder_service_1.checkAndSendFeeReminders)();
        res.status(200).json({
            message: 'Fee reminders process completed successfully',
            data: summary
        });
    }
    catch (error) {
        console.error('Trigger fee reminders error:', error);
        res.status(500).json({ error: 'Internal server error while sending fee reminders' });
    }
});
exports.triggerFeeRemindersHandler = triggerFeeRemindersHandler;
const getPendingFeeRemindersHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const summary = yield (0, feeReminder_service_1.getPendingFeeRemindersSummary)();
        res.status(200).json({
            data: summary
        });
    }
    catch (error) {
        console.error('Get pending fee reminders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getPendingFeeRemindersHandler = getPendingFeeRemindersHandler;

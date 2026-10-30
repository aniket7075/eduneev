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
exports.applyStructureToStudents = exports.resetFranchiseFeeStructure = exports.saveFranchiseFeeStructure = exports.getFranchiseFeeStructures = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const getFranchiseFeeStructures = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id, academic_year = '2026-2027', compare } = req.query;
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        // If comparing all branches side-by-side
        if (compare === 'true') {
            const allSchools = yield database_1.pool.query(`SELECT id, name, contact_phone, city FROM schools ORDER BY name ASC`);
            const allStructures = yield database_1.pool.query(`SELECT * FROM franchise_fee_structures WHERE academic_year = $1 ORDER BY grade ASC`, [academic_year]);
            res.status(200).json({
                success: true,
                schools: allSchools.rows,
                structures: allStructures.rows
            });
            return;
        }
        // Determine target school ID
        let targetSchoolId = null;
        if (school_id && school_id !== 'all' && school_id !== 'default') {
            targetSchoolId = String(school_id);
        }
        else if (!isSuper && tenantSchoolId) {
            targetSchoolId = tenantSchoolId;
        }
        // Fetch master default structures (school_id IS NULL)
        let defaultRes = yield database_1.pool.query(`SELECT * FROM franchise_fee_structures 
       WHERE school_id IS NULL AND academic_year = $1 
       ORDER BY CASE 
         WHEN grade = 'Playgroup' THEN 1
         WHEN grade = 'Nursery' THEN 2
         WHEN grade = 'LKG' THEN 3
         WHEN grade = 'UKG' THEN 4
         WHEN grade = 'Daycare' THEN 5
         ELSE 6 END ASC`, [academic_year]);
        // If no template exists yet for a new academic year, auto-fallback to active master template
        if (defaultRes.rows.length === 0) {
            defaultRes = yield database_1.pool.query(`SELECT * FROM franchise_fee_structures 
         WHERE school_id IS NULL AND academic_year = '2026-2027' 
         ORDER BY CASE 
           WHEN grade = 'Playgroup' THEN 1
           WHEN grade = 'Nursery' THEN 2
           WHEN grade = 'LKG' THEN 3
           WHEN grade = 'UKG' THEN 4
           WHEN grade = 'Daycare' THEN 5
           ELSE 6 END ASC`);
        }
        const defaultMap = new Map();
        defaultRes.rows.forEach(row => defaultMap.set(row.grade, row));
        // If specific school requested
        let schoolInfo = null;
        let customRows = [];
        if (targetSchoolId) {
            const sRes = yield database_1.pool.query(`SELECT id, name, contact_phone, address, city FROM schools WHERE id = $1`, [targetSchoolId]);
            if (sRes.rows.length > 0) {
                schoolInfo = sRes.rows[0];
            }
            const customRes = yield database_1.pool.query(`SELECT * FROM franchise_fee_structures 
         WHERE school_id = $1 AND academic_year = $2 
         ORDER BY CASE 
           WHEN grade = 'Playgroup' THEN 1
           WHEN grade = 'Nursery' THEN 2
           WHEN grade = 'LKG' THEN 3
           WHEN grade = 'UKG' THEN 4
           WHEN grade = 'Daycare' THEN 5
           ELSE 6 END ASC`, [targetSchoolId, academic_year]);
            customRows = customRes.rows;
        }
        const customMap = new Map();
        customRows.forEach(row => customMap.set(row.grade, row));
        const grades = ['Playgroup', 'Nursery', 'LKG', 'UKG', 'Daycare'];
        const mergedStructures = grades.map(grade => {
            const custom = customMap.get(grade);
            const def = defaultMap.get(grade);
            if (custom) {
                return Object.assign(Object.assign({}, custom), { is_custom_override: true, has_custom: true });
            }
            else if (def) {
                return Object.assign(Object.assign({}, def), { school_id: targetSchoolId, is_custom_override: false, has_custom: false });
            }
            return null;
        }).filter(Boolean);
        res.status(200).json({
            success: true,
            academic_year,
            school: schoolInfo,
            targetSchoolId,
            isDefault: !targetSchoolId,
            data: mergedStructures,
            defaults: defaultRes.rows
        });
    }
    catch (error) {
        console.error('Get franchise fee structures error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getFranchiseFeeStructures = getFranchiseFeeStructures;
const saveFranchiseFeeStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const { school_id, academic_year = '2026-2027', grade, annual_fee, annual_admission_split, annual_may_split, term1_fee, term1_early_bird, term1_due_date = '2026-06-05', term2_fee, term2_early_bird, term2_due_date = '2026-10-05', total_installments, total_early_installments, lump_sum_fee, lump_sum_early_bird, early_bird_deadline = '2026-07-15', notes, admission_requirements } = req.body;
        if (!grade) {
            res.status(400).json({ error: 'Grade is required' });
            return;
        }
        // Determine target school ID
        let targetSchoolId = null;
        if (school_id && school_id !== 'default' && school_id !== 'all') {
            targetSchoolId = String(school_id);
        }
        else if (!isSuper && tenantSchoolId) {
            targetSchoolId = tenantSchoolId;
        }
        else if (!isSuper) {
            targetSchoolId = tenantSchoolId;
        }
        // Non-super admins cannot edit default templates (school_id IS NULL)
        if (!targetSchoolId && !isSuper) {
            res.status(403).json({ error: 'Only Super Admin can modify the Master Default template' });
            return;
        }
        // Calculate totals if missing
        const annual = parseFloat(annual_fee || 0);
        const t1 = parseFloat(term1_fee || 0);
        const t2 = parseFloat(term2_fee || 0);
        const calculatedInstallments = total_installments ? parseFloat(total_installments) : (annual + t1 + t2);
        const t1Early = parseFloat(term1_early_bird || 0);
        const t2Early = parseFloat(term2_early_bird || 0);
        const calculatedEarlyInstallments = total_early_installments ? parseFloat(total_early_installments) : (annual + t1Early + t2Early);
        const calculatedLump = lump_sum_fee ? parseFloat(lump_sum_fee) : (calculatedInstallments - 500);
        const calculatedEarlyLump = lump_sum_early_bird ? parseFloat(lump_sum_early_bird) : (calculatedEarlyInstallments - 500);
        if (targetSchoolId) {
            // Upsert for specific branch
            const result = yield database_1.pool.query(`INSERT INTO franchise_fee_structures (
          school_id, academic_year, grade, annual_fee, annual_admission_split, annual_may_split,
          term1_fee, term1_early_bird, term1_due_date, term2_fee, term2_early_bird, term2_due_date,
          total_installments, total_early_installments, lump_sum_fee, lump_sum_early_bird,
          early_bird_deadline, notes, admission_requirements, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, NOW()
        )
        ON CONFLICT (school_id, academic_year, grade) WHERE school_id IS NOT NULL
        DO UPDATE SET
          annual_fee = EXCLUDED.annual_fee,
          annual_admission_split = EXCLUDED.annual_admission_split,
          annual_may_split = EXCLUDED.annual_may_split,
          term1_fee = EXCLUDED.term1_fee,
          term1_early_bird = EXCLUDED.term1_early_bird,
          term1_due_date = EXCLUDED.term1_due_date,
          term2_fee = EXCLUDED.term2_fee,
          term2_early_bird = EXCLUDED.term2_early_bird,
          term2_due_date = EXCLUDED.term2_due_date,
          total_installments = EXCLUDED.total_installments,
          total_early_installments = EXCLUDED.total_early_installments,
          lump_sum_fee = EXCLUDED.lump_sum_fee,
          lump_sum_early_bird = EXCLUDED.lump_sum_early_bird,
          early_bird_deadline = EXCLUDED.early_bird_deadline,
          notes = EXCLUDED.notes,
          admission_requirements = EXCLUDED.admission_requirements,
          updated_at = NOW()
        RETURNING *`, [
                targetSchoolId, academic_year, grade, annual, annual_admission_split || (annual / 2), annual_may_split || (annual / 2),
                t1, t1Early, term1_due_date, t2, t2Early, term2_due_date,
                calculatedInstallments, calculatedEarlyInstallments, calculatedLump, calculatedEarlyLump,
                early_bird_deadline, notes, admission_requirements
            ]);
            res.status(200).json({ success: true, message: `Fee structure for ${grade} updated for franchise`, data: result.rows[0] });
        }
        else {
            // Upsert for Master Default Template
            const result = yield database_1.pool.query(`INSERT INTO franchise_fee_structures (
          school_id, academic_year, grade, annual_fee, annual_admission_split, annual_may_split,
          term1_fee, term1_early_bird, term1_due_date, term2_fee, term2_early_bird, term2_due_date,
          total_installments, total_early_installments, lump_sum_fee, lump_sum_early_bird,
          early_bird_deadline, notes, admission_requirements, updated_at
        ) VALUES (
          null, $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18, NOW()
        )
        ON CONFLICT (academic_year, grade) WHERE school_id IS NULL
        DO UPDATE SET
          annual_fee = EXCLUDED.annual_fee,
          annual_admission_split = EXCLUDED.annual_admission_split,
          annual_may_split = EXCLUDED.annual_may_split,
          term1_fee = EXCLUDED.term1_fee,
          term1_early_bird = EXCLUDED.term1_early_bird,
          term1_due_date = EXCLUDED.term1_due_date,
          term2_fee = EXCLUDED.term2_fee,
          term2_early_bird = EXCLUDED.term2_early_bird,
          term2_due_date = EXCLUDED.term2_due_date,
          total_installments = EXCLUDED.total_installments,
          total_early_installments = EXCLUDED.total_early_installments,
          lump_sum_fee = EXCLUDED.lump_sum_fee,
          lump_sum_early_bird = EXCLUDED.lump_sum_early_bird,
          early_bird_deadline = EXCLUDED.early_bird_deadline,
          notes = EXCLUDED.notes,
          admission_requirements = EXCLUDED.admission_requirements,
          updated_at = NOW()
        RETURNING *`, [
                academic_year, grade, annual, annual_admission_split || (annual / 2), annual_may_split || (annual / 2),
                t1, t1Early, term1_due_date, t2, t2Early, term2_due_date,
                calculatedInstallments, calculatedEarlyInstallments, calculatedLump, calculatedEarlyLump,
                early_bird_deadline, notes, admission_requirements
            ]);
            res.status(200).json({ success: true, message: `Master template fee structure for ${grade} updated`, data: result.rows[0] });
        }
    }
    catch (error) {
        console.error('Save franchise fee structure error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.saveFranchiseFeeStructure = saveFranchiseFeeStructure;
const resetFranchiseFeeStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { school_id, grade, academic_year = '2026-2027' } = req.body;
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const targetSchoolId = school_id || tenantSchoolId;
        if (!targetSchoolId) {
            res.status(400).json({ error: 'Valid franchise school_id is required to reset' });
            return;
        }
        if (!isSuper && tenantSchoolId && tenantSchoolId !== targetSchoolId) {
            res.status(403).json({ error: 'Cannot modify other franchise fee structures' });
            return;
        }
        if (grade && grade !== 'All') {
            yield database_1.pool.query(`DELETE FROM franchise_fee_structures WHERE school_id = $1 AND academic_year = $2 AND grade = $3`, [targetSchoolId, academic_year, grade]);
        }
        else {
            yield database_1.pool.query(`DELETE FROM franchise_fee_structures WHERE school_id = $1 AND academic_year = $2`, [targetSchoolId, academic_year]);
        }
        res.status(200).json({ success: true, message: 'Branch fee structure reset back to master template' });
    }
    catch (error) {
        console.error('Reset franchise fee structure error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.resetFranchiseFeeStructure = resetFranchiseFeeStructure;
const applyStructureToStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield database_1.pool.connect();
    try {
        const { school_id, grade, academic_year = '2026-2027', apply_discount = false } = req.body;
        const isSuper = (0, auth_middleware_1.isSuperAdminUser)(req);
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        const targetSchoolId = school_id || tenantSchoolId;
        if (!targetSchoolId) {
            res.status(400).json({ error: 'Branch / School ID is required' });
            return;
        }
        if (!isSuper && tenantSchoolId && tenantSchoolId !== targetSchoolId) {
            res.status(403).json({ error: 'Access denied: Target branch mismatch' });
            return;
        }
        if (!grade) {
            res.status(400).json({ error: 'Grade is required' });
            return;
        }
        // Fetch the effective fee structure for this school & grade
        let structRes = yield client.query(`SELECT * FROM franchise_fee_structures WHERE school_id = $1 AND grade = $2 AND academic_year = $3`, [targetSchoolId, grade, academic_year]);
        if (structRes.rows.length === 0) {
            // Fallback to default
            structRes = yield client.query(`SELECT * FROM franchise_fee_structures WHERE school_id IS NULL AND grade = $1 AND academic_year = $2`, [grade, academic_year]);
        }
        if (structRes.rows.length === 0) {
            // Fallback to active master template
            structRes = yield client.query(`SELECT * FROM franchise_fee_structures WHERE school_id IS NULL AND grade = $1 AND academic_year = '2026-2027'`, [grade]);
        }
        if (structRes.rows.length === 0) {
            res.status(404).json({ error: `No fee structure found for ${grade}` });
            return;
        }
        const struct = structRes.rows[0];
        // Get active students of this grade in this branch
        // Grade matching may be 'LKG' or 'Jr KG', 'UKG' or 'Sr KG'
        let gradeAliases = [grade];
        if (grade === 'LKG')
            gradeAliases.push('Jr KG', 'Junior KG');
        if (grade === 'UKG')
            gradeAliases.push('Sr KG', 'Senior KG');
        if (grade === 'Playgroup')
            gradeAliases.push('Play Group', 'PG');
        const studentsRes = yield client.query(`SELECT id, first_name, last_name FROM students 
       WHERE school_id = $1 AND (grade = ANY($2) OR grade ILIKE ANY($3)) AND (is_active IS NULL OR is_active = true)`, [targetSchoolId, gradeAliases, gradeAliases.map(g => `%${g}%`)]);
        const students = studentsRes.rows;
        if (students.length === 0) {
            res.status(404).json({ error: `No active students found in branch for grade ${grade}` });
            return;
        }
        yield client.query('BEGIN');
        // Prepare fee items:
        // 1. Annual Fees + IK + SM (Split 1: On Admission, Split 2: 5th May)
        // 2. Term 1 (Due 5th June)
        // 3. Term 2 (Due 5th Oct)
        const t1Amount = apply_discount ? parseFloat(struct.term1_early_bird) : parseFloat(struct.term1_fee);
        const t2Amount = apply_discount ? parseFloat(struct.term2_early_bird) : parseFloat(struct.term2_fee);
        const feeItems = [
            {
                fee_type: 'Annual Fee + IK + SM (Part 1 - On Admission)',
                amount: parseFloat(struct.annual_admission_split || struct.annual_fee / 2),
                due_date: new Date().toISOString().split('T')[0]
            },
            {
                fee_type: 'Annual Fee + IK + SM (Part 2 - 5th May)',
                amount: parseFloat(struct.annual_may_split || struct.annual_fee / 2),
                due_date: '2026-05-05'
            },
            {
                fee_type: `Term 1 Fee${apply_discount ? ' (Early Bird)' : ''}`,
                amount: t1Amount,
                due_date: struct.term1_due_date || '2026-06-05'
            },
            {
                fee_type: `Term 2 Fee${apply_discount ? ' (Early Bird)' : ''}`,
                amount: t2Amount,
                due_date: struct.term2_due_date || '2026-10-05'
            }
        ];
        let assignedCount = 0;
        for (const item of feeItems) {
            const fsRes = yield client.query(`INSERT INTO fee_structures (fee_type, amount, grade, school_id) VALUES ($1, $2, $3, $4) RETURNING id`, [item.fee_type, item.amount, grade, targetSchoolId]);
            const fsId = fsRes.rows[0].id;
            for (const st of students) {
                yield client.query(`INSERT INTO student_fees (student_id, fee_structure_id, amount_due, due_date) VALUES ($1, $2, $3, $4)`, [st.id, fsId, item.amount, item.due_date]);
                assignedCount++;
            }
        }
        yield client.query('COMMIT');
        res.status(200).json({
            success: true,
            message: `Successfully assigned ${feeItems.length} fee installments to ${students.length} students (${grade}) in branch!`,
            studentCount: students.length,
            installmentsAssigned: assignedCount
        });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Apply fee structure error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.applyStructureToStudents = applyStructureToStudents;

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.getTenantSchoolId = exports.isSuperAdminUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const database_1 = require("../config/database");
const isSuperAdminUser = (req) => {
    var _a, _b, _c, _d;
    const role = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
    const email = ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.email) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
    return role === 'super_admin' || role === 'owner' || email === 'admin@edunive.com' || email === 'admin@prescole.com';
};
exports.isSuperAdminUser = isSuperAdminUser;
/**
 * Returns the effective school_id for the request.
 * For non-super admins, this ALWAYS returns their own branch school_id,
 * ignoring any query parameter or body parameter to strictly enforce multi-tenant isolation.
 * For super admins, returns the query/body school_id (if provided), or null (meaning all branches).
 */
const getTenantSchoolId = (req) => {
    var _a, _b;
    if ((0, exports.isSuperAdminUser)(req)) {
        const querySchoolId = req.query.school_id;
        const bodySchoolId = (_a = req.body) === null || _a === void 0 ? void 0 : _a.school_id;
        const val = querySchoolId || bodySchoolId;
        if (!val || val === 'ALL' || val === 'all' || val === 'undefined' || val === 'null') {
            return null;
        }
        return val;
    }
    return ((_b = req.user) === null || _b === void 0 ? void 0 : _b.school_id) || null;
};
exports.getTenantSchoolId = getTenantSchoolId;
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Authorization token missing or invalid' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
        // If school_id is missing from token, resolve it from database
        if (!req.user.school_id && req.user.id) {
            try {
                const schoolRes = yield database_1.pool.query(`SELECT school_id FROM users WHERE id = $1 AND school_id IS NOT NULL
           UNION
           SELECT school_id FROM user_schools WHERE user_id = $1
           UNION
           SELECT school_id FROM staff_profiles WHERE user_id = $1
           LIMIT 1`, [req.user.id]);
                if (schoolRes.rows.length > 0) {
                    req.user.school_id = schoolRes.rows[0].school_id;
                }
                else {
                    // Check if email contains branch name hint
                    const emailLower = (req.user.email || '').toLowerCase();
                    let branchMatch = '';
                    if (emailLower.includes('chikhali'))
                        branchMatch = '%chikhali%';
                    else if (emailLower.includes('dudulgaon'))
                        branchMatch = '%dudulgaon%';
                    else if (emailLower.includes('chinchwad'))
                        branchMatch = '%chinchwad%';
                    if (branchMatch) {
                        const matchRes = yield database_1.pool.query('SELECT id FROM schools WHERE LOWER(name) LIKE $1 LIMIT 1', [branchMatch]);
                        if (matchRes.rows.length > 0) {
                            req.user.school_id = matchRes.rows[0].id;
                            // Persist mapping
                            yield database_1.pool.query('UPDATE users SET school_id = $1 WHERE id = $2', [matchRes.rows[0].id, req.user.id]).catch(() => null);
                            yield database_1.pool.query('INSERT INTO user_schools (user_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, matchRes.rows[0].id]).catch(() => null);
                        }
                    }
                }
            }
            catch (err) {
                console.error('Error resolving fallback school_id in auth middleware:', err);
            }
        }
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});
exports.authenticate = authenticate;

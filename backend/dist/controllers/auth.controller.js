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
exports.register = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const cleanEmail = (email || '').trim().toLowerCase();
        console.log(`Login attempt for email: ${cleanEmail}`);
        if (!cleanEmail || !password) {
            console.log('Login failed: missing email or password');
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const result = yield database_1.pool.query('SELECT * FROM users WHERE LOWER(email) = $1 AND is_active = true', [cleanEmail]);
        if (result.rows.length === 0) {
            console.log(`Login failed: user not found or inactive for email ${cleanEmail}`);
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const user = result.rows[0];
        const isValidPassword = yield bcrypt_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            console.log(`Login failed: invalid password for email ${cleanEmail}`);
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        // Update last login
        yield database_1.pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        // Query user's school / branch
        let schoolId = user.school_id || null;
        let schoolName = null;
        try {
            const schoolRes = yield database_1.pool.query(`SELECT s.id, s.name 
         FROM schools s 
         JOIN user_schools us ON us.school_id = s.id 
         WHERE us.user_id = $1
         UNION
         SELECT s.id, s.name 
         FROM schools s 
         JOIN staff_profiles sp ON sp.school_id = s.id 
         WHERE sp.user_id = $1
         UNION
         SELECT s.id, s.name
         FROM schools s
         WHERE s.id = $2
         LIMIT 1`, [user.id, user.school_id || null]);
            if (schoolRes.rows.length > 0) {
                schoolId = schoolRes.rows[0].id;
                schoolName = schoolRes.rows[0].name;
            }
            else {
                let branchQuery = '%Chinchwad%';
                if (cleanEmail.includes('chikhali')) {
                    branchQuery = '%Chikhali%';
                }
                else if (cleanEmail.includes('dudulgaon')) {
                    branchQuery = '%Dudulgaon%';
                }
                const bRes = yield database_1.pool.query('SELECT id, name FROM schools WHERE LOWER(name) LIKE LOWER($1) LIMIT 1', [branchQuery]);
                if (bRes.rows.length > 0) {
                    schoolId = bRes.rows[0].id;
                    schoolName = bRes.rows[0].name;
                    yield database_1.pool.query('UPDATE users SET school_id = $1 WHERE id = $2', [schoolId, user.id]).catch(() => null);
                    yield database_1.pool.query('INSERT INTO user_schools (user_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user.id, schoolId]).catch(() => null);
                }
                else {
                    schoolName = 'Chinchwad Branch';
                }
            }
        }
        catch (e) {
            console.error('Error resolving user school:', e);
            schoolName = 'Chinchwad Branch';
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, email: user.email, school_id: schoolId }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') });
        let childName = null;
        let className = null;
        let studentId = null;
        let childrenList = [];
        if (user.role === 'parent' || user.role === 'student') {
            const childRes = yield database_1.pool.query(`SELECT s.id, s.first_name, s.last_name, s.first_name || ' ' || s.last_name AS full_name, s.grade, s.admission_number, s.profile_image_url 
         FROM students s
         LEFT JOIN parents p ON s.parent_id = p.id
         WHERE LOWER(p.email) = $1 
            OR s.parent_id = $2
            OR s.id = $2
            OR ($1 = 'parent@eduneev.com' AND LOWER(p.email) = 'parent.chinchwad@eduneev.com')
            OR (LOWER(p.name) LIKE '%' || LOWER($3) || '%' AND s.school_id = $4)
            OR (LOWER(s.emergency_contact_name) LIKE '%' || LOWER($3) || '%' AND s.school_id = $4)
         ORDER BY s.created_at ASC`, [cleanEmail, user.id, user.first_name || '', schoolId]).catch((err) => {
                console.error('Child lookup query error:', err);
                return { rows: [] };
            });
            childrenList = childRes.rows;
            if (childRes.rows.length > 0) {
                studentId = childRes.rows[0].id;
                childName = childRes.rows[0].full_name;
                className = childRes.rows[0].grade;
            }
        }
        else if (user.role === 'teacher') {
            const teacherClassRes = yield database_1.pool.query(`SELECT id, name, section FROM classes WHERE class_teacher_id = $1 LIMIT 1`, [user.id]).catch(() => ({ rows: [] }));
            if (teacherClassRes.rows.length > 0) {
                className = teacherClassRes.rows[0].name;
            }
        }
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name,
                childName: childName || (user.first_name ? `${user.first_name}'s Child` : 'My Child'),
                student_id: studentId,
                className: className || (user.role === 'teacher' ? '' : 'Playgroup'),
                grade: className || (user.role === 'teacher' ? '' : 'Playgroup'),
                children: childrenList,
                phoneNumber: user.phone_number || null,
                profilePictureUrl: user.profile_picture_url || null,
                school_id: schoolId,
                school_name: schoolName,
                branchName: schoolName,
                allowed_screens: user.allowed_screens || null
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: (error === null || error === void 0 ? void 0 : error.message) || String(error)
        });
    }
});
exports.login = login;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, role, firstName, lastName, phoneNumber } = req.body;
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!cleanEmail || !password || !role || !firstName || !lastName) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }
        const existing = yield database_1.pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
        if (existing.rows.length > 0) {
            res.status(400).json({ error: 'Email already exists' });
            return;
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const passwordHash = yield bcrypt_1.default.hash(password, salt);
        const result = yield database_1.pool.query(`INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, first_name, last_name, phone_number, profile_picture_url`, [cleanEmail, passwordHash, role, firstName, lastName, phoneNumber || null]);
        const newUser = result.rows[0];
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                phoneNumber: newUser.phone_number || null,
                profilePictureUrl: newUser.profile_picture_url || null,
            }
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.register = register;

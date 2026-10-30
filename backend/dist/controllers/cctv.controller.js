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
exports.deleteCamera = exports.updateCamera = exports.addCamera = exports.getCameras = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const getCameras = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = (0, auth_middleware_1.isSuperAdminUser)(req);
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        let query = 'SELECT * FROM cctv_cameras ORDER BY created_at DESC';
        const params = [];
        if (tenantSchoolId) {
            query = 'SELECT * FROM cctv_cameras WHERE (school_id = $1 OR school_id IS NULL) ORDER BY created_at DESC';
            params.push(tenantSchoolId);
        }
        else {
            query = 'SELECT * FROM cctv_cameras ORDER BY created_at DESC';
        }
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get cameras error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getCameras = getCameras;
const addCamera = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, location, stream_url, status, school_id } = req.body;
        const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || school_id || null;
        const result = yield database_1.pool.query(`INSERT INTO cctv_cameras (name, location, stream_url, status, school_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [name, location, stream_url, status || 'active', resolvedSchoolId]);
        res.status(201).json({ message: 'Camera added successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Add camera error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.addCamera = addCamera;
const updateCamera = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, location, stream_url, status } = req.body;
        const result = yield database_1.pool.query(`UPDATE cctv_cameras 
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           stream_url = COALESCE($3, stream_url),
           status = COALESCE($4, status)
       WHERE id = $5 RETURNING *`, [name, location, stream_url, status, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Camera not found' });
            return;
        }
        res.status(200).json({ message: 'Camera updated successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Update camera error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateCamera = updateCamera;
const deleteCamera = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield database_1.pool.query(`DELETE FROM cctv_cameras WHERE id = $1 RETURNING id`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Camera not found' });
            return;
        }
        res.status(200).json({ message: 'Camera deleted successfully' });
    }
    catch (error) {
        console.error('Delete camera error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteCamera = deleteCamera;

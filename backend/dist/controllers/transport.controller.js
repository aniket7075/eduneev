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
exports.removeStudentTransport = exports.getRouteStudents = exports.assignStudentTransport = exports.deleteTransportRoute = exports.updateTransportRoute = exports.createTransportRoute = exports.getStudentTransport = exports.getTransportRoutes = void 0;
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const getTransportRoutes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = (0, auth_middleware_1.isSuperAdminUser)(req);
        const tenantSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req);
        let query = `
      SELECT tr.*, COUNT(st.id)::int AS assigned_students_count
      FROM transport_routes tr
      LEFT JOIN student_transport st ON tr.id = st.route_id
      GROUP BY tr.id
      ORDER BY tr.route_name ASC
    `;
        const params = [];
        if (tenantSchoolId) {
            query = `
        SELECT tr.*, COUNT(st.id)::int AS assigned_students_count
        FROM transport_routes tr
        LEFT JOIN student_transport st ON tr.id = st.route_id
        WHERE tr.school_id = $1
        GROUP BY tr.id
        ORDER BY tr.route_name ASC
      `;
            params.push(tenantSchoolId);
        }
        else if (!isSuperAdmin) {
            res.status(200).json({ data: [] });
            return;
        }
        const result = yield database_1.pool.query(query, params);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get transport routes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getTransportRoutes = getTransportRoutes;
const getStudentTransport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { student_id } = req.params;
        const result = yield database_1.pool.query(`SELECT st.*, tr.route_name, tr.driver_name, tr.driver_phone, tr.vehicle_number, tr.vehicle_type, tr.capacity
       FROM student_transport st
       JOIN transport_routes tr ON st.route_id = tr.id
       WHERE st.student_id = $1`, [student_id]);
        res.status(200).json({ data: result.rows[0] || null });
    }
    catch (error) {
        console.error('Get student transport error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getStudentTransport = getStudentTransport;
const createTransportRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { route_name, driver_name, driver_phone, vehicle_number, vehicle_type, capacity, school_id } = req.body;
    if (!route_name || !driver_name || !driver_phone || !vehicle_number || !capacity) {
        res.status(400).json({ error: 'Missing required route fields' });
        return;
    }
    const resolvedSchoolId = (0, auth_middleware_1.getTenantSchoolId)(req) || school_id || null;
    try {
        const result = yield database_1.pool.query(`INSERT INTO transport_routes (route_name, driver_name, driver_phone, vehicle_number, vehicle_type, capacity, school_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [route_name, driver_name, driver_phone, vehicle_number, vehicle_type || 'bus', parseInt(capacity), resolvedSchoolId]);
        res.status(201).json({ message: 'Transport route created successfully', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create transport route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createTransportRoute = createTransportRoute;
const updateTransportRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { route_name, driver_name, driver_phone, vehicle_number, vehicle_type, capacity } = req.body;
    if (!route_name || !driver_name || !driver_phone || !vehicle_number || !capacity) {
        res.status(400).json({ error: 'Missing required route fields' });
        return;
    }
    try {
        const result = yield database_1.pool.query(`UPDATE transport_routes 
       SET route_name = $1, driver_name = $2, driver_phone = $3, vehicle_number = $4, vehicle_type = $5, capacity = $6
       WHERE id = $7 RETURNING *`, [route_name, driver_name, driver_phone, vehicle_number, vehicle_type || 'bus', parseInt(capacity), id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Route not found' });
            return;
        }
        res.json({ message: 'Transport route updated', data: result.rows[0] });
    }
    catch (error) {
        console.error('Update transport route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateTransportRoute = updateTransportRoute;
const deleteTransportRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield database_1.pool.query(`DELETE FROM transport_routes WHERE id = $1 RETURNING id`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Route not found' });
            return;
        }
        res.json({ message: 'Transport route deleted' });
    }
    catch (error) {
        console.error('Delete transport route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteTransportRoute = deleteTransportRoute;
const assignStudentTransport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { student_id, route_id, pickup_point, pickup_time, drop_time } = req.body;
    if (!student_id || !route_id || !pickup_point) {
        res.status(400).json({ error: 'student_id, route_id, and pickup_point are required' });
        return;
    }
    try {
        const result = yield database_1.pool.query(`INSERT INTO student_transport (student_id, route_id, pickup_point, pickup_time, drop_time)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id) DO UPDATE 
       SET route_id = EXCLUDED.route_id, pickup_point = EXCLUDED.pickup_point,
           pickup_time = EXCLUDED.pickup_time, drop_time = EXCLUDED.drop_time
       RETURNING *`, [student_id, route_id, pickup_point, pickup_time || null, drop_time || null]);
        res.status(201).json({ message: 'Student transport assigned', data: result.rows[0] });
    }
    catch (error) {
        console.error('Assign transport error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.assignStudentTransport = assignStudentTransport;
const getRouteStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { route_id } = req.params;
        const result = yield database_1.pool.query(`SELECT st.id AS transport_id, st.pickup_point, st.pickup_time, st.drop_time,
              s.id AS student_id, s.first_name, s.last_name, s.admission_number, s.grade, s.profile_image_url,
              p.name AS parent_name, p.contact_number AS parent_phone
       FROM student_transport st
       JOIN students s ON st.student_id = s.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE st.route_id = $1
       ORDER BY s.first_name ASC`, [route_id]);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get route students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getRouteStudents = getRouteStudents;
const removeStudentTransport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { student_id } = req.params;
        yield database_1.pool.query('DELETE FROM student_transport WHERE student_id = $1', [student_id]);
        res.status(200).json({ message: 'Student removed from transport route' });
    }
    catch (error) {
        console.error('Remove student transport error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.removeStudentTransport = removeStudentTransport;

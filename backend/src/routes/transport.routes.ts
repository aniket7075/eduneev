import { Router } from 'express';
import { 
  getTransportRoutes, 
  getStudentTransport, 
  createTransportRoute, 
  updateTransportRoute, 
  deleteTransportRoute, 
  assignStudentTransport,
  getRouteStudents,
  removeStudentTransport 
} from '../controllers/transport.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/routes', getTransportRoutes);
router.get('/routes/:route_id/students', getRouteStudents);
router.get('/student/:student_id', getStudentTransport);

router.post('/routes', authorize(['super_admin', 'school_admin']), createTransportRoute);
router.put('/routes/:id', authorize(['super_admin', 'school_admin']), updateTransportRoute);
router.delete('/routes/:id', authorize(['super_admin', 'school_admin']), deleteTransportRoute);
router.post('/assign', authorize(['super_admin', 'school_admin']), assignStudentTransport);
router.delete('/assign/:student_id', authorize(['super_admin', 'school_admin']), removeStudentTransport);

export default router;

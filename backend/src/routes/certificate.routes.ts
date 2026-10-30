import { Router } from 'express';
import { getCertificates, applyCertificate, updateCertificateStatus } from '../controllers/certificate.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getCertificates);
router.post('/', applyCertificate);
router.put('/:id/status', updateCertificateStatus);

export default router;

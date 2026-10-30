import { Router } from 'express';
import { getBooks, addBook, getIssuedBooks, issueBook } from '../controllers/library.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/books', getBooks);
router.post('/books', addBook);
router.get('/issued/:student_id', getIssuedBooks);
router.post('/issue', issueBook);

export default router;

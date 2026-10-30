import { Router } from 'express';
import { 
  getChatRooms, 
  createRoom, 
  getRoomMembers,
  getMessages, 
  sendMessage, 
  getUnreadCount, 
  getChatStudents, 
  getOrCreateStudentRoom, 
  editMessage, 
  deleteMessage
} from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/unread', getUnreadCount);
router.get('/students', getChatStudents);
router.get('/rooms', getChatRooms);
router.get('/rooms/:room_id/members', getRoomMembers);
router.post('/rooms', createRoom);
router.post('/room/student', getOrCreateStudentRoom);
router.get('/messages/:room_id', getMessages);
router.post('/messages', sendMessage);
router.put('/messages/:id', editMessage);
router.delete('/messages/:id', deleteMessage);

export default router;


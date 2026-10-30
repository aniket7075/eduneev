import { Router } from 'express';
import {
  getAllItems, getItemById, createItem, updateItem, deleteItem, adjustStock,
  getAllOrders, createOrder, updateOrderStatus, deleteOrder,
} from '../controllers/inventory.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// Items
router.get('/items',              getAllItems);
router.get('/items/:id',          getItemById);
router.post('/items',             createItem);
router.put('/items/:id',          updateItem);
router.delete('/items/:id',       deleteItem);
router.post('/items/:id/adjust',  adjustStock);

// Orders
router.get('/orders',             getAllOrders);
router.post('/orders',            createOrder);
router.put('/orders/:id/status',  updateOrderStatus);
router.delete('/orders/:id',      deleteOrder);

export default router;

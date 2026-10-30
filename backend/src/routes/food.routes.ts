import { Router } from 'express';
import { getFoodMenus, createFoodMenu, deleteFoodMenu } from '../controllers/food.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Get menus (Accessible by all roles)
router.get('/', getFoodMenus);

// Create a Menu (Admin)
router.post('/', authorize(['super_admin', 'school_admin']), createFoodMenu);

// Delete a Menu (Admin)
router.delete('/:id', authorize(['super_admin', 'school_admin']), deleteFoodMenu);

export default router;

import { UserController } from "../controllers/User.controller.js";
import { permissions } from "../middlewares/auth.middleware.js";
import { Router } from 'express';

const User: UserController = new UserController();
const router: Router = Router();

router.post('/create', permissions.requireManager, User.create);
router.post('/update/:id', permissions.requireManager, User.update);
router.delete('/delete/:id', permissions.requireManager, User.delete);
router.post('/update-password', User.updatePassword);

export default router;
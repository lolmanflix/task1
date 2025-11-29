import { Router } from 'express';
import {
  createEmployeeHandler,
  listEmployeesHandler,
  getEmployeeHandler,
  updateEmployeeHandler,
  deleteEmployeeHandler
} from '../controllers/employee.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', createEmployeeHandler);
router.get('/', listEmployeesHandler);
router.get('/:id', getEmployeeHandler);
router.put('/:id', updateEmployeeHandler);
router.delete('/:id', deleteEmployeeHandler);

export default router;

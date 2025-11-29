import { Request, Response } from 'express';
import { z } from 'zod';
import * as service from '../services/employee.service';

const EmployeeCreate = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  position: z.string().optional(),
  salary: z.number().int().optional(),
  hire_date: z.string().optional()
});

export async function createEmployeeHandler(req: Request, res: Response) {
  const parsed = EmployeeCreate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const data = parsed.data;
  try {
    const employee = await service.createEmployee({
      ...data,
      hire_date: data.hire_date ? new Date(data.hire_date) : undefined
    });
    res.status(201).json(employee);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create employee', detail: err.message });
  }
}

export async function listEmployeesHandler(_req: Request, res: Response) {
  try {
    const list = await service.getEmployees();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list employees', detail: err.message });
  }
}

export async function getEmployeeHandler(req: Request, res: Response) {
  try {
    const emp = await service.getEmployeeById(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Not found' });
    res.json(emp);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve employee', detail: err.message });
  }
}

export async function updateEmployeeHandler(req: Request, res: Response) {
  const parsed = EmployeeCreate.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const data = parsed.data;
  try {
    const employee = await service.updateEmployee(req.params.id, {
      ...data,
      hire_date: data.hire_date ? new Date(data.hire_date as any) : undefined
    });
    res.json(employee);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update employee', detail: err.message });
  }
}

export async function deleteEmployeeHandler(req: Request, res: Response) {
  try {
    await service.deleteEmployee(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete employee', detail: err.message });
  }
}

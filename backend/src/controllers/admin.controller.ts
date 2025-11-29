import { Request, Response } from 'express';
import { z } from 'zod';
import * as service from '../services/admin.service';

const CreateAdmin = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function listAdminsHandler(_req: Request, res: Response) {
  try {
    const list = await service.listAdmins();
    res.json(list.map((a) => ({ id: a.id, email: a.email, created_at: a.created_at })));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list admins', detail: err.message });
  }
}

export async function createAdminHandler(req: Request, res: Response) {
  const parsed = CreateAdmin.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  try {
    const existing = await service.listAdmins();
    if (existing.some((e) => e.email === parsed.data.email)) {
      return res.status(400).json({ error: 'Admin with that email already exists' });
    }

    const admin = await service.createAdmin(parsed.data.email, parsed.data.password);
    res.status(201).json({ id: admin.id, email: admin.email, created_at: admin.created_at });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create admin', detail: err.message });
  }
}

export async function deleteAdminHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    await service.deleteAdmin(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete admin', detail: err.message });
  }
}

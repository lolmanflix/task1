import prisma from '../prisma/client';

// In-memory fallback store for dev when DB is unreachable
const fallback: Array<any> = [];

export async function createEmployee(data: any) {
  try {
    return await prisma.employee.create({ data });
  } catch (err) {
    // create a simple in-memory item
    const newItem = { id: `dev-${Date.now()}`, ...data, created_at: new Date(), updated_at: new Date() };
    fallback.unshift(newItem);
    return newItem as any;
  }
}

export async function getEmployees() {
  try {
    return await prisma.employee.findMany({ orderBy: { created_at: 'desc' } });
  } catch (err) {
    return fallback;
  }
}

export async function getEmployeeById(id: string) {
  try {
    return await prisma.employee.findUnique({ where: { id } });
  } catch (err) {
    return fallback.find((f) => f.id === id) || null;
  }
}

export async function updateEmployee(id: string, data: any) {
  try {
    return await prisma.employee.update({ where: { id }, data });
  } catch (err) {
    const idx = fallback.findIndex((f) => f.id === id);
    if (idx === -1) throw err;
    fallback[idx] = { ...fallback[idx], ...data, updated_at: new Date() };
    return fallback[idx];
  }
}

export async function deleteEmployee(id: string) {
  try {
    return await prisma.employee.delete({ where: { id } });
  } catch (err) {
    const idx = fallback.findIndex((f) => f.id === id);
    if (idx === -1) throw err;
    const item = fallback[idx];
    fallback.splice(idx, 1);
    return item;
  }
}

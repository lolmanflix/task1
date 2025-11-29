import { test, expect } from '@playwright/test';

test('delete then undo cancels server delete, re-deleting sends server request', async ({ page }) => {
  // Mock authenticated check
  await page.route('http://localhost:4000/auth/me', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'admin-1', email: 'admin@example.com' }) })
  );

  // Mock initial employees list
  const employee = { id: 'emp-1', name: 'Alice Jones', email: 'alice@example.com', position: 'Developer', salary: 85000 };
  await page.route('http://localhost:4000/employees', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([employee]) })
  );

  // capture delete requests
  const deletes: any[] = [];
  page.on('request', (req) => {
    if (req.method() === 'DELETE' && req.url().endsWith(`/employees/${employee.id}`)) deletes.push(req);
  });

  // intercept deletes and respond ok
  await page.route(`http://localhost:4000/employees/${employee.id}`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  );

  await page.goto('/employees');

  // Row exists inside the table
  await expect(page.locator('table').getByText(employee.name)).toBeVisible();

  // Accept the confirmation dialog when deleting
  page.on('dialog', (d) => d.accept());
  // Click delete icon/button for this row
  await page.getByRole('button', { name: `Delete ${employee.name}` }).click();

  // row should be removed immediately (table cell only)
  await expect(page.locator('table').getByText(employee.name)).not.toBeVisible({ timeout: 1000 });

  // snackbar shows undo
  await expect(page.getByText(/Removed/)).toBeVisible();
  const undoBtn = page.getByRole('button', { name: 'Undo' });
  await expect(undoBtn).toBeVisible();

  // Click undo — should restore without issuing DELETE
  await undoBtn.click();
  await expect(page.locator('table').getByText(employee.name)).toBeVisible();
  expect(deletes.length).toBe(0);

  // Delete again and wait for the delete timeout to expire (7s + small buffer)
  await page.getByRole('button', { name: `Delete ${employee.name}` }).click();
  await expect(page.getByText(/Removed/)).toBeVisible();

  // wait >7s to allow finalization timer to trigger
  await page.waitForTimeout(8000);

  // ensure server received a delete request
  expect(deletes.length).toBeGreaterThanOrEqual(1);
});

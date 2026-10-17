import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('导航、搜索、实例、设置保存、诚实预览', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '飞行甲板已就绪，您负责飞我负责稳~' })).toBeVisible();
  await expect(page.getByText('预览 · 示例数据')).toBeVisible();
  await page.getByRole('button', { name: '发现本机工具', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('界面预览');
  await page.getByRole('button', { name: '我的工具', exact: false }).first().click();
  await page.getByRole('textbox', { name: '搜索名称、目录或版本…' }).fill('Codex');
  await expect(page.locator('.tool-table-row')).toHaveCount(2);
  await page.locator('.tool-table-row').first().click();
  await expect(page.locator('.inspector')).toBeVisible();
  await expect(page.locator('.inspector')).toContainText('真实 prefix');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  await page.getByRole('textbox', { name: '搜索页面或工具' }).fill('运行时');
  await page.locator('.command-results').getByRole('button', { name: '运行时' }).click();
  await expect(page.getByRole('heading', { name: 'Node.js 环境' })).toBeVisible();
  await page.getByRole('button', { name: '偏好设置', exact: true }).click();
  await page.getByRole('combobox', { name: '检查周期', exact: true }).selectOption('60');
  await page.getByRole('button', { name: '保存设置' }).click();
  await page.reload();
  await expect(page.getByRole('combobox', { name: '检查周期', exact: true })).toHaveValue('60');
  for (const name of ['个人 Skills', '探索商店', '任务记录', '总览']) {
    await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
    await expect(page.locator('main h1')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('桌面与窄屏布局截图', async ({ page }) => {
  await mkdir('.impeccable/review', { recursive: true });
  await page.goto('/');
  await expect(page.locator('.ledger-row')).toHaveCount(6);
  await page.screenshot({ path: '.impeccable/review/desktop.png', fullPage: true });
  await page.getByRole('navigation').getByRole('button', { name: '探索商店', exact: true }).click();
  await page.screenshot({ path: '.impeccable/review/store.png', fullPage: true });
  await page.getByRole('navigation').getByRole('button', { name: '总览', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '.impeccable/review/mobile.png', fullPage: true });
  for (const name of ['总览', '我的工具', '个人 Skills', '探索商店', '运行时', '任务记录']) {
    await page.getByRole('navigation').getByRole('button', { name, exact: false }).click();
    expect(
      await page.locator('main').evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
  }
});

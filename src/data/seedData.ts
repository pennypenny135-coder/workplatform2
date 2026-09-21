import type { AppData } from '../types';
import { generateId } from '../services/storageService';
import { todayHK, addDays, localToISO } from '../utils/dateUtils';

/**
 * Generate seed demo data for first-time users
 */
export function generateSeedData(): Partial<AppData> {
  const today = todayHK();
  const now = new Date().toISOString();

  const projectIds = {
    website: generateId('proj'),
    crm: generateId('proj'),
  };

  const contactIds = {
    alice: generateId('contact'),
    bob: generateId('contact'),
  };

  return {
    projects: [
      {
        id: projectIds.website,
        name: '公司網站改版',
        description: '重新設計公司官方網站，提升用戶體驗',
        status: 'active',
        color: '#3b82f6',
        dueDate: addDays(today, 30),
        progress: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: projectIds.crm,
        name: 'CRM 系統整合',
        description: '將客戶資料整合至新平台',
        status: 'planning',
        color: '#8b5cf6',
        dueDate: addDays(today, 60),
        progress: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    contacts: [
      {
        id: contactIds.alice,
        name: 'Alice Chan',
        company: 'ABC 科技有限公司',
        phone: '+852 9123 4567',
        email: 'alice@abc-tech.com',
        status: 'proposal' as const,
        lastContactDate: addDays(today, -3),
        nextFollowUpDate: today,
        notes: '對網站改版項目感興趣，等待報價確認',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: contactIds.bob,
        name: 'Bob Wong',
        company: 'XYZ 貿易',
        phone: '+852 6543 2109',
        email: 'bob@xyz-trade.com',
        status: 'contacted' as const,
        lastContactDate: addDays(today, -7),
        nextFollowUpDate: addDays(today, 3),
        notes: '初次洽談，有意向合作',
        createdAt: now,
        updatedAt: now,
      },
    ],
    tasks: [
      {
        id: generateId('task'),
        title: '回覆客戶電郵',
        description: '回覆 Alice 關於報價的查詢',
        status: 'in-progress' as const,
        priority: 'high' as const,
        dueDate: today,
        tags: ['客戶', '郵件'],
        projectId: projectIds.website,
        contactId: contactIds.alice,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId('task'),
        title: '撰寫網站設計方案',
        description: '準備網站改版的設計提案文件',
        status: 'next' as const,
        priority: 'high' as const,
        dueDate: addDays(today, 2),
        tags: ['設計', '文件'],
        projectId: projectIds.website,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId('task'),
        title: '研究 CRM 系統需求',
        description: '分析現有流程，整理系統需求',
        status: 'inbox' as const,
        priority: 'medium' as const,
        dueDate: addDays(today, 5),
        tags: ['研究'],
        projectId: projectIds.crm,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId('task'),
        title: '跟進 Bob 的合作意向',
        status: 'next' as const,
        priority: 'medium' as const,
        dueDate: addDays(today, 3),
        tags: ['客戶'],
        contactId: contactIds.bob,
        createdAt: now,
        updatedAt: now,
      },
    ],
    calendarEvents: [
      {
        id: generateId('evt'),
        title: '客戶會議 — Alice Chan',
        start: localToISO(today, '14:00'),
        end: localToISO(today, '15:00'),
        description: '討論網站改版報價及時間表',
        location: 'Google Meet',
        color: '#3b82f6',
        projectId: projectIds.website,
        contactId: contactIds.alice,
        source: 'demo',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId('evt'),
        title: '每週團隊同步',
        start: localToISO(addDays(today, 1), '10:00'),
        end: localToISO(addDays(today, 1), '11:00'),
        description: '討論本週目標與進度',
        location: '辦公室會議室',
        color: '#10b981',
        source: 'demo',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId('evt'),
        title: 'CRM 需求討論',
        start: localToISO(addDays(today, 3), '15:30'),
        end: localToISO(addDays(today, 3), '16:30'),
        color: '#8b5cf6',
        projectId: projectIds.crm,
        source: 'demo',
        createdAt: now,
        updatedAt: now,
      },
    ],
    notes: [
      {
        id: generateId('note'),
        title: '歡迎使用 Work Platform',
        content: `歡迎使用 Work Platform！

這是你的個人工作管理平台。你可以在這裡管理：

- **Dashboard** — 每日工作總覽
- **Tasks** — 待辦事項管理
- **Calendar** — 行程安排
- **Projects** — 專案管理
- **Contacts** — 客戶與聯絡人
- **Notes** — 工作筆記
- **Reports** — 工作報告
- **Settings** — 設定與資料匯入匯出

所有資料儲存在本地瀏覽器，重新整理後仍然存在。

你可以在 Settings 中匯入原有 Calendar App 的資料。`,
        tags: ['入門'],
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

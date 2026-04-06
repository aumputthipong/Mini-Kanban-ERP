import { useMemo } from "react";
import { useBoardStore } from "@/store/useBoardStore";
import type { Card } from "@/types/board";

// กำหนด Type เพิ่มเติมเผื่ออนาคต
interface ExtendedCard extends Card {
  updated_at?: string; 
}

export function useDashboardStats() {
  const { columns } = useBoardStore();

  return useMemo(() => {
    const allCards: ExtendedCard[] = columns.flatMap((col) => col.cards);
    const totalCards = allCards.length;

    // หากยังไม่มีการ์ดเลย ให้ส่งค่าว่างกลับไป
    if (totalCards === 0) {
      return {
        totalCards: 0,
        progress: 0,
        totalHours: 0,
        overdueCards: [],
        dueSoonCards: [],
        insights: ["No tasks in this project yet. Create a task to see insights."],
        workload: [],
        columnStats: columns.map((col) => ({ id: col.id, title: col.title, category: col.category, count: 0 })),
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    // สมมติว่าคอลัมน์สุดท้ายคือ Done
    const doneColumnId = columns.length > 0 ? columns[columns.length - 1].id : null;

    let doneCount = 0;
    let totalHours = 0;
    const overdueCards: ExtendedCard[] = [];
    const dueSoonCards: ExtendedCard[] = [];
    let staleCount = 0;

    // สำหรับเก็บข้อมูลว่าใครถืองานกี่ชิ้น
    const assigneeCount: Record<string, { name: string; count: number }> = {};

    allCards.forEach((card) => {
      const isDone = card.column_id === doneColumnId;
      if (isDone) doneCount++;

      if (card.estimated_hours) {
        totalHours += card.estimated_hours;
      }

      // ตรวจสอบ Workload (นับเฉพาะงานที่ยังไม่เสร็จ)
      if (!isDone && card.assignee_id && card.assignee_name) {
        if (!assigneeCount[card.assignee_id]) {
          assigneeCount[card.assignee_id] = { name: card.assignee_name, count: 0 };
        }
        assigneeCount[card.assignee_id].count++;
      }

      // ตรวจสอบ Due Date
      if (card.due_date && !isDone) {
        const dueDate = new Date(card.due_date);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          overdueCards.push(card);
        } else if (dueDate <= threeDaysFromNow) {
          dueSoonCards.push(card);
        }
      }

      // ตรวจสอบ Stale Tasks (งานที่ไม่ขยับเกิน 7 วัน)
      if (card.updated_at && !isDone) {
        const updatedAt = new Date(card.updated_at);
        const daysDiff = (today.getTime() - updatedAt.getTime()) / (1000 * 3600 * 24);
        if (daysDiff > 7) staleCount++;
      }
    });

    const progress = Math.round((doneCount / totalCards) * 100);

    // ประมวลผล Zero-Config Insights
    const insights: string[] = [];

    // 1. วิเคราะห์โอกาสเสร็จทันเวลา
    if (progress >= 60) {
      insights.push(`Project is on track with a high completion rate (${progress}% done).`);
    } else if (overdueCards.length > totalCards * 0.2) {
      insights.push(`Project is at risk: ${overdueCards.length} tasks are currently overdue.`);
    }

    // 2. วิเคราะห์คอขวด (Workload Bottleneck)
    const activeTasks = totalCards - doneCount;
    if (activeTasks > 0) {
      let maxAssignee = { name: "", count: 0 };
      for (const id in assigneeCount) {
        if (assigneeCount[id].count > maxAssignee.count) {
          maxAssignee = assigneeCount[id];
        }
      }
      
      const workloadPercentage = Math.round((maxAssignee.count / activeTasks) * 100);
      if (workloadPercentage >= 40 && maxAssignee.count > 2) {
        insights.push(`Bottleneck detected: ${maxAssignee.name} is holding ${workloadPercentage}% of active tasks.`);
      }
    }

    // 3. วิเคราะห์งานที่ถูกแช่ (Stale Tasks)
    if (staleCount > 0) {
      insights.push(`Hidden bottleneck: ${staleCount} tasks haven't seen any movement in over 7 days.`);
    }

    // สถิติการ์ดแต่ละ column สำหรับ Bottleneck Analysis
    const columnStats = columns.map((col) => ({
      id: col.id,
      title: col.title,
      category: col.category,
      count: col.cards.length,
    }));

    return {
      totalCards,
      progress,
      totalHours,
      overdueCards,
      dueSoonCards,
      insights,
      workload: Object.values(assigneeCount).sort((a, b) => b.count - a.count),
      columnStats,
    };
  }, [columns]);
}
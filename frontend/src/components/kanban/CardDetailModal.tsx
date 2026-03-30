"use client";

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Avatar } from "@mui/material";
import { Clock, Calendar } from "lucide-react";
import type { Card } from "@/types/board";

interface CardDetailModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
}

export function CardDetailModal({ card, isOpen, onClose }: CardDetailModalProps) {
  // ฟังก์ชันช่วยกำหนดสีของ Priority
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "error";
      case "medium": return "warning";
      case "low": return "success";
      default: return "default";
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="font-bold text-slate-800 text-lg">{card.title}</span>
        {card.priority && (
          <Chip 
            label={card.priority.toUpperCase()} 
            color={getPriorityColor(card.priority) as any} 
            size="small" 
            className="font-bold text-[10px]"
          />
        )}
      </DialogTitle>
      
      <DialogContent className="pt-4 space-y-4">
        {/* รายละเอียด */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Description</h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">
            {card.description || "No description provided."}
          </p>
        </div>

        {/* ข้อมูลเมตา */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Assignee</h4>
            <div className="flex items-center gap-2">
              <Avatar 
                src={card.avatar_url || undefined} 
                sx={{ width: 24, height: 24, fontSize: 12, bgcolor: "#3b82f6" }}
              >
                {card.assignee ? card.assignee.charAt(0).toUpperCase() : "?"}
              </Avatar>
              <span className="text-sm text-slate-700">{card.assignee || "Unassigned"}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Details</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar size={14} className="text-slate-400" />
                {card.due_date ? new Date(card.due_date).toLocaleDateString() : "No due date"}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={14} className="text-slate-400" />
                {card.estimated_hours ? `${card.estimated_hours} hrs estimated` : "No estimate"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions className="p-4 border-t border-slate-100">
        <Button onClick={onClose} color="inherit">Close</Button>
        <Button variant="contained" className="bg-blue-600 hover:bg-blue-700 shadow-none">
          Edit Card
        </Button>
      </DialogActions>
    </Dialog>
  );
}
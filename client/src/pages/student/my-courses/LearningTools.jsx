import React, { useState } from "react";
import { Clock, Plus, MoreVertical, Edit2, Trash2, Check, Loader2 } from "lucide-react";
import {
  useGetUserRemindersQuery,
  useDeleteReminderMutation,
} from "@/features/api/reminderApi";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ReminderWizardModal from "../../../components/ReminderWizardModal";

const LearningTools = () => {
  const { data: remindersData, isLoading: remindersLoading, refetch } = useGetUserRemindersQuery();
  const [deleteReminder] = useDeleteReminderMutation();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  const reminders = remindersData?.reminders || [];

  const handleEditClick = (reminder) => {
    setEditingReminder(reminder);
    setIsWizardOpen(true);
  };

  const handleAddClick = () => {
    setEditingReminder(null);
    setIsWizardOpen(true);
  };

  const handleDeleteClick = async (reminderId) => {
    try {
      await deleteReminder(reminderId).unwrap();
      toast.success("Learning reminder deleted successfully!");
      refetch();
    } catch (err) {
      toast.error("Failed to delete reminder.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in">
      <div className="space-y-1">
        <h3 className="text-[22px] font-bold text-[#1c1d1f]">
          Learning reminders
        </h3>
        <p className="text-sm text-[#6a6f73] font-normal leading-relaxed">
          Learning a little each day adds up. Research shows that students who make learning a habit are more likely to reach their goals. Set time aside to learn and get reminders using your learning scheduler.
        </p>
      </div>

      {remindersLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full bg-gray-200 rounded-none border border-[#d1d7dc]" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="border border-dashed border-[#d1d7dc] bg-white p-8 text-center space-y-4 max-w-2xl">
          <Clock className="h-8 w-8 text-gray-400 mx-auto" />
          <h4 className="font-bold text-base text-[#2d2f31]">
            Stay on track with schedule events
          </h4>
          <p className="text-sm text-[#6a6f73] max-w-xs mx-auto leading-relaxed font-normal">
            Reminders are configured directly inside each course's study workspace tab. Open a course to set up customized notifications.
          </p>
          <button
            onClick={handleAddClick}
            className="bg-[#6d28d2] hover:bg-[#892de1] text-white px-5 py-2.5 text-xs font-bold transition-colors"
          >
            Create a reminder
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {reminders.map((rem) => {
            const courseTitle = rem.courseId?.title;
            return (
              <div 
                key={rem._id} 
                className="border border-[#d1d7dc] bg-white p-5 flex justify-between items-start gap-4 shadow-sm relative group"
              >
                <div className="flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-[#6d28d2] shrink-0 mt-0.5">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold text-[#1c1d1f]">{rem.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-[#2d2f31] font-normal">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        {rem.time}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="capitalize">{rem.frequency}</span>
                    </div>
                    {rem.calendarSynced && rem.calendarSynced !== "None" && (
                      <p className="text-[11px] font-bold text-green-700 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 stroke-[3px]" />
                        Added to {rem.calendarSynced} Calendar
                      </p>
                    )}
                    {courseTitle && (
                      <p className="text-[12.5px] text-gray-500 font-medium">
                        Course: {courseTitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dropdown Options */}
                <div className="shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center outline-none transition-colors">
                        <MoreVertical className="h-4.5 w-4.5 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 bg-white border border-[#d1d7dc] rounded-none p-1 shadow-lg text-[#2d2f31]">
                      <DropdownMenuItem 
                        onClick={() => handleEditClick(rem)}
                        className="text-xs py-2 px-3 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit reminder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#d1d7dc]" />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(rem._id)}
                        className="text-xs py-2 px-3 text-red-600 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete reminder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 border border-[#6d28d2] text-[#6d28d2] hover:bg-[#f5eeff] hover:border-[#892de1] hover:text-[#892de1] px-5 py-2.5 text-xs font-bold transition-colors"
          >
            <Plus className="h-4 w-4" /> Add another
          </button>
        </div>
      )}

      {/* Reusable Setup Wizard Modal */}
      <ReminderWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        reminderToEdit={editingReminder}
        onSaveSuccess={refetch}
      />
    </div>
  );
};

export default LearningTools;

import React from "react";
import { Clock, Calendar } from "lucide-react";

const LearningTools = () => {
  return (
    <div className="bg-white border border-[#d1d7dc] p-8 rounded-none shadow-sm space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-[#2d2f31]">
          Learning reminders
        </h3>
        <p className="text-xs text-[#6a6f73] font-normal leading-relaxed">
          Set up push notifications or calendar events to stay on track for your learning goals.
        </p>
      </div>

      <div className="border border-dashed border-[#d1d7dc] p-6 text-center space-y-3">
        <Clock className="h-6 w-6 text-gray-400 mx-auto" />
        <h4 className="font-extrabold text-xs text-[#2d2f31]">
          Stay on track with schedule events
        </h4>
        <p className="text-[11px] text-[#6a6f73] max-w-xs mx-auto leading-relaxed font-normal">
          Reminders are configured directly inside each course's study workspace tab. Open a course to set up customized notifications.
        </p>
      </div>
    </div>
  );
};

export default LearningTools;

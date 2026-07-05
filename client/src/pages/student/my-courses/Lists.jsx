import React from "react";
import { BookOpen } from "lucide-react";

const Lists = () => {
  return (
    <div className="bg-white border border-[#d1d7dc] p-10 text-center rounded-none shadow-sm space-y-3">
      <BookOpen className="h-8 w-8 text-gray-300 mx-auto" />
      <h4 className="font-normal text-lg text-[#2d2f31]">
        Organize your learning with Lists
      </h4>
      <p className="text-base text-[#6a6f73] max-w-sm mx-auto leading-relaxed">
        Create custom lists to group your enrolled courses by skill, priority, or project goals.
      </p>
    </div>
  );
};

export default Lists;

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const UTooltip = ({ children, content, side = "top", align = "center" }) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="bg-slate-900 text-white border-slate-800 rounded-md px-4 py-2.5 text-xs font-bold shadow-2xl animate-in fade-in zoom-in duration-200"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UTooltip;

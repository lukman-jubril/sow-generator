import React from "react";

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-16 absolute bg-black/50">
      <div className="relative w-10 h-10">
        {/* spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-b-transparent border-l-green-500 animate-spin" />
      </div>

      {/* text row with dot loader */}
      <div className="flex items-center gap-2 mt-3">
        <p className="text-white font-bold uppercase">Generating SOW</p>

        {/* three animated dots */}
        <div className="flex space-x-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
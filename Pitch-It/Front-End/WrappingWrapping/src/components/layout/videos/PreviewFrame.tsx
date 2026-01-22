// src/components/layout/videos/PreviewFrame.tsx

import React from 'react';

interface PreviewFrameProps {
  children: React.ReactNode;
}

const PreviewFrame = ({ children }: PreviewFrameProps) => {
  return (
    <div
      className="
        relative min-w-0 w-full aspect-video rounded-lg
        bg-black/50 overflow-hidden
      "
    >
      {children}
    </div>
  );
};

export default PreviewFrame;

// src/components/common/Toggle.tsx
import { useState, useId } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function ToggleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <section className="bg-black/30 rounded-xl">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`panel-${id}`}
      >
        <span className="font-semibold text-base text-my-white">{title}</span>
        <ChevronDownIcon
          className={`h-5 w-5 text-my-white transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        id={`panel-${id}`}
        className={`px-4 pb-4 transition-[grid-template-rows] duration-200 ease-out grid ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden text-sm text-my-white leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  );
}

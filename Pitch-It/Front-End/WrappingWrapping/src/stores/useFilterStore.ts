import { create } from 'zustand';

interface FilterStore {
  selectedJobs: string[];
  toggleJob: (job: string) => void;
  isJobSelected: (job: string) => boolean;
  clearAllJobs: () => void;

  selectedDate: string;
  setSelectedDate: (date: string) => void;
  getSelectedDate: () => string;
  clearSelectedDate: () => void;
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  selectedJobs: [],

  toggleJob: (job: string) =>
    set((state) => ({
      selectedJobs: state.selectedJobs.includes(job)
        ? state.selectedJobs.filter((selected) => selected !== job)
        : [...state.selectedJobs, job],
    })),

  isJobSelected: (job: string) => {
    return get().selectedJobs.includes(job);
  },

  clearAllJobs: () => set({ selectedJobs: [] }),

  // 날짜 필터
  selectedDate: '',
  setSelectedDate: (date: string) => set({ selectedDate: date }),
  getSelectedDate: () => get().selectedDate,
  clearSelectedDate: () => set({ selectedDate: '' }),
}));

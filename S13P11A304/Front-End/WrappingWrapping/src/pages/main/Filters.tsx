import { filterTexts } from '../../types/texts/MainTexts';
import { theme } from '../../styles/theme';
import Checkbox from '../../components/common/Checkbox';
import { useFilterStore } from '../../stores/useFilterStore';
import DatePicker from '../../components/common/DatePicker';
import { jobs } from '../../types/interfaces/mainPage';

const Filters = () => {
  // Zustand store로 직무 필터 상태 관리
  const { toggleJob, isJobSelected } = useFilterStore();

  return (
    <div className="flex flex-col items-center w-[350px] md:w-full md:flex-row lg:flex-col lg:w-[350px] gap-4">
      <div className="">
        <DatePicker parent="filters" />
      </div>
      <div className="flex flex-col justify-center w-full md:h-full lg:h-auto border border-watermelon rounded-2xl p-4">
        <div
          className={`py-3 px-4 font-semibold text-lg text-${theme.primary}`}
        >
          {filterTexts.jobFilterLabel}
        </div>
        <div className="items-center my-2 px-3 py-2 grid grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Checkbox
              key={job.value}
              label={job.label}
              checked={isJobSelected(job.value)}
              onChange={() => {
                toggleJob(job.value);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Filters;

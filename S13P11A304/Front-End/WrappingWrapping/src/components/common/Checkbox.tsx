import { FC, useId } from 'react';
import { theme } from '../../styles/theme';
import { Tooltip } from 'react-tooltip';

import Check from '../../assets/icons/check.svg';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox: FC<CheckboxProps> = ({ label, checked, onChange }) => {
  const tooltipId = useId();

  return (
    <div className="px-1 flex items-center">
      <div
        className={`w-5 h-5 cursor-pointer border-2 border-${theme.primary} rounded-sm
          flex items-center justify-center transition-all duration-200 flex-shrink-0
          ${checked ? `bg-${theme.primary}` : `hover:bg-${theme.primary} hover:bg-opacity-30`}`}
        onClick={() => onChange(!checked)}
      >
        {checked && <img src={Check} alt="check" className="w-6 h-6" />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only flex-shrink-0"
      />
      <label
        className="pl-3 mr-1 cursor-pointer select-none truncate"
        onClick={() => onChange(!checked)}
        data-tooltip-id={tooltipId}
      >
        {label}
      </label>
      <Tooltip
        id={tooltipId}
        content={label}
        place="right"
        className={`bg-${theme.myBlack} text-${theme.myWhite} text-sm`}
      />
    </div>
  );
};

export default Checkbox;

import { theme } from '../../styles/theme';

interface LinedButtonProps {
  label: string;
  onClick?: () => void;
  onClickEvent?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  size?: string;
}

const LinedButton: React.FC<LinedButtonProps> = ({
  label,
  onClick,
  onClickEvent,
  disabled = false,
  size = null,
}) => {
  return (
    <button
      onClick={onClick || onClickEvent}
      disabled={disabled}
      className={`
        ${size}
        text-${theme.primary} border border-${theme.primary} rounded-full
        hover:bg-${theme.primary} hover:border-${theme.primary} hover:bg-opacity-20
        focus:outline-none
        disabled:border-${theme.primary} disabled:border-opacity-50 disabled:text-${theme.primary} disabled:text-opacity-50 disabled:hover:bg-transparent
      `}
    >
      {label}
    </button>
  );
};

export default LinedButton;

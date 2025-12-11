import { theme } from '../../styles/theme';

interface FilledButtonProps {
  label: string;
  onClick?: () => void;
  onClickEvent?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  size?: string;
  type?: 'button' | 'submit' | 'reset';
}

const FilledButton = ({
  label,
  onClick,
  onClickEvent,
  disabled = false,
  size = '',
  type = 'button',
}: FilledButtonProps) => {
  return (
    <button
      onClick={onClick || onClickEvent}
      disabled={disabled}
      type={type}
      className={`
        ${size}
        bg-${theme.primary} text-${theme.myWhite} rounded-full border border-transparent
        hover:bg-${theme.primaryLight} hover:border-transparent
        focus:outline-none
        disabled:opacity-50 disabled:hover:bg-${theme.primary} disabled:hover:opacity-50
      `}
    >
      {label}
    </button>
  );
};

export default FilledButton;

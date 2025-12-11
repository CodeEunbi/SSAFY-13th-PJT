import React from 'react';

interface IconInputProps {
  icon?: React.ReactNode;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
  name: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
}

const IconInput: React.FC<IconInputProps> = ({
  icon,
  placeholder = '',
  value,
  onChange,
  className = '',
  type = 'text',
  name,
  id,
  required = false,
  disabled = false,
  readonly = false,
}) => {
  return (
    <div
      className={`relative flex items-center w-full
        bg-black/20 rounded-full overflow-hidden px-4
        focus-within:ring-1 focus-within:ring-watermelon
        ${className}
      `}
    >
      {icon && (
        <div
          className={`flex items-center justify-center py-3 bg-transparent opacity-80
            `}
        >
          {icon}
        </div>
      )}

      <input
        name={name}
        id={id}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          input-field flex-1 border-none outline-none p-3 bg-transparent placeholder-gray-500
          ${icon ? 'pl-2' : ''}
          ${disabled || readonly ? 'opacity-50' : ''}
        `}
      />
    </div>
  );
};

export default IconInput;

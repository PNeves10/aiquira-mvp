import React from 'react';

const Button = ({ children, onClick, className, disabled }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-blue-500 text-white p-2 rounded ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
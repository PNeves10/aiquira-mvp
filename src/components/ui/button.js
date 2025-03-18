import React from 'react';

const Button = ({ children, onClick, className = '', disabled }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded ${disabled ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
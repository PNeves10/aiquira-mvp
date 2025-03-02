import React from 'react';

const Button = ({ children, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-500 text-white p-2 rounded ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
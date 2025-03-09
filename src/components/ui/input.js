import React from 'react';

const Input = ({ type = 'text', placeholder, value, onChange, ariaLabel }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="border p-2 rounded w-full"
      aria-label={ariaLabel} // Adicionando o aria-label
    />
  );
};

export default Input;
import React from 'react';

const Textarea = ({ value, onChange, placeholder }) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="border p-2 rounded w-full"
      rows="4" // Ajuste o número de linhas conforme necessário
    />
  );
};

export default Textarea;
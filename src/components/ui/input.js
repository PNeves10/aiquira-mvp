import React from 'react';
import { motion } from 'framer-motion';

const Input = ({ type = 'text', placeholder, value, onChange, ariaLabel }) => (
  <motion.input
    whileFocus={{ scale: 1.02 }}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-300"
    aria-label={ariaLabel}
  />
);

export default Input;
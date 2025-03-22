import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, className = '', disabled }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded transition ${disabled ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </motion.button>
);

export default Button;
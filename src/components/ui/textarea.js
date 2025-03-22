import React from 'react';
import { motion } from 'framer-motion';

const Textarea = ({ value, onChange, placeholder }) => (
  <motion.textarea
    whileFocus={{ scale: 1.02 }}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-300"
    rows="4"
  />
);

export default Textarea;
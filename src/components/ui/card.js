import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`bg-white border rounded-lg shadow-lg p-4 ${className}`}>
    {children}
  </motion.div>
);

export default Card;
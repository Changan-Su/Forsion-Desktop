import React from 'react'
import { motion } from 'framer-motion'
import type { DeskCardProps } from '../types'

export const SloganCard: React.FC<DeskCardProps> = ({ settings }) => {
  const text = (settings.text as string) || 'Forsion is All You Need'
  const fontFamily = (settings.fontFamily as string) || '"Dancing Script", cursive'
  const opacity = (settings.opacity as number) ?? 0.4

  return (
    <motion.h1
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity, scale: 1 }}
      transition={{ delay: 0.5, duration: 1 }}
      className="text-7xl text-surface-text select-none tracking-tight text-center"
      style={{ fontFamily }}
    >
      {text}
    </motion.h1>
  )
}

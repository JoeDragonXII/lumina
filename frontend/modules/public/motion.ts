export const publicMotion = {
  duration: {
    fast: 0.14,
    base: 0.2,
    slow: 0.28,
  },
  ease: [0.22, 1, 0.36, 1] as const,
  revealDistance: 12,
} as const;

export const revealVariant = {
  hidden: { opacity: 0, y: publicMotion.revealDistance },
  visible: { opacity: 1, y: 0 },
};

export const publicMotion = {
  duration: {
    fast: 0.22,
    base: 0.48,
    slow: 0.8,
  },
  ease: [0.22, 1, 0.36, 1] as const,
  revealDistance: 24,
} as const;

export const revealVariant = {
  hidden: { opacity: 0, y: publicMotion.revealDistance },
  visible: { opacity: 1, y: 0 },
};

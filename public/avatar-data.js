export const avatarOptions = [
  { id: "anikshaa", category: "class", name: "Anikshaa", short: "A", symbol: "A", color: "#8b5cf6", accent: "#ddd6fe", glow: "#ddd6fe", shape: "star" },
  { id: "joy", category: "class", name: "Joy", short: "J", symbol: "J", color: "#f59e0b", accent: "#fef3c7", glow: "#fef3c7", shape: "star" },
  { id: "saharsh", category: "class", name: "Saharsh July 2", short: "S", symbol: "S", color: "#06b6d4", accent: "#cffafe", glow: "#cffafe", shape: "star" },
  { id: "divyam", category: "class", name: "Divyam", short: "Dv", symbol: "D", color: "#ef4444", accent: "#fee2e2", glow: "#fee2e2", shape: "star" },
  { id: "vtl", category: "class", name: "VTL", short: "V", symbol: "V", color: "#14b8a6", accent: "#ccfbf1", glow: "#ccfbf1", shape: "star" },
  { id: "triple-t", category: "class", name: "Triple T", short: "TT", symbol: "T", color: "#22c55e", accent: "#dcfce7", glow: "#dcfce7", shape: "crown" },
  { id: "integral-ace", category: "class", name: "Integral Ace", short: "IA", symbol: "∫", color: "#2563eb", accent: "#dbeafe", glow: "#dbeafe", shape: "star" },
  { id: "formula-ranger", category: "class", name: "Formula Ranger", short: "FR", symbol: "F", color: "#f97316", accent: "#ffedd5", glow: "#ffedd5", shape: "star" },
  { id: "graph-guardian", category: "class", name: "Graph Guardian", short: "GG", symbol: "G", color: "#10b981", accent: "#d1fae5", glow: "#d1fae5", shape: "star" },
  { id: "castle-captain", category: "class", name: "Castle Captain", short: "CC", symbol: "C", color: "#7c3aed", accent: "#ede9fe", glow: "#ede9fe", shape: "crown" },

  { id: "mickey", category: "character", name: "Mickey", short: "M", symbol: "M", color: "#e63946", accent: "#ffd166", glow: "#ffd166", shape: "mouse" },
  { id: "minnie", category: "character", name: "Minnie", short: "Mn", symbol: "Mn", color: "#d86aa7", accent: "#ffe2ef", glow: "#ffe2ef", shape: "bow" },
  { id: "donald", category: "character", name: "Donald", short: "D", symbol: "D", color: "#2563eb", accent: "#fef08a", glow: "#fef08a", shape: "duck" },
  { id: "goofy", category: "character", name: "Goofy", short: "G", symbol: "G", color: "#16a34a", accent: "#bbf7d0", glow: "#bbf7d0", shape: "hat" },
  { id: "pluto", category: "character", name: "Pluto", short: "P", symbol: "P", color: "#d97706", accent: "#fef3c7", glow: "#fef3c7", shape: "ears" },
  { id: "pooh", category: "character", name: "Winnie the Pooh", short: "Po", symbol: "Po", color: "#facc15", accent: "#ef4444", glow: "#fef9c3", shape: "bear" },
  { id: "elsa", category: "character", name: "Elsa", short: "E", symbol: "E", color: "#38bdf8", accent: "#e0f2fe", glow: "#e0f2fe", shape: "snow" },
  { id: "stitch", category: "character", name: "Stitch", short: "St", symbol: "St", color: "#0ea5e9", accent: "#a78bfa", glow: "#bae6fd", shape: "alien" },
  { id: "woody", category: "character", name: "Woody", short: "W", symbol: "W", color: "#b45309", accent: "#facc15", glow: "#fef3c7", shape: "cowboy" },
  { id: "buzz", category: "character", name: "Buzz Lightyear", short: "Bz", symbol: "Bz", color: "#7c3aed", accent: "#22c55e", glow: "#dcfce7", shape: "space" },
  { id: "simba", category: "character", name: "Simba", short: "Si", symbol: "Si", color: "#f97316", accent: "#fed7aa", glow: "#fed7aa", shape: "lion" },
  { id: "genie", category: "character", name: "Genie", short: "Ge", symbol: "Ge", color: "#2563eb", accent: "#93c5fd", glow: "#dbeafe", shape: "magic" },
  { id: "olaf", category: "character", name: "Olaf", short: "O", symbol: "O", color: "#f8fafc", accent: "#60a5fa", glow: "#e0f2fe", shape: "snowman" },
  { id: "ariel", category: "character", name: "Ariel", short: "Ar", symbol: "Ar", color: "#ef4444", accent: "#14b8a6", glow: "#ccfbf1", shape: "wave" },
  { id: "belle", category: "character", name: "Belle", short: "Be", symbol: "Be", color: "#facc15", accent: "#fef3c7", glow: "#fef9c3", shape: "rose" },
  { id: "moana", category: "character", name: "Moana", short: "Mo", symbol: "Mo", color: "#0f766e", accent: "#fdba74", glow: "#ccfbf1", shape: "wave" },
  { id: "rapunzel", category: "character", name: "Rapunzel", short: "Ra", symbol: "Ra", color: "#a855f7", accent: "#fde68a", glow: "#f3e8ff", shape: "tower" },
  { id: "tiana", category: "character", name: "Tiana", short: "Ti", symbol: "Ti", color: "#22c55e", accent: "#fef3c7", glow: "#dcfce7", shape: "crown" },
  { id: "lightning", category: "character", name: "Lightning McQueen", short: "LQ", symbol: "LQ", color: "#dc2626", accent: "#facc15", glow: "#fee2e2", shape: "car" },
  { id: "remy", category: "character", name: "Remy", short: "R", symbol: "R", color: "#64748b", accent: "#93c5fd", glow: "#e2e8f0", shape: "chef" }
];

export const avatarIds = new Set(avatarOptions.map((avatar) => avatar.id));

export function getAvatarById(id) {
  return avatarOptions.find((avatar) => avatar.id === id) || avatarOptions[0];
}

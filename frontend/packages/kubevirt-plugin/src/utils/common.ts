export const isSetEqual = (set: Set<any>, otherSet: Set<any>) =>
  set.size === otherSet.size && [...set].every((s) => otherSet.has(s));

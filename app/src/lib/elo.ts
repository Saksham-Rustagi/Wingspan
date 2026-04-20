// Backwards-compatible re-export. The real implementations live in
// ./rating/*. Prefer importing from './rating' for new code.
export {
  calculateEloChanges,
  recomputeAllElo,
  ELO_START,
  ELO_START as STARTING_ELO,
} from './rating/elo';

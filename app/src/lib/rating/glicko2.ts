import type { GameEntry, Player, RatingSnapshot } from '../../types';

/**
 * Glicko-2 implementation (Glickman, 2012) adapted for multiplayer
 * free-for-all Wingspan games.
 *
 * Adaptation: each game is treated as one "rating period" in which
 * every participant plays N-1 pairwise matches (win/loss/tie based on
 * final placement). This is a standard and well-behaved FFA extension
 * because Glicko-2 already accepts multiple results per period and
 * combines them via sufficient-statistics aggregation, which
 * decomposes FFA outcomes into binary comparisons naturally.
 */

export const GLICKO_START_RATING = 1500;
export const GLICKO_START_RD = 350;
export const GLICKO_START_VOL = 0.06;
/** System constant; 0.3–1.2 typical. Lower = less volatility drift. */
const TAU = 0.5;
/** Glicko-1 <-> Glicko-2 scale constant. */
const CONV = 173.7178;
/** Convergence epsilon for volatility update. */
const EPSILON = 1e-6;

interface G2 {
  mu: number; // (r - 1500) / CONV
  phi: number; // RD / CONV
  sigma: number; // volatility
}

function newG2(): G2 {
  return {
    mu: 0,
    phi: GLICKO_START_RD / CONV,
    sigma: GLICKO_START_VOL,
  };
}

function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

function E(mu: number, muJ: number, phiJ: number): number {
  return 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));
}

function updatePlayer(
  self: G2,
  opponents: { opp: G2; score: number }[],
): G2 {
  if (opponents.length === 0) {
    // Inactive period: only phi grows.
    const phiStar = Math.sqrt(self.phi * self.phi + self.sigma * self.sigma);
    return { mu: self.mu, phi: phiStar, sigma: self.sigma };
  }

  // Step 3: variance v
  let vInv = 0;
  for (const { opp } of opponents) {
    const gj = g(opp.phi);
    const ej = E(self.mu, opp.mu, opp.phi);
    vInv += gj * gj * ej * (1 - ej);
  }
  const v = 1 / vInv;

  // Step 4: estimated improvement Δ
  let deltaSum = 0;
  for (const { opp, score } of opponents) {
    const gj = g(opp.phi);
    const ej = E(self.mu, opp.mu, opp.phi);
    deltaSum += gj * (score - ej);
  }
  const Delta = v * deltaSum;

  // Step 5: volatility via Illinois algorithm
  const a = Math.log(self.sigma * self.sigma);
  const phi2 = self.phi * self.phi;
  const Delta2 = Delta * Delta;
  const tau2 = TAU * TAU;

  const f = (x: number): number => {
    const ex = Math.exp(x);
    const d = phi2 + v + ex;
    return (ex * (Delta2 - d)) / (2 * d * d) - (x - a) / tau2;
  };

  let A = a;
  let B: number;
  if (Delta2 > phi2 + v) {
    B = Math.log(Delta2 - phi2 - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) k++;
    B = a - k * TAU;
  }

  let fA = f(A);
  let fB = f(B);
  let safety = 100;
  while (Math.abs(B - A) > EPSILON && safety-- > 0) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    B = C;
    fB = fC;
  }

  const newSigma = Math.exp(A / 2);

  // Step 6: pre-rating period value
  const phiStar = Math.sqrt(phi2 + newSigma * newSigma);

  // Step 7: new rating deviation and rating
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = self.mu + newPhi * newPhi * deltaSum;

  return { mu: newMu, phi: newPhi, sigma: newSigma };
}

function toDisplay(s: G2): number {
  return Math.round(CONV * s.mu + GLICKO_START_RATING);
}

export function recomputeAllGlicko2(
  players: Player[],
  games: GameEntry[],
): { updatedPlayers: Player[]; history: RatingSnapshot[] } {
  const state: Record<string, G2> = {};
  for (const p of players) state[p.id] = newG2();

  const snapshotAll = (): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const id of Object.keys(state)) out[id] = toDisplay(state[id]);
    return out;
  };

  const history: RatingSnapshot[] = [
    { gameId: 'initial', ratings: snapshotAll() },
  ];

  for (const game of games) {
    // Capture pre-period ratings for every participant; opponents use
    // pre-update values so order of processing doesn't matter.
    const pre: Record<string, G2> = {};
    for (const gp of game.players) {
      pre[gp.playerId] = state[gp.playerId] ?? newG2();
    }

    const next: Record<string, G2> = {};
    for (const gp of game.players) {
      const opps: { opp: G2; score: number }[] = [];
      for (const other of game.players) {
        if (other.playerId === gp.playerId) continue;
        let score = 0.5;
        if (gp.placement < other.placement) score = 1;
        else if (gp.placement > other.placement) score = 0;
        opps.push({ opp: pre[other.playerId], score });
      }
      next[gp.playerId] = updatePlayer(pre[gp.playerId], opps);
    }

    for (const [pid, v] of Object.entries(next)) state[pid] = v;

    history.push({ gameId: game.id, ratings: snapshotAll() });
  }

  const updatedPlayers = players.map((p) => ({
    ...p,
    currentElo: state[p.id] ? toDisplay(state[p.id]) : GLICKO_START_RATING,
  }));

  return { updatedPlayers, history };
}

import type { GameEntry, Player, RatingSnapshot } from '../../types';

/**
 * TrueSkill (Herbrich et al., 2007) adapted for free-for-all Wingspan.
 *
 * Each player is a "team of 1" and the game produces a ranking from
 * placements. For N players we run the pairwise TrueSkill update for
 * every (i,j) pair using pre-game skills, sum the μ adjustments and
 * compose the σ² shrinkage factors, then normalize by N-1 so a 2-player
 * game and a 5-player game produce comparably-scaled single-player
 * updates. This is the pairwise factorization commonly used for
 * small-group FFA where the full EP factor-graph solution is overkill.
 *
 * Display rating: μ × 40 so the default starting value is 1000 (same
 * scale the rest of the app already uses for Elo).
 */

export const TS_MU = 25;
export const TS_SIGMA = 25 / 3;
/** Skill-class width (spread for 76% win confidence). */
const BETA = TS_SIGMA / 2;
/** Dynamics: σ grows by this amount each rating period to avoid lock-in. */
const TAU = TS_SIGMA / 100;
/** Probability of a draw in Wingspan (rare — true ties broken by UI). */
const DRAW_PROB = 0.01;

export const TS_DISPLAY_SCALE = 40;
export const TRUESKILL_START_DISPLAY = Math.round(TS_MU * TS_DISPLAY_SCALE);

interface TS {
  mu: number;
  sigma: number;
}

function newTS(): TS {
  return { mu: TS_MU, sigma: TS_SIGMA };
}

function stdPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Abramowitz & Stegun 7.1.26 approximation, max error ~1.5e-7.
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const y =
    1 -
    (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

function stdCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

// Inverse standard normal CDF (Acklam's rational approximation).
function invCdf(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number;
  let r: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p <= phigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return (
    -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

function V(t: number, eps: number): number {
  const denom = stdCdf(t - eps);
  if (denom < 1e-10) return eps - t;
  return stdPdf(t - eps) / denom;
}

function W(t: number, eps: number): number {
  const v = V(t, eps);
  const w = v * (v + t - eps);
  // Clamp to [0, 1) to keep σ² > 0 on all inputs.
  return Math.min(Math.max(w, 0), 1 - 1e-9);
}

function Vdraw(t: number, eps: number): number {
  const absT = Math.abs(t);
  const num = stdPdf(-eps - absT) - stdPdf(eps - absT);
  const denom = stdCdf(eps - absT) - stdCdf(-eps - absT);
  if (denom < 1e-10) return 0;
  return t < 0 ? -(num / denom) : num / denom;
}

function Wdraw(t: number, eps: number): number {
  const absT = Math.abs(t);
  const denom = stdCdf(eps - absT) - stdCdf(-eps - absT);
  if (denom < 1e-10) return 1;
  const v = Vdraw(t, eps);
  const term =
    ((eps - absT) * stdPdf(eps - absT) + (eps + absT) * stdPdf(-eps - absT)) /
    denom;
  const w = v * v + term;
  return Math.min(Math.max(w, 0), 1 - 1e-9);
}

function drawMargin(drawProb: number, beta: number): number {
  // 2 players, teams of 1: ε = √2 · β · Φ⁻¹((p+1)/2)
  return Math.SQRT2 * beta * invCdf((drawProb + 1) / 2);
}

function toDisplay(s: TS): number {
  return Math.round(s.mu * TS_DISPLAY_SCALE);
}

export function recomputeAllTrueSkill(
  players: Player[],
  games: GameEntry[],
): { updatedPlayers: Player[]; history: RatingSnapshot[] } {
  const state: Record<string, TS> = {};
  for (const p of players) state[p.id] = newTS();

  const eps = drawMargin(DRAW_PROB, BETA);

  const snapshotAll = (): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const id of Object.keys(state)) out[id] = toDisplay(state[id]);
    return out;
  };

  const history: RatingSnapshot[] = [
    { gameId: 'initial', ratings: snapshotAll() },
  ];

  for (const game of games) {
    // Dynamics: σ² += τ² before the match (Step 1 of TrueSkill).
    const pre: Record<string, TS> = {};
    for (const gp of game.players) {
      const prev = state[gp.playerId] ?? newTS();
      pre[gp.playerId] = {
        mu: prev.mu,
        sigma: Math.sqrt(prev.sigma * prev.sigma + TAU * TAU),
      };
    }

    const muDelta: Record<string, number> = {};
    const sigmaMult: Record<string, number> = {};
    for (const gp of game.players) {
      muDelta[gp.playerId] = 0;
      sigmaMult[gp.playerId] = 1;
    }

    for (let i = 0; i < game.players.length; i++) {
      for (let j = i + 1; j < game.players.length; j++) {
        const a = game.players[i];
        const b = game.players[j];
        const sa = pre[a.playerId];
        const sb = pre[b.playerId];

        // Order so winnerId placed better than loserId (lower placement).
        let winnerId: string, loserId: string;
        let winner: TS, loser: TS;
        let draw = false;
        if (a.placement < b.placement) {
          winnerId = a.playerId;
          loserId = b.playerId;
          winner = sa;
          loser = sb;
        } else if (a.placement > b.placement) {
          winnerId = b.playerId;
          loserId = a.playerId;
          winner = sb;
          loser = sa;
        } else {
          winnerId = a.playerId;
          loserId = b.playerId;
          winner = sa;
          loser = sb;
          draw = true;
        }

        const c2 =
          2 * BETA * BETA + winner.sigma * winner.sigma + loser.sigma * loser.sigma;
        const c = Math.sqrt(c2);
        const t = (winner.mu - loser.mu) / c;
        const epsOverC = eps / c;

        const vVal = draw ? Vdraw(t, epsOverC) : V(t, epsOverC);
        const wVal = draw ? Wdraw(t, epsOverC) : W(t, epsOverC);

        // Winner's μ moves up, loser's moves down; for draws, Vdraw
        // already encodes the signed direction for each side so we
        // apply it as +v for winner and -v for loser symmetrically.
        const winMuShift = ((winner.sigma * winner.sigma) / c) * vVal;
        const loseMuShift = -((loser.sigma * loser.sigma) / c) * vVal;

        const winSigmaFactor = Math.max(
          1 - (winner.sigma * winner.sigma * wVal) / c2,
          1e-6,
        );
        const loseSigmaFactor = Math.max(
          1 - (loser.sigma * loser.sigma * wVal) / c2,
          1e-6,
        );

        muDelta[winnerId] += winMuShift;
        muDelta[loserId] += loseMuShift;
        sigmaMult[winnerId] *= winSigmaFactor;
        sigmaMult[loserId] *= loseSigmaFactor;
      }
    }

    // Normalize by number of pairwise opponents so a 5-player result
    // doesn't over-amplify a single-player's swing.
    const pairCount = game.players.length - 1;
    for (const gp of game.players) {
      const pid = gp.playerId;
      const s = pre[pid];
      const newMu = s.mu + muDelta[pid] / pairCount;
      const newSigmaSq =
        s.sigma * s.sigma * Math.pow(sigmaMult[pid], 1 / pairCount);
      state[pid] = { mu: newMu, sigma: Math.sqrt(Math.max(newSigmaSq, 1e-6)) };
    }

    history.push({ gameId: game.id, ratings: snapshotAll() });
  }

  const updatedPlayers = players.map((p) => ({
    ...p,
    currentElo: state[p.id] ? toDisplay(state[p.id]) : TRUESKILL_START_DISPLAY,
  }));

  return { updatedPlayers, history };
}

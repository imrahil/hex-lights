import type { Side } from '../types'
import { junctions } from './wiring'

/** LED COB 320 PREMIUM, 12 V, 4000 K, 300 LEDs/m, 8 mm wide. */
export const STRIP = {
  model: 'LED COB 320 PREMIUM',
  volts: 12,
  wattsPerMeter: 10,
  colour: '4000K',
  ledsPerMeter: 300,
  widthMm: 8,
  /** Strip is sold on reels of this length. */
  reelMeters: 5,
  /** Longest chain fed from one point before the far end visibly dims. */
  maxFeedMeters: 5,
}

/** Run a power supply at no more than this share of its rating. */
const SUPPLY_LOAD = 0.8

/** Whole amps at or above `amps`, ignoring float noise (4 / 0.8 must stay 5, not become 6). */
const wholeAmps = (amps: number) => Math.max(1, Math.ceil(Math.round(amps * 1e6) / 1e6))

export interface PrintParts {
  straight: number
  corners: number
  threeWay: number
  endCaps: number
}

/** One straight channel per side, plus a connector for every junction by how many sides meet there. */
export function printParts(sides: readonly Side[]): PrintParts {
  const parts = { straight: sides.length, corners: 0, threeWay: 0, endCaps: 0 }

  for (const { sides: count } of junctions(sides).values()) {
    if (count === 1) {
      parts.endCaps++
    } else if (count === 2) {
      parts.corners++
    } else if (count === 3) {
      parts.threeWay++
    }
  }

  return parts
}

export interface Bill {
  /** Total strip length in metres, rounded to the centimetre. */
  length: number
  watts: number
  /** Whole metres of strip needed. */
  stripMeters: number
  /** Strip to buy, in whole reels. */
  reelMeters: number
  /** Minimum power supply current. */
  supplyAmps: number
  /** Supply current with headroom, so it runs at no more than 80 % load. */
  recommendedAmps: number
  /** Too much strip for one feed point: needs power at both ends or injection. */
  needsInjection: boolean
}

export function billOfMaterials(strips: number, sideLength: number): Bill {
  // Round to the centimetre first: 7 × 0.1 is 0.7000000000000001, and ceil would buy a metre too many.
  const length = Math.round(strips * sideLength * 100) / 100
  const watts = length * STRIP.wattsPerMeter

  return {
    length,
    watts,
    stripMeters: Math.ceil(length),
    reelMeters: Math.max(1, Math.ceil(length / STRIP.reelMeters)) * STRIP.reelMeters,
    supplyAmps: wholeAmps(watts / STRIP.volts),
    recommendedAmps: wholeAmps(watts / STRIP.volts / SUPPLY_LOAD),
    needsInjection: length > STRIP.maxFeedMeters,
  }
}

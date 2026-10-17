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
}

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
    supplyAmps: Math.max(1, Math.ceil(watts / STRIP.volts)),
  }
}

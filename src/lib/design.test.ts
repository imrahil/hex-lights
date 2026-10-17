import { describe, expect, it } from 'vitest'
import { DEFAULT_DESIGN, parseDesign } from './design'

const valid = new Set(['a|b', 'b|c'])

describe('parseDesign', () => {
  it('falls back to the default when nothing is saved', () => {
    expect(parseDesign(null, valid)).toEqual(DEFAULT_DESIGN)
  })

  it('falls back to the default for corrupt JSON', () => {
    expect(parseDesign('{not json', valid)).toEqual(DEFAULT_DESIGN)
  })

  it('restores a saved design', () => {
    const saved = { sides: ['a|b'], sideLength: 0.75, power: 'a' }

    expect(parseDesign(JSON.stringify(saved), valid)).toEqual(saved)
  })

  it('drops sides that are not on the grid, and duplicates', () => {
    expect(parseDesign(JSON.stringify({ sides: ['a|b', 'x|y', 'a|b', 3] }), valid).sides).toEqual(['a|b'])
  })

  it('keeps the side length within the slider range', () => {
    expect(parseDesign(JSON.stringify({ sideLength: 10 }), valid).sideLength).toBe(2)
    expect(parseDesign(JSON.stringify({ sideLength: 'long' }), valid).sideLength).toBe(DEFAULT_DESIGN.sideLength)
  })

  it('ignores a power input that is not a vertex key', () => {
    expect(parseDesign(JSON.stringify({ power: 5 }), valid).power).toBeNull()
  })
})

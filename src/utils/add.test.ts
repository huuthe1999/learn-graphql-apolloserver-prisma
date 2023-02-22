import { add } from './add'

describe('Test add 2 number', () => {
  it('should return sum of 2 number', () => {
    expect(add(1, 2)).toBe(3)

    expect(add(5, 2)).toBe(7)

    expect(add(2, 2)).toBe(4)
  })
})

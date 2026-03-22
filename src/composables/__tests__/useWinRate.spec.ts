import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useWinRate } from '../useWinRate'
import { MoveTreeNode } from '../../explorer/move_tree'

describe('useWinRate', () => {
  it('should return empty/null if no node is provided', () => {
    const nodeRef = ref<MoveTreeNode | undefined>(undefined)
    const { winRateByMonth, totalWinRate } = useWinRate(() => nodeRef.value)

    expect(winRateByMonth.value).toEqual([])
    expect(totalWinRate.value).toBeNull()
  })

  it('should calculate win rates correctly', () => {
    const node = new MoveTreeNode('e4')
    node.count = 4
    node.gameHistory = [
      { result: 'white', date: new Date('2024-01-10') },
      { result: 'white', date: new Date('2024-01-15') },
      { result: 'black', date: new Date('2024-01-20') },
      { result: 'draw', date: new Date('2024-02-15') },
    ]

    const nodeRef = ref<MoveTreeNode | undefined>(node)
    const { winRateByMonth, totalWinRate } = useWinRate(() => nodeRef.value)

    // Total win rate: 2 white, 1 black, 1 draw out of 4
    expect(totalWinRate.value).toEqual({
      whiteRate: 50,
      blackRate: 25,
      drawRate: 25,
      total: 4,
    })

    // Win rate by month
    expect(winRateByMonth.value).toHaveLength(2)

    // Jan 2024: 2 white, 1 black, 0 draw out of 3
    const jan = winRateByMonth.value.find((d) => d.month === '2024-01')
    expect(jan).toBeDefined()
    expect(jan?.whiteRate).toBeCloseTo(66.67, 1)
    expect(jan?.blackRate).toBeCloseTo(33.33, 1)
    expect(jan?.drawRate).toBe(0)
    expect(jan?.total).toBe(3)

    // Feb 2024: 0 white, 0 black, 1 draw out of 1
    const feb = winRateByMonth.value.find((d) => d.month === '2024-02')
    expect(feb).toBeDefined()
    expect(feb?.whiteRate).toBe(0)
    expect(feb?.blackRate).toBe(0)
    expect(feb?.drawRate).toBe(100)
    expect(feb?.total).toBe(1)
  })
})

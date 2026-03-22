import { computed } from 'vue'
import type { MoveTreeNode } from '../explorer/move_tree'

export interface WinRateData {
  month?: string
  whiteRate: number
  blackRate: number
  drawRate: number
  total: number
}

export function useWinRate(currMoveTreeNode: () => MoveTreeNode | undefined) {
  const winRateByMonth = computed<WinRateData[]>(() => {
    const node = currMoveTreeNode()
    if (!node) {
      return []
    }

    const history = node.gameHistory
    const grouped = new Map<string, { white: number; black: number; draw: number; total: number }>()

    for (const game of history) {
      const monthKey = `${game.date.getFullYear()}-${(game.date.getMonth() + 1).toString().padStart(2, '0')}`
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, { white: 0, black: 0, draw: 0, total: 0 })
      }
      const stats = grouped.get(monthKey)!
      stats[game.result]++
      stats.total++
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, stats]) => ({
        month,
        whiteRate: (stats.white / stats.total) * 100,
        blackRate: (stats.black / stats.total) * 100,
        drawRate: (stats.draw / stats.total) * 100,
        total: stats.total,
      }))
  })

  const totalWinRate = computed<WinRateData | null>(() => {
    const node = currMoveTreeNode()
    if (!node) {
      return null
    }

    const history = node.gameHistory
    const stats = { white: 0, black: 0, draw: 0, total: history.length }

    for (const game of history) {
      stats[game.result]++
    }

    return {
      whiteRate: (stats.white / stats.total) * 100,
      blackRate: (stats.black / stats.total) * 100,
      drawRate: (stats.draw / stats.total) * 100,
      total: stats.total,
    }
  })

  return {
    winRateByMonth,
    totalWinRate,
  }
}

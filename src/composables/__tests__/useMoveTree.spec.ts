import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useMoveTree } from '../useMoveTree'
import { fetchPgns, Pgn } from '../../explorer/pgn'
import type { BoardApi } from 'vue3-chessboard'

vi.mock('../../explorer/pgn', () => ({
  fetchPgns: vi.fn(),
  Pgn: vi.fn().mockImplementation((moves, result, userIsWhite, date) => ({
    moves,
    result,
    userIsWhite,
    date,
  })),
}))

describe('useMoveTree', () => {
  const mockBoardAPI = {
    move: vi.fn(),
    resetBoard: vi.fn(),
    undoLastMove: vi.fn(),
    toggleOrientation: vi.fn(),
    getPgn: vi.fn(),
  } as unknown as BoardApi

  const isWhite = ref(true)

  beforeEach(() => {
    vi.clearAllMocks()
    isWhite.value = true
  })

  it('should initialize with undefined current node', () => {
    const { currMoveTreeNode, loading } = useMoveTree(
      () => mockBoardAPI,
      () => isWhite.value,
    )
    expect(currMoveTreeNode.value).toBeUndefined()
    expect(loading.value).toBe(false)
  })

  it('should load PGNs and build tree', async () => {
    const mockPgns = [
      new Pgn(['e4', 'e5'], 'white', true, new Date()),
      new Pgn(['e4', 'c5'], 'black', true, new Date()),
    ]
    vi.mocked(fetchPgns).mockResolvedValue(mockPgns)

    const onReset = vi.fn()
    const { loadPgnsAndBuildTree, currMoveTreeNode } = useMoveTree(
      () => mockBoardAPI,
      () => isWhite.value,
    )

    await loadPgnsAndBuildTree('testuser', onReset)

    expect(fetchPgns).toHaveBeenCalledWith('testuser')
    expect(onReset).toHaveBeenCalled()
    expect(currMoveTreeNode.value).toBeDefined()
    expect(currMoveTreeNode.value?.count).toBe(2)
  })

  it('should update move tree when a move is made from the board', async () => {
    const mockPgns = [new Pgn(['e4', 'e5'], 'white', true, new Date())]
    vi.mocked(fetchPgns).mockResolvedValue(mockPgns)

    const { loadPgnsAndBuildTree, updateMoveTree, currMoveTreeNode } = useMoveTree(
      () => mockBoardAPI,
      () => isWhite.value,
    )

    await loadPgnsAndBuildTree('testuser', () => {})

    // Root -> e4
    updateMoveTree('e4', true)
    expect(currMoveTreeNode.value?.move).toBe('e4')
    expect(currMoveTreeNode.value?.count).toBe(1)

    // e4 -> e5
    updateMoveTree('e5', true)
    expect(currMoveTreeNode.value?.move).toBe('e5')

    // Off-book move
    updateMoveTree('h4', true)
    expect(currMoveTreeNode.value).toBeUndefined()
  })

  it('should call boardAPI.move when move is made from sidebar', async () => {
    const { updateMoveTree } = useMoveTree(
      () => mockBoardAPI,
      () => isWhite.value,
    )

    updateMoveTree('e4', false)
    expect(mockBoardAPI.move).toHaveBeenCalledWith('e4')
  })

  it('should undo moves correctly', async () => {
    const mockPgns = [new Pgn(['e4', 'e5'], 'white', true, new Date())]
    vi.mocked(fetchPgns).mockResolvedValue(mockPgns)

    const { loadPgnsAndBuildTree, updateMoveTree, undoMoveTree, currMoveTreeNode } = useMoveTree(
      () => mockBoardAPI,
      () => isWhite.value,
    )

    await loadPgnsAndBuildTree('testuser', () => {})
    const root = currMoveTreeNode.value

    updateMoveTree('e4', true)
    expect(currMoveTreeNode.value?.move).toBe('e4')

    undoMoveTree()
    expect(currMoveTreeNode.value).toBe(root)
  })
})

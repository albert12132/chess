import { ref, computed } from 'vue'
import type { BoardApi } from 'vue3-chessboard'
import { fetchPgns, type Pgn } from '../explorer/pgn'
import { buildMoveTree, type MoveTree, type MoveTreeNode } from '../explorer/move_tree'

export function useMoveTree(boardAPI: () => BoardApi | undefined, isWhite: () => boolean) {
  let whiteMoveTree: MoveTree
  let blackMoveTree: MoveTree
  const currMoveTreeNode = ref<MoveTreeNode | undefined>(undefined)
  const nodeHistory = ref<(MoveTreeNode | undefined)[]>([])
  const loading = ref(false)

  const sortedNextMoves = computed(() => {
    if (!currMoveTreeNode.value) {
      return []
    }
    return [...currMoveTreeNode.value.children].sort(
      ([, node1], [, node2]) => node2.count - node1.count,
    )
  })

  const loadPgnsAndBuildTree = async (chessComUsername: string, onReset: () => void) => {
    if (!chessComUsername) {
      alert('Please enter a Chess.com username.')
      return
    }
    loading.value = true

    let pgns: Pgn[] = []
    try {
      pgns = await fetchPgns(chessComUsername)
    } catch (e) {
      alert('Error loading games: ' + e)
    } finally {
      loading.value = false
    }

    const whitePgns = pgns.filter((pgn) => pgn.userIsWhite)
    const blackPgns = pgns.filter((pgn) => !pgn.userIsWhite)

    whiteMoveTree = buildMoveTree(whitePgns)
    blackMoveTree = buildMoveTree(blackPgns)

    const root = isWhite() ? whiteMoveTree.root : blackMoveTree.root
    currMoveTreeNode.value = root
    nodeHistory.value = [root]

    onReset()
  }

  const updateMoveTree = (move: string, isFromBoard = false) => {
    if (!isFromBoard) {
      // This is from the sidebar. We'll just call the boardAPI without updating
      // the state of the move tree. After making the API call, we expect a Move
      // event from the board will call this function again, at which point we'll
      // actually update the move tree. That way, we don't double-update the
      // move tree.
      boardAPI()?.move(move)
    } else {
      const nextNode = currMoveTreeNode.value?.children.get(move)
      if (nextNode) {
        currMoveTreeNode.value = nextNode
        nodeHistory.value.push(nextNode)
      } else {
        // Off-book move
        currMoveTreeNode.value = undefined
        nodeHistory.value.push(undefined)
      }
    }
  }

  const resetMoveTree = () => {
    const root = isWhite() ? whiteMoveTree?.root : blackMoveTree?.root
    currMoveTreeNode.value = root
    nodeHistory.value = root ? [root] : []
  }

  const undoMoveTree = () => {
    if (nodeHistory.value.length > 1) {
      nodeHistory.value.pop()
      currMoveTreeNode.value = nodeHistory.value[nodeHistory.value.length - 1]
    }
  }

  return {
    currMoveTreeNode,
    loading,
    sortedNextMoves,
    loadPgnsAndBuildTree,
    updateMoveTree,
    resetMoveTree,
    undoMoveTree,
  }
}

import { Pgn } from './pgn'
import type { Result } from './pgn'

export class MoveTreeNode {
  move: string
  count: number
  parent: MoveTreeNode | undefined
  children: Map<string, MoveTreeNode>
  isWhite: boolean

  resultCounts: Map<Result, number>

  constructor(move: string, isWhite = true) {
    this.move = move
    this.count = 0
    this.children = new Map()
    this.isWhite = isWhite

    this.resultCounts = new Map([
      ['white', 0],
      ['black', 0],
      ['draw', 0],
    ])
  }
}

export class MoveTree {
  root: MoveTreeNode

  constructor() {
    this.root = new MoveTreeNode('root')
  }

  addMoveSequence(pgn: Pgn) {
    let currentNode = this.root
    currentNode.count++ // Increment root count for each PGN
    const resultCountForResult: number = currentNode.resultCounts.get(pgn.result) || 0
    currentNode.resultCounts.set(pgn.result, resultCountForResult + 1)

    let isWhite = true
    for (const move of pgn.moves) {
      let nextNode = currentNode.children.get(move)
      if (!nextNode) {
        nextNode = new MoveTreeNode(move, isWhite)
        currentNode.children.set(move, nextNode)
        nextNode.parent = currentNode
      }

      currentNode = nextNode
      currentNode.count++
      const resultCountForResult: number = currentNode.resultCounts.get(pgn.result) || 0
      currentNode.resultCounts.set(pgn.result, resultCountForResult + 1)
      isWhite = !isWhite
    }
  }
}

export function buildMoveTree(pgns: Pgn[]): MoveTree {
  const tree = new MoveTree()
  for (const pgn of pgns) {
    tree.addMoveSequence(pgn)
  }
  return tree
}

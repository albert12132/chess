import { parseMoves } from './pgn'

export class MoveTreeNode {
  move: string
  count: number
  parent: MoveTreeNode | undefined
  children: Map<string, MoveTreeNode>
  isWhite: boolean

  constructor(move: string, isWhite = true) {
    this.move = move
    this.count = 0
    this.children = new Map()
    this.isWhite = isWhite
  }
}

export class MoveTree {
  root: MoveTreeNode

  constructor() {
    this.root = new MoveTreeNode('root')
  }

  addMoveSequence(moves: string[]) {
    let currentNode = this.root
    currentNode.count++ // Increment root count for each PGN

    let isWhite = true
    for (const move of moves) {
      let nextNode = currentNode.children.get(move)
      if (!nextNode) {
        nextNode = new MoveTreeNode(move, isWhite)
        currentNode.children.set(move, nextNode)
        nextNode.parent = currentNode
      }
      nextNode.count++
      currentNode = nextNode
      isWhite = !isWhite
    }
  }
}

export function buildMoveTree(pgns: string[]): MoveTree {
  const tree = new MoveTree()
  for (const pgn of pgns) {
    const moves = parseMoves(pgn)
    tree.addMoveSequence(moves)
  }
  return tree
}

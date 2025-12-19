import { describe, it, expect, vi } from 'vitest'
import { buildMoveTree } from '../move_tree'
import { Pgn } from '../pgn'

const PGN1 = new Pgn(['e4', 'e5'], /* result= */ 'white', /* userIsWhite= */ true)
const PGN2 = new Pgn(['e4', 'Nf6'], /* result= */ 'white', /* userIsWhite= */ true)
const PGN3 = new Pgn(['d4', 'd5'], /* result= */ 'white', /* userIsWhite= */ true)

describe('buildMoveTree', () => {
  it('should build a move tree from a list of PGNs', () => {
    const tree = buildMoveTree([PGN1, PGN2, PGN3])

    // Check root
    expect(tree.root.count).toBe(3)
    expect(tree.root.children.size).toBe(2)

    // Check 'e4' branch
    const e4Node = tree.root.children.get('e4')
    expect(e4Node).toBeDefined()
    if (e4Node) {
      expect(e4Node.count).toBe(2)
      expect(e4Node.isWhite).toBe(true)
      expect(e4Node.children.size).toBe(2)

      const e5Node = e4Node.children.get('e5')
      expect(e5Node).toBeDefined()
      if (e5Node) {
        expect(e5Node.count).toBe(1)
        expect(e5Node.isWhite).toBe(false)
        expect(e5Node.children.size).toBe(0)
      }

      const nf6Node = e4Node.children.get('Nf6')
      expect(nf6Node).toBeDefined()
      if (nf6Node) {
        expect(nf6Node.count).toBe(1)
        expect(nf6Node.isWhite).toBe(false)
        expect(nf6Node.children.size).toBe(0)
      }
    }

    // Check 'd4' branch
    const d4Node = tree.root.children.get('d4')
    expect(d4Node).toBeDefined()
    if (d4Node) {
      expect(d4Node.count).toBe(1)
      expect(d4Node.isWhite).toBe(true)
      expect(d4Node.children.size).toBe(1)

      const d5Node = d4Node.children.get('d5')
      expect(d5Node).toBeDefined()
      if (d5Node) {
        expect(d5Node.count).toBe(1)
        expect(d5Node.isWhite).toBe(false)
        expect(d5Node.children.size).toBe(0)
      }
    }
  })

  it('should count duplicate moves but only have one unique prefix', () => {
    const tree = buildMoveTree([PGN1, PGN1])

    // Check root. There are 2 PGNs, but they have the same move list so there
    // should only be one path in the tree.
    expect(tree.root.count).toBe(2)
    expect(tree.root.children.size).toBe(1)

    // Check 'e4' branch
    const e4Node = tree.root.children.get('e4')
    expect(e4Node).toBeDefined()
    if (e4Node) {
      expect(e4Node.count).toBe(2)
      expect(e4Node.isWhite).toBe(true)
      expect(e4Node.children.size).toBe(1)

      const e5Node = e4Node.children.get('e5')
      expect(e5Node).toBeDefined()
      if (e5Node) {
        expect(e5Node.count).toBe(2)
        expect(e5Node.isWhite).toBe(false)
        expect(e5Node.children.size).toBe(0)
      }
    }
  })
})

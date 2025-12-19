import { describe, it, expect, vi } from 'vitest'
import { Pgn, fetchPgns } from '../pgn'

global.fetch = vi.fn()

describe('parse', () => {
  it('should parse a PGN string and return an array of moves', () => {
    const pgnText = `
[White "sleepyyysloth"]
[Black "jak1223"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nxd4 5. Qxd4 Qf6 6. e5 Qf5 7. Bd3 Qe6 8. 
O-O b6 9. Re1 Bc5 10. Qe4 Ne7 11. Qxa8 c6 12. Qxa7 O-O 13. Qa4 b5 14. Qe4 Bb7
15. Be3 Bxe3 16. Qxe3 Qd5 17. Nc3 Qe6 18. Rad1 Nd5 19. Nxd5 cxd5 20. Bxb5 Rb8
21. b3 Qg4 22. Qd4 Qg5 23. Bxd7 Rd8 24. Bg4 Re8 25. Bf3 Rd8 26. Qg4 Qh6 27. Qb4
Ba8 28. Qa5 Rf8 29. Bxd5 Bxd5 30. Rxd5 g6 31. Rd8 Rxd8 32. Qxd8+ Kg7 33. Qf6+
Kg8 34. g3 Qd2 35. Ra1 Qxc2 36. e6 fxe6 37. Qxe6+ Kg7 38. a4 Qb2 39. Qe1 Qxb3
40. a5 Qb7 41. a6 Qa7 42. Qb4 Kh6 43. Qb7 Qd4 44. Ra2 Qd1+ 45. Kg2 g5 46. a7 g4
47. a8=Q Qd6 48. Qc6 Qxc6+ 49. Qxc6+ Kh5 50. Ra5# 1-0
`
    const expectedMoves = [
      'e4',
      'e5',
      'Nf3',
      'Nc6',
      'd4',
      'exd4',
      'Nxd4',
      'Nxd4',
      'Qxd4',
      'Qf6',
      'e5',
      'Qf5',
      'Bd3',
      'Qe6',
      'O-O',
      'b6',
      'Re1',
      'Bc5',
      'Qe4',
      'Ne7',
      'Qxa8',
      'c6',
      'Qxa7',
      'O-O',
      'Qa4',
      'b5',
      'Qe4',
      'Bb7',
      'Be3',
      'Bxe3',
      'Qxe3',
      'Qd5',
      'Nc3',
      'Qe6',
      'Rad1',
      'Nd5',
      'Nxd5',
      'cxd5',
      'Bxb5',
      'Rb8',
      'b3',
      'Qg4',
      'Qd4',
      'Qg5',
      'Bxd7',
      'Rd8',
      'Bg4',
      'Re8',
      'Bf3',
      'Rd8',
      'Qg4',
      'Qh6',
      'Qb4',
      'Ba8',
      'Qa5',
      'Rf8',
      'Bxd5',
      'Bxd5',
      'Rxd5',
      'g6',
      'Rd8',
      'Rxd8',
      'Qxd8+',
      'Kg7',
      'Qf6+',
      'Kg8',
      'g3',
      'Qd2',
      'Ra1',
      'Qxc2',
      'e6',
      'fxe6',
      'Qxe6+',
      'Kg7',
      'a4',
      'Qb2',
      'Qe1',
      'Qxb3',
      'a5',
      'Qb7',
      'a6',
      'Qa7',
      'Qb4',
      'Kh6',
      'Qb7',
      'Qd4',
      'Ra2',
      'Qd1+',
      'Kg2',
      'g5',
      'a7',
      'g4',
      'a8=Q',
      'Qd6',
      'Qc6',
      'Qxc6+',
      'Qxc6+',
      'Kh5',
      'Ra5#',
    ]

    const pgn = Pgn.parse(pgnText, 'sleepyyysloth')
    expect(pgn.moves).toEqual(expectedMoves)
    expect(pgn.result).toEqual('white')
    expect(pgn.userIsWhite).toBeTruthy()
  })

  it('should parse a PGN string that has comments in the moves', () => {
    const pgnText = `
[White "user1"]
[Black "user2"]
[Result "0-1"]
1. e4 {[%clk 0:00:10.0]} 1... e5 {[%clk 0:00:20.0]} 2. Nf3 {[%clk 0:00:30.0]} 2... Nc6 {[%clk 0:00:40.0]}
`
    const expectedMoves = ['e4', 'e5', 'Nf3', 'Nc6']

    const pgn = Pgn.parse(pgnText, 'user1')
    expect(pgn.moves).toEqual(expectedMoves)
  })
})

describe('fetchPgns', () => {
  it('should fetch all PGNs for a user', async () => {
    const username = 'testuser'
    const archivesUrl = `https://api.chess.com/pub/player/${username}/games/archives`
    const archivesResponse = {
      archives: [
        'https://api.chess.com/pub/player/testuser/games/2020/01',
        'https://api.chess.com/pub/player/testuser/games/2020/02',
      ],
    }
    const gamesResponse1 = {
      games: [{ pgn: '[Event "pgn1"]\n\n1. e4 e5' }, { pgn: '[Event "pgn1.1"]\n\n1. d4 d5' }],
    }
    const gamesResponse2 = {
      games: [{ pgn: '[Event "pgn2"]\n\n1. Nf3 Nc6' }],
    }

    ;(fetch as any).mockImplementation((url: string) => {
      if (url === archivesUrl) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(archivesResponse)),
        })
      }
      if (url === 'https://api.chess.com/pub/player/testuser/games/2020/01') {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(gamesResponse1)),
        })
      }
      if (url === 'https://api.chess.com/pub/player/testuser/games/2020/02') {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(gamesResponse2)),
        })
      }
      return Promise.resolve({ ok: false, text: () => Promise.resolve('') })
    })

    const pgns = await fetchPgns(username)

    expect(pgns.length).toBe(3)
    expect(pgns[0]).toBe('[Event "pgn1"]\n\n1. e4 e5')
    expect(pgns[1]).toBe('[Event "pgn1.1"]\n\n1. d4 d5')
    expect(pgns[2]).toBe('[Event "pgn2"]\n\n1. Nf3 Nc6')
  })
})

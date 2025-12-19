export type Result = 'white' | 'black' | 'draw'

export class Pgn {
  moves: string[]
  result: Result
  userIsWhite: boolean

  constructor(moves: string[], result: Result, userIsWhite: boolean) {
    this.moves = moves
    this.result = result
    this.userIsWhite = userIsWhite
  }

  public static parse(pgn: string, username: string): Pgn {
    return new Pgn(Pgn.parseMoves(pgn), Pgn.parseResult(pgn), Pgn.parseUserIsWhite(pgn, username))
  }

  static parseMoves(pgn: string): string[] {
    const noTags = pgn.replace(/\s*\[[^\]]*\]\s*/g, '')
    const noComments = noTags.replace(/\{[^}]*\}/g, '')
    const noAnnotations = noComments.replace(/\([^)]*\)/g, '') // remove variations
    const cleaned = noAnnotations.replace(/(\r\n|\n|\r)/gm, ' ').trim()

    const tokens = cleaned.split(' ').filter((t) => t.length > 0)

    const moves = tokens.filter((token) => {
      if (!token) {
        return false
      }
      // Filter out move numbers like "1.", "2...", "12."
      if (token.match(/^\d+\.(?:\.\.)?$/)) {
        return false
      }
      // Filter out results
      if (token === '1-0' || token === '0-1' || token === '1/2-1/2' || token === '*') {
        return false
      }
      // Filter out annotation markers like $1, $2, etc.
      if (token.startsWith('$')) {
        return false
      }
      return true
    })

    return moves
  }

  static parseResult(pgn: string): Result {
    const resultMatch = pgn.match(/\s*\[Result\s+\"(.*?)\"\s*\]/)
    if (resultMatch && resultMatch[1]) {
      const result = resultMatch[1]
      if (result === '1-0') {
        return 'white'
      } else if (result === '0-1') {
        return 'black'
      } else if (result === '1/2-1/2') {
        return 'draw'
      }
    }
    throw 'PGN does not contain a result tag'
  }

  static parseUserIsWhite(pgn: string, username: string): boolean {
    // Chess.com usernames are case insensitive, but the PGN may still have capitalization.
    const lowerCasePgn = pgn.toLowerCase()
    const lowerCaseUsername = username.toLowerCase()

    const whiteTagLowerCase = `[white "${lowerCaseUsername}"]`
    const blackTagLowerCase = `[black "${lowerCaseUsername}"]`

    if (lowerCasePgn.includes(whiteTagLowerCase)) {
      return true
    }
    if (lowerCasePgn.includes(blackTagLowerCase)) {
      return false
    }

    throw `PGN doesn't contain a color for user ${username}`
  }
}

export async function fetchPgns(username: string): Promise<Pgn[]> {
  const archivesUrl = `https://api.chess.com/pub/player/${username}/games/archives`
  const archivesText = await fetchUrl(archivesUrl)
  if (!archivesText) {
    return []
  }
  const archives = JSON.parse(archivesText)
  if (!archives.archives) {
    return []
  }

  const pgns: Pgn[] = []
  for (const archiveUrl of archives.archives) {
    const gamesText = await fetchUrl(archiveUrl)
    if (!gamesText) {
      continue
    }

    const games = JSON.parse(gamesText)
    if (!games.games) {
      continue
    }
    for (const game of games.games) {
      if (game.pgn) {
        try {
          pgns.push(Pgn.parse(game.pgn, username))
        } catch {
          console.log('Failed to parse PGN, excluding from results: ' + game.pgn)
          continue
        }
      }
    }
  }

  return pgns
}

async function fetchUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    if (response.ok) {
      return await response.text()
    }
  } catch (e) {
    console.error(`Error fetching ${url}:`, e)
  }
  return ''
}

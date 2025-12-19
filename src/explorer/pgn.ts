export function parseMoves(pgn: string): string[] {
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

export async function fetchPgns(username: string): Promise<string[]> {
  const archivesUrl = `https://api.chess.com/pub/player/${username}/games/archives`
  const archivesText = await fetchUrl(archivesUrl)
  if (!archivesText) {
    return []
  }
  const archives = JSON.parse(archivesText)
  if (!archives.archives) {
    return []
  }

  const pgns: string[] = []
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
        pgns.push(game.pgn)
      }
    }
  }

  return pgns
}

export async function fetchUrl(url: string): Promise<string> {
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

export function parseColor(pgn: string, username: string): boolean | null {
  // Chess.com usernames are case insensitive, but may still show up in PGN with capitalization.
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

  return null // If neither tag is found
}

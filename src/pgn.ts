export function parseMoves(pgn: string): string[] {
  const lastHeader = pgn.lastIndexOf(']')
  const moveText = lastHeader === -1 ? pgn : pgn.substring(lastHeader + 1)

  const noComments = moveText.replace(/\{[^}]*\}/g, '')
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

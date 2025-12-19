<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { TheChessboard, type BoardApi, type BoardConfig } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'

const boardConfig: BoardConfig = {
  coordinates: true,
}

let boardAPI: BoardApi | undefined

const pgn = ref(`
[Event "Live Chess"]
[Site "Chess.com"]
[Date "2025.12.17"]
[Round "?"]
[White "sleepyyysloth"]
[Black "jak1223"]
[Result "1-0"]
[TimeControl "600"]
[WhiteElo "1262"]
[BlackElo "1269"]
[Termination "sleepyyysloth won by checkmate"]
[ECO "C45"]
[EndTime "23:58:24 GMT+0000"]
[Link "https://www.chess.com/game/live/146852107976"]

1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nxd4 5. Qxd4 Qf6 6. e5 Qf5 7. Bd3 Qe6 8.
O-O b6 9. Re1 Bc5 10. Qe4 Ne7 11. Qxa8 c6 12. Qxa7 O-O 13. Qa4 b5 14. Qe4 Bb7
15. Be3 Bxe3 16. Qxe3 Qd5 17. Nc3 Qe6 18. Rad1 Nd5 19. Nxd5 cxd5 20. Bxb5 Rb8
21. b3 Qg4 22. Qd4 Qg5 23. Bxd7 Rd8 24. Bg4 Re8 25. Bf3 Rd8 26. Qg4 Qh6 27. Qb4
Ba8 28. Qa5 Rf8 29. Bxd5 Bxd5 30. Rxd5 g6 31. Rd8 Rxd8 32. Qxd8+ Kg7 33. Qf6+
Kg8 34. g3 Qd2 35. Ra1 Qxc2 36. e6 fxe6 37. Qxe6+ Kg7 38. a4 Qb2 39. Qe1 Qxb3
40. a5 Qb7 41. a6 Qa7 42. Qb4 Kh6 43. Qb7 Qd4 44. Ra2 Qd1+ 45. Kg2 g5 46. a7 g4
47. a8=Q Qd6 48. Qc6 Qxc6+ 49. Qxc6+ Kh5 50. Ra5# 1-0
`)

// access the boardAPI in the onMounted hook
onMounted(() => {
  boardAPI?.loadPgn(pgn.value)
  console.log(boardAPI?.getBoardPosition())
})

const onUndo = () => {
  boardAPI?.undoLastMove()
}

let nextMoveValue = ref('')
const onMakeMove = () => {
  console.log(nextMoveValue)
  boardAPI?.move(nextMoveValue.value)
}

const onLoadPgn = () => {
  boardAPI?.loadPgn(pgn.value)
}
</script>

<template>
  <main>
    <div id="buttons">
      <button @click="onUndo">Undo</button>
      <button @click="onMakeMove">Make move</button>
      <input v-model="nextMoveValue" />
      <button @click="onLoadPgn">Load PGN</button>
      <textarea v-model="pgn"></textarea>
    </div>
    <TheChessboard :board-config="boardConfig" @board-created="(api) => (boardAPI = api)" />
  </main>
</template>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

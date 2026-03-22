<script setup lang="ts">
import { ref } from 'vue'
import { TheChessboard, type BoardApi, type BoardConfig, type MoveEvent } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
import ChessSidebar from './components/ChessSidebar.vue'

const boardConfig: BoardConfig = {
  coordinates: true,
  orientation: 'white',
  // viewOnly: true,
  blockTouchScroll: true, // We'll capture our own keyboard shortcuts for "Undo"
}

const boardAPI = ref<BoardApi>()
const sidebar = ref<InstanceType<typeof ChessSidebar>>()

function onMove(move: any) {
  sidebar.value?.updateMoveTree(move.san, /* isFromBoard= */ true)
}
</script>

<template>
  <main>
    <div class="board-container">
      <TheChessboard
        :board-config="boardConfig"
        @move="onMove"
        @board-created="(api) => (boardAPI = api)"
      />
    </div>
    <ChessSidebar ref="sidebar" :boardAPI="boardAPI" />
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column; /* Column for mobile by default */
  align-items: center; /* Center horizontally in column mode */
  padding: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.board-container {
  width: 100%;
  max-width: 600px; /* Sensible max-width for smaller screens */
  aspect-ratio: 1 / 1;
}

@media (min-width: 1024px) {
  main {
    flex-direction: row; /* Row for desktop */
    justify-content: center; /* Center horizontally in row mode */
    align-items: flex-start; /* Align board and sidebar at the top */
    padding: 2rem;
  }

  .board-container {
    max-width: 90vh; /* Match sidebar height on desktop */
    width: 90vh;
  }
}
</style>

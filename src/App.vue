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
    <TheChessboard
      :board-config="boardConfig"
      @move="onMove"
      @board-created="(api) => (boardAPI = api)"
    />
    <ChessSidebar ref="sidebar" :boardAPI="boardAPI" />
  </main>
</template>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Align items to the top */
  padding: 1rem;
}
</style>

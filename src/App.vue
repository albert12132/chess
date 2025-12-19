<script setup lang="ts">
import { ref } from 'vue'
import { TheChessboard, type BoardApi, type BoardConfig } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
import ChessSidebar from './components/ChessSidebar.vue'

const boardConfig: BoardConfig = {
  coordinates: true,
  orientation: 'white',
  viewOnly: true,
}

const boardAPI = ref<BoardApi>()
</script>

<template>
  <main>
    <TheChessboard :board-config="boardConfig" @board-created="(api) => (boardAPI = api)" />
    <ChessSidebar :boardAPI="boardAPI" />
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

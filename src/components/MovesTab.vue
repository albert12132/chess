<script setup lang="ts">
import type { MoveTreeNode } from '../explorer/move_tree'
import WinRateBar from './WinRateBar.vue'

defineProps<{
  currMoveTreeNode: MoveTreeNode | undefined
  sortedNextMoves: [string, MoveTreeNode][]
}>()

const emit = defineEmits<{
  (e: 'updateMoveTree', move: string): void
}>()
</script>

<template>
  <div id="move-list">
    <div v-if="currMoveTreeNode && sortedNextMoves.length > 0">
      <table>
        <thead>
          <tr>
            <th>Move</th>
            <th>Win Rate</th>
            <th>Games</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[move, node] in sortedNextMoves" :key="move">
            <td>
              <button class="move-button" @click="() => emit('updateMoveTree', move)">
                {{ move }}
              </button>
            </td>
            <td>
              <WinRateBar
                :white-rate="((node.resultCounts.get('white') || 0) / node.count) * 100"
                :black-rate="((node.resultCounts.get('black') || 0) / node.count) * 100"
                :draw-rate="((node.resultCounts.get('draw') || 0) / node.count) * 100"
              />
            </td>
            <td>{{ node.count }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else>No data for this position.</p>
  </div>
</template>

<style scoped>
#move-list {
  border: 1px solid var(--color-dark-border);
  padding: 1rem;
  flex-grow: 1;
  overflow-y: auto;
  border-radius: 0 0 8px 8px;
  background-color: var(--color-background-mute);
}

@media (min-width: 1024px) {
  #move-list {
    padding: 1.5rem;
  }
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.2rem;
  color: var(--color-text);
}

th,
td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-dark-border);
}

.move-button {
  background-color: var(--color-dark-button-bg);
  color: var(--color-dark-text);
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.3s ease;
  width: 60px;
  flex-shrink: 0;
}

.move-button:hover {
  background-color: var(--color-dark-button-hover);
}

p {
  font-size: 1.5rem;
  color: var(--color-text);
}
</style>

<script setup lang="ts">
import type { MoveTreeNode } from '../explorer/move_tree'
import type { WinRateData } from '../composables/useWinRate'
import WinRateBar from './WinRateBar.vue'

defineProps<{
  currMoveTreeNode: MoveTreeNode | undefined
  winRateByMonth: WinRateData[]
  totalWinRate: WinRateData | null
}>()
</script>

<template>
  <div id="win-rate-view">
    <div v-if="currMoveTreeNode && currMoveTreeNode.gameHistory.length > 0">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Win Rate</th>
            <th>Games</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="totalWinRate" class="total-row">
            <td>Total</td>
            <td>
              <WinRateBar
                :white-rate="totalWinRate.whiteRate"
                :black-rate="totalWinRate.blackRate"
                :draw-rate="totalWinRate.drawRate"
              />
            </td>
            <td>{{ totalWinRate.total }}</td>
          </tr>
          <tr v-for="data in winRateByMonth" :key="data.month">
            <td>{{ data.month }}</td>
            <td>
              <WinRateBar
                :white-rate="data.whiteRate"
                :black-rate="data.blackRate"
                :draw-rate="data.drawRate"
              />
            </td>
            <td>{{ data.total }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else>No data for this position.</p>
  </div>
</template>

<style scoped>
#win-rate-view {
  border: 1px solid var(--color-dark-border);
  padding: 1.5rem;
  flex-grow: 1;
  overflow-y: auto;
  border-radius: 0 0 8px 8px;
  background-color: var(--color-background-mute);
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

.total-row {
  font-weight: bold;
  background-color: var(--color-background-soft);
}

p {
  font-size: 1.5rem;
  color: var(--color-text);
}
</style>

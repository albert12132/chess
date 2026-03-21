<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { BoardApi } from 'vue3-chessboard'
import { useMoveTree } from '../composables/useMoveTree'
import { useWinRate } from '../composables/useWinRate'

const COPY_SUCCESS_TIMEOUT_MS = 2000

const props = defineProps<{
  boardAPI: BoardApi | undefined
}>()

const isWhite = ref(true)

const {
  currMoveTreeNode,
  loading,
  sortedNextMoves,
  loadPgnsAndBuildTree,
  updateMoveTree,
  resetMoveTree,
  undoMoveTree,
} = useMoveTree(
  () => props.boardAPI,
  () => isWhite.value,
)

const { winRateByMonth, totalWinRate } = useWinRate(() => currMoveTreeNode.value)

const onSwitchColor = () => {
  isWhite.value = !isWhite.value
  props.boardAPI?.resetBoard()
  if (isWhite.value) {
    resetMoveTree()
  } else {
    props.boardAPI?.toggleOrientation()
    resetMoveTree()
  }
}

const onUndo = () => {
  props.boardAPI?.undoLastMove()
  undoMoveTree()
}

// Keyboard shortcuts
const onGlobalKeyup = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft') {
    onUndo()
  }
}
onMounted(() => {
  window.addEventListener('keyup', onGlobalKeyup)
})
onUnmounted(() => {
  window.removeEventListener('keyup', onGlobalKeyup)
})

const onReset = () => {
  props.boardAPI?.resetBoard()
  if (!isWhite.value) {
    props.boardAPI?.toggleOrientation()
  }
  resetMoveTree()
}

const copySuccess = ref(false)
let timeoutId: number = 0
const onCopyPgn = async () => {
  const pgn = props.boardAPI?.getPgn() || ''
  if (pgn === '') {
    alert('Failed to copy PGN')
    return
  }

  try {
    await navigator.clipboard.writeText(pgn)
    copySuccess.value = true
    timeoutId = window.setTimeout(() => {
      copySuccess.value = false
    }, COPY_SUCCESS_TIMEOUT_MS)
  } catch (e) {
    alert('Failed to copy PGN: ' + e)
  }
}
onUnmounted(() => {
  if (timeoutId !== 0) {
    clearTimeout(timeoutId)
  }
})

const activeTab = ref<'moves' | 'winrate'>('moves')
const chessComUsername = ref('')

const onLoad = () => {
  loadPgnsAndBuildTree(chessComUsername.value, onReset)
}

defineExpose({
  updateMoveTree,
})
</script>

<template>
  <div id="sidebar">
    <div id="buttons">
      <div class="top-buttons">
        <button @click="onSwitchColor" title="Flip board">
          <span class="pi pi-sort-alt"></span>
        </button>
        <button @click="onUndo" title="Undo move"><span class="pi pi-arrow-left"></span></button>
        <button @click="onReset" title="Reset board"><span class="pi pi-undo"></span></button>
        <button @click="onCopyPgn" title="Copy PGN">
          <span v-if="!copySuccess" class="pi pi-copy"></span>
          <span v-else class="pi pi-check-circle"></span>
        </button>
      </div>
      <div>
        <input v-model="chessComUsername" @keyup.enter="onLoad" placeholder="chess.com username" />
        <button @click="onLoad" title="Load chess.com games">
          <span v-if="loading" class="pi pi-spin pi-spinner"></span>
          <span v-else class="pi pi-cloud-download"></span>
        </button>
      </div>
    </div>
    <div class="tabs">
      <button :class="{ active: activeTab === 'moves' }" @click="activeTab = 'moves'">Moves</button>
      <button :class="{ active: activeTab === 'winrate' }" @click="activeTab = 'winrate'">
        Win Rate
      </button>
    </div>
    <div id="move-list" v-if="activeTab === 'moves'">
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
                <button class="move-button" @click="() => updateMoveTree(move)">{{ move }}</button>
              </td>
              <td>
                <div class="result-bar">
                  <div
                    class="white-segment"
                    :style="{
                      width: `${((node.resultCounts.get('white') || 0) / node.count) * 100}%`,
                    }"
                  >
                    <span v-if="((node.resultCounts.get('white') || 0) / node.count) * 100 > 10">
                      {{ Math.round(((node.resultCounts.get('white') || 0) * 100) / node.count) }}%
                    </span>
                  </div>
                  <div
                    class="black-segment"
                    :style="{
                      width: `${((node.resultCounts.get('black') || 0) / node.count) * 100}%`,
                    }"
                  >
                    <span v-if="((node.resultCounts.get('black') || 0) / node.count) * 100 > 10">
                      {{ Math.round(((node.resultCounts.get('black') || 0) * 100) / node.count) }}%
                    </span>
                  </div>
                  <div
                    class="draw-segment"
                    :style="{
                      width: `${((node.resultCounts.get('draw') || 0) / node.count) * 100}%`,
                    }"
                  >
                    <span v-if="((node.resultCounts.get('draw') || 0) / node.count) * 100 > 10">
                      {{ Math.round(((node.resultCounts.get('draw') || 0) * 100) / node.count) }}%
                    </span>
                  </div>
                </div>
              </td>
              <td>{{ node.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>No data for this position.</p>
    </div>
    <div id="win-rate-view" v-else-if="activeTab === 'winrate'">
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
                <div class="result-bar">
                  <div class="white-segment" :style="{ width: `${totalWinRate.whiteRate}%` }">
                    <span v-if="totalWinRate.whiteRate > 10"
                      >{{ Math.round(totalWinRate.whiteRate) }}%</span
                    >
                  </div>
                  <div class="black-segment" :style="{ width: `${totalWinRate.blackRate}%` }">
                    <span v-if="totalWinRate.blackRate > 10"
                      >{{ Math.round(totalWinRate.blackRate) }}%</span
                    >
                  </div>
                  <div class="draw-segment" :style="{ width: `${totalWinRate.drawRate}%` }">
                    <span v-if="totalWinRate.drawRate > 10"
                      >{{ Math.round(totalWinRate.drawRate) }}%</span
                    >
                  </div>
                </div>
              </td>
              <td>{{ totalWinRate.total }}</td>
            </tr>
            <tr v-for="data in winRateByMonth" :key="data.month">
              <td>{{ data.month }}</td>
              <td>
                <div class="result-bar">
                  <div class="white-segment" :style="{ width: `${data.whiteRate}%` }">
                    <span v-if="data.whiteRate > 10">{{ Math.round(data.whiteRate) }}%</span>
                  </div>
                  <div class="black-segment" :style="{ width: `${data.blackRate}%` }">
                    <span v-if="data.blackRate > 10">{{ Math.round(data.blackRate) }}%</span>
                  </div>
                  <div class="draw-segment" :style="{ width: `${data.drawRate}%` }">
                    <span v-if="data.drawRate > 10">{{ Math.round(data.drawRate) }}%</span>
                  </div>
                </div>
              </td>
              <td>{{ data.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>No data for this position.</p>
    </div>
  </div>
</template>

<style scoped>
#sidebar {
  padding: 1.5rem; /* Suitable padding around the sidebar */
  background-color: var(
    --color-background-soft
  ); /* Use a slightly softer background for the sidebar */
  border-radius: 8px;
  margin-left: 2rem; /* Add some space between the board and the sidebar */
  height: 90vh; /* Fixed height for the sidebar, matching common chessboard height */
  width: 60vh; /* Fixed width for the sidebar */
  box-sizing: border-box; /* Include padding in the height calculation */
  flex-shrink: 0; /* Prevent shrinking */
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  gap: 1px;
  background-color: var(--color-dark-border);
  border-radius: 6px 6px 0 0;
  overflow: hidden;
  margin-bottom: 0;
  flex-shrink: 0;
}

.tabs button {
  border-radius: 0;
  font-size: 1.2rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-background-mute);
  color: var(--color-text-dark-2);
  height: 40px; /* Fixed height for tab headers */
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabs button.active {
  background-color: var(--color-background-soft);
  color: var(--color-heading);
  border-bottom: 2px solid var(--color-heading);
}

#move-list,
#win-rate-view {
  border: 1px solid var(--color-dark-border); /* Darker border */
  padding: 1.5rem; /* Suitable padding */
  flex-grow: 1;
  overflow-y: auto;
  border-radius: 0 0 8px 8px;
  background-color: var(--color-background-mute); /* Slightly different background for the list */
}

#move-list table,
#win-rate-view table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.2rem;
  color: var(--color-text);
}

#move-list th,
#move-list td,
#win-rate-view th,
#win-rate-view td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-dark-border);
}

.total-row {
  font-weight: bold;
  background-color: var(--color-background-soft);
}

#buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem; /* Increased gap for better spacing */
  margin-bottom: 1.5rem; /* Space below the buttons section */
  flex-shrink: 0;
}

#buttons div {
  display: flex;
  gap: 0.75rem;
  width: 100%; /* Make the div take full width */
}

.top-buttons {
  display: flex;
  gap: 0.75rem; /* Adjust as needed for spacing between buttons */
  width: 100%; /* Make the div take full width */
}

button {
  background-color: var(--color-dark-button-bg); /* Darker button background */
  color: var(--color-dark-text); /* Lighter text for buttons */
  border: none;
  padding: 0.75rem 1.25rem; /* Larger padding for buttons */
  border-radius: 6px; /* Nicer rounded corners */
  cursor: pointer;
  font-size: 1.5rem; /* Larger text for buttons */
  transition: background-color 0.3s ease;
  flex-grow: 1; /* Make buttons expand */
}

button:hover {
  background-color: var(--color-dark-button-hover); /* Hover effect */
}

input {
  background-color: var(--color-background-mute); /* Darker input background */
  color: var(--color-dark-text);
  border: 1px solid var(--color-dark-border);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 1.5rem;
  flex-grow: 1; /* Allow input to grow */
}

h3 {
  font-size: 1.5rem;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.move-button {
  padding: 0.5rem 0.75rem; /* Smaller padding for move buttons */
  font-size: 1.2rem;
  width: 60px; /* Fixed width for move button */
  flex-shrink: 0; /* Prevent shrinking */
}

p {
  font-size: 1.5rem; /* Larger text for "No moves loaded" */
  color: var(--color-text);
}

.result-bar {
  display: flex;
  width: 150px; /* Adjust as needed */
  height: 15px;
  border: 1px solid var(--color-dark-border);
  border-radius: 3px;
  overflow: hidden; /* Ensures segments stay within bounds */
  font-size: 1.2rem;
}

.white-segment,
.black-segment,
.draw-segment {
  display: flex;
  align-items: center;
  color: white; /* Adjust text color for visibility */
  font-size: 0.7em; /* Smaller font size for percentages */
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5); /* Add text shadow for better readability */
  padding: 0.2em;
}

.white-segment {
  background-color: #e0e0e0; /* Light grey for white */
  color: #333; /* Darker color for text on white segment */
}

.black-segment {
  background-color: #424242; /* Dark grey for black */
}

.draw-segment {
  background-color: #9e9e9e; /* Medium grey for draw */
}
</style>

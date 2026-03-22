<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { BoardApi } from 'vue3-chessboard'
import { useMoveTree } from '../composables/useMoveTree'
import { useWinRate } from '../composables/useWinRate'
import MovesTab from './MovesTab.vue'
import WinRateTab from './WinRateTab.vue'

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
  } else if (event.key === 'ArrowUp') {
    onReset()
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
    <MovesTab
      v-if="activeTab === 'moves'"
      :curr-move-tree-node="currMoveTreeNode"
      :sorted-next-moves="sortedNextMoves"
      @update-move-tree="updateMoveTree"
    />
    <WinRateTab
      v-else-if="activeTab === 'winrate'"
      :curr-move-tree-node="currMoveTreeNode"
      :win-rate-by-month="winRateByMonth"
      :total-win-rate="totalWinRate"
    />
  </div>
</template>

<style scoped>
#sidebar {
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  margin: 1rem 0 0 0; /* Margin on top for mobile */
  height: auto; /* Let the height be determined by content on mobile */
  width: 100%; /* Full width for mobile */
  box-sizing: border-box;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  #sidebar {
    padding: 1.5rem;
    margin: 0 0 0 2rem; /* Restore side margin for desktop */
    height: 90vh; /* Fixed height for desktop */
    width: 60vh; /* Fixed width for desktop */
  }
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
  padding: 0.5rem 1rem; /* Reduced padding for mobile */
  border-radius: 6px; /* Nicer rounded corners */
  cursor: pointer;
  font-size: 1.2rem; /* Reduced font size for mobile */
  transition: background-color 0.3s ease;
  flex-grow: 1; /* Make buttons expand */
}

@media (min-width: 1024px) {
  button {
    padding: 0.75rem 1.25rem; /* Larger padding for desktop */
    font-size: 1.5rem; /* Larger text for desktop */
  }
}

button:hover {
  background-color: var(--color-dark-button-hover); /* Hover effect */
}

input {
  background-color: var(--color-background-mute); /* Darker input background */
  color: var(--color-dark-text);
  border: 1px solid var(--color-dark-border);
  padding: 0.5rem 1rem; /* Reduced padding for mobile */
  border-radius: 6px;
  font-size: 1.2rem; /* Reduced font size for mobile */
  flex-grow: 1; /* Allow input to grow */
}

@media (min-width: 1024px) {
  input {
    padding: 0.75rem 1rem; /* Larger padding for desktop */
    font-size: 1.5rem; /* Larger text for desktop */
  }
}

h3 {
  font-size: 1.5rem;
  color: var(--color-heading);
  margin-bottom: 1rem;
}
</style>

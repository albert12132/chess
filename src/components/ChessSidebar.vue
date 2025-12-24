<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { BoardApi } from 'vue3-chessboard'
import { fetchPgns, Pgn } from '../explorer/pgn'
import { buildMoveTree, MoveTree, MoveTreeNode } from '../explorer/move_tree'

const COPY_SUCCESS_TIMEOUT_MS = 2000

const props = defineProps<{
  boardAPI: BoardApi | undefined
}>()

const isWhite = ref(true)
const onSwitchColor = () => {
  isWhite.value = !isWhite.value
  props.boardAPI?.resetBoard()
  if (isWhite.value) {
    currMoveTreeNode.value = whiteMoveTree.root
  } else {
    props.boardAPI?.toggleOrientation()
    currMoveTreeNode.value = blackMoveTree.root
  }
}

const onUndo = () => {
  props.boardAPI?.undoLastMove()
  if (currMoveTreeNode.value && currMoveTreeNode.value.parent) {
    currMoveTreeNode.value = currMoveTreeNode.value.parent
  }
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
  if (isWhite.value) {
    currMoveTreeNode.value = whiteMoveTree.root
  } else {
    props.boardAPI?.toggleOrientation()
    currMoveTreeNode.value = blackMoveTree.root
  }
}

const copySuccess = ref(false)
let timeoutId: number = 0
const onCopyPgn = async () => {
  const pgn = props.boardAPI?.getPgn() || ''
  if (pgn === '') {
    alert('Failed to copy PGN')
  }

  try {
    await navigator.clipboard.writeText(pgn)
  } catch (e) {
    alert('Failed to copy PGN: ' + e)
  }

  copySuccess.value = true
  setTimeout(() => {
    copySuccess.value = false
  }, COPY_SUCCESS_TIMEOUT_MS)
}
onUnmounted(() => {
  if (timeoutId !== 0) {
    clearTimeout(timeoutId)
  }
})

let whiteMoveTree: MoveTree
let blackMoveTree: MoveTree
const currMoveTreeNode = ref<MoveTreeNode | undefined>(undefined)
const sortedNextMoves = computed(() => {
  if (!currMoveTreeNode.value) {
    return []
  }
  // Sort in descending order
  return [...currMoveTreeNode.value.children].sort(
    ([, node1], [, node2]) => node2.count - node1.count,
  )
})

const chessComUsername = ref('')
const loading = ref(false)
const loadPgnsAndBuildTree = async () => {
  if (!chessComUsername.value) {
    alert('Please enter a Chess.com username.')
    return
  }
  loading.value = true

  let pgns: Pgn[] = []
  try {
    pgns = await fetchPgns(chessComUsername.value)
  } catch (e) {
    alert('Error loading games: ' + e)
  } finally {
    loading.value = false
  }

  const whitePgns = pgns.filter((pgn) => pgn.userIsWhite)
  const blackPgns = pgns.filter((pgn) => !pgn.userIsWhite)

  whiteMoveTree = buildMoveTree(whitePgns)
  blackMoveTree = buildMoveTree(blackPgns)

  if (isWhite.value) {
    currMoveTreeNode.value = whiteMoveTree.root
  } else {
    currMoveTreeNode.value = blackMoveTree.root
  }

  onReset()
}

const updateMoveTree = (move: string) => {
  if (!currMoveTreeNode.value) {
    return
  }
  const nextNode = currMoveTreeNode.value.children.get(move)
  if (nextNode) {
    props.boardAPI?.move(move)
    currMoveTreeNode.value = nextNode
  }
}
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
        <input
          v-model="chessComUsername"
          @keyup.enter="loadPgnsAndBuildTree"
          placeholder="chess.com username"
        />
        <button @click="loadPgnsAndBuildTree" title="Load chess.com games">
          <span v-if="loading" class="pi pi-spin pi-spinner"></span>
          <span v-else class="pi pi-cloud-download"></span>
        </button>
      </div>
    </div>
    <div id="move-list">
      <h3>Next Move ({{ currMoveTreeNode?.count || 0 }} games)</h3>
      <ul v-if="currMoveTreeNode">
        <li v-for="[move, node] in sortedNextMoves" :key="move">
          <button @click="() => updateMoveTree(move)">{{ move }}</button>
          <span>{{ node.count }} times</span>
          <div class="result-bar">
            <div
              class="white-segment"
              :style="{ width: `${((node.resultCounts.get('white') || 0) / node.count) * 100}%` }"
            >
              <span v-if="((node.resultCounts.get('white') || 0) / node.count) * 100 > 5">
                {{ Math.round(((node.resultCounts.get('white') || 0) * 100) / node.count) }}%
              </span>
            </div>
            <div
              class="black-segment"
              :style="{ width: `${((node.resultCounts.get('black') || 0) / node.count) * 100}%` }"
            >
              <span v-if="((node.resultCounts.get('black') || 0) / node.count) * 100 > 5">
                {{ Math.round(((node.resultCounts.get('black') || 0) * 100) / node.count) }}%
              </span>
            </div>
            <div
              class="draw-segment"
              :style="{ width: `${((node.resultCounts.get('draw') || 0) / node.count) * 100}%` }"
            >
              <span v-if="((node.resultCounts.get('draw') || 0) / node.count) * 100 > 5">
                {{ Math.round(((node.resultCounts.get('draw') || 0) * 100) / node.count) }}%
              </span>
            </div>
          </div>
        </li>
      </ul>
      <p v-else>No moves loaded.</p>
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
}

#buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem; /* Increased gap for better spacing */
  margin-bottom: 1.5rem; /* Space below the buttons section */
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

#move-list {
  border: 1px solid var(--color-dark-border); /* Darker border */
  padding: 1.5rem; /* Suitable padding */
  height: 65vh; /* Adjust as needed */
  overflow-y: auto;
  border-radius: 8px;
  background-color: var(--color-background-mute); /* Slightly different background for the list */
}

#move-list ul {
  list-style: none;
  padding: 0;
}

#move-list li {
  margin-bottom: 0.5rem; /* More space between list items */
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text);
}

#move-list li button {
  padding: 0.5rem 0.75rem; /* Smaller padding for move buttons */
  font-size: 1.2rem;
  width: 60px; /* Fixed width for move button */
  flex-shrink: 0; /* Prevent shrinking */
}

#move-list li span {
  font-size: 1.2rem;
  color: var(--color-text-dark-2);
  width: 90px; /* Fixed width for "x times" span */
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

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { TheChessboard, type BoardApi, type BoardConfig } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
import { fetchPgns, Pgn } from './explorer/pgn'
import { buildMoveTree, MoveTree, MoveTreeNode } from './explorer/move_tree'

const boardConfig: BoardConfig = {
  coordinates: true,
  orientation: 'white',
  viewOnly: true,
}

let boardAPI: BoardApi | undefined

const pgn = ref('')
const chessComUsername = ref('sleepyyysloth')
const isWhite = ref(true)

// access the boardAPI in the onMounted hook
onMounted(() => {
  boardAPI?.loadPgn(pgn.value)
  console.log(boardAPI?.getBoardPosition())
})

const onSwitchColor = () => {
  isWhite.value = !isWhite.value
  boardAPI?.resetBoard()
  if (isWhite.value) {
    currMoveTreeNode.value = whiteMoveTree.root
  } else {
    boardAPI?.toggleOrientation()
    currMoveTreeNode.value = blackMoveTree.root
  }
}

const onUndo = () => {
  boardAPI?.undoLastMove()
  if (currMoveTreeNode.value && currMoveTreeNode.value.parent) {
    currMoveTreeNode.value = currMoveTreeNode.value.parent
  }
}

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

const loadPgnsAndBuildTree = async () => {
  if (!chessComUsername.value) {
    console.warn('Please enter a Chess.com username.')
    return
  }
  console.log(`Fetching PGNs for ${chessComUsername.value}...`)
  const pgns: Pgn[] = await fetchPgns(chessComUsername.value)
  console.log(`Found ${pgns.length} PGNs. Building move tree...`)

  const whitePgns = pgns.filter((pgn) => pgn.userIsWhite)
  const blackPgns = pgns.filter((pgn) => !pgn.userIsWhite)

  whiteMoveTree = buildMoveTree(whitePgns)
  blackMoveTree = buildMoveTree(blackPgns)
  console.log('White move Tree:', whiteMoveTree)
  console.log('Black move Tree:', blackMoveTree)

  if (isWhite.value) {
    currMoveTreeNode.value = whiteMoveTree.root
  } else {
    currMoveTreeNode.value = blackMoveTree.root
  }
}

const updateMoveTree = (move: string) => {
  if (!currMoveTreeNode.value) {
    return
  }
  const nextNode = currMoveTreeNode.value.children.get(move)
  if (nextNode) {
    boardAPI?.move(move)
    currMoveTreeNode.value = nextNode
  }
}
</script>

<template>
  <main>
    <TheChessboard :board-config="boardConfig" @board-created="(api) => (boardAPI = api)" />
    <div>
      <div id="buttons">
        <button @click="onSwitchColor">Switch to {{ isWhite ? 'black' : 'white' }}</button>
        <button @click="onUndo">Undo</button>
        <div>
          <input v-model="chessComUsername" placeholder="Chess.com Username" />
          <button @click="loadPgnsAndBuildTree">Load Chess.com PGNs</button>
        </div>
      </div>
      <div id="move-list">
        <h3>Next Move Tree</h3>
        <ul v-if="currMoveTreeNode">
          <li v-for="[move, node] in sortedNextMoves" :key="move">
            <button @click="() => updateMoveTree(move)">{{ move }}</button>
            <span>{{ node.count }} times</span>
            <span>
              White:
              {{ Math.round(((node.resultCounts.get('white') || 0) * 100) / node.count) }}%
            </span>
            <span>
              Black:
              {{ Math.round(((node.resultCounts.get('black') || 0) * 100) / node.count) }}%
            </span>
            <span>
              Draw:
              {{ Math.round(((node.resultCounts.get('draw') || 0) * 100) / node.count) }}%
            </span>
          </li>
        </ul>
        <p v-else>No moves loaded.</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}
#buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-right: 1rem;
}
#buttons div {
  display: flex;
  gap: 0.5rem;
}
textarea {
  width: 100%;
  height: 10rem;
}
#move-list {
  margin-left: 1rem;
  border: 1px solid #ccc;
  padding: 1rem;
  max-height: 500px; /* Adjust as needed */
  overflow-y: auto;
}
#move-list ul {
  list-style: none;
  padding: 0;
}
#move-list li {
  margin-bottom: 0.25rem;
}
</style>

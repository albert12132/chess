<script setup lang="ts">
const props = defineProps<{
  whiteRate: number
  blackRate: number
  drawRate: number
}>()
</script>

<template>
  <div
    class="result-bar"
    :title="`White: ${Math.round(props.whiteRate)}% | Black: ${Math.round(props.blackRate)}% | Draw: ${Math.round(props.drawRate)}%`"
  >
    <div class="white-segment" :style="{ width: `${props.whiteRate}%` }">
      <span v-if="props.whiteRate > 10">{{ Math.round(props.whiteRate) }}%</span>
    </div>
    <div class="black-segment" :style="{ width: `${props.blackRate}%` }">
      <span v-if="props.blackRate > 10">{{ Math.round(props.blackRate) }}%</span>
    </div>
    <div class="draw-segment" :style="{ width: `${props.drawRate}%` }">
      <span v-if="props.drawRate > 10">{{ Math.round(props.drawRate) }}%</span>
    </div>
  </div>
</template>

<style scoped>
.result-bar {
  display: flex;
  width: 150px;
  height: 15px;
  border: 1px solid var(--color-dark-border);
  border-radius: 3px;
  overflow: hidden;
  font-size: 1.2rem;
}

.white-segment,
.black-segment,
.draw-segment {
  display: flex;
  align-items: center;
  color: white;
  font-size: 0.7em;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  padding: 0.2em;
}

.white-segment {
  background-color: #e0e0e0;
  color: #333;
}

.black-segment {
  background-color: #424242;
}

.draw-segment {
  background-color: #9e9e9e;
}
</style>

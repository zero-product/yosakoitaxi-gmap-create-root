<script setup>
defineProps({
  points: Array
})
</script>

<template>
  <v-sheet
    min-width="330px"
    max-width="100%"
    class="px-3 py-4"
  >
    <div class="d-flex">
      <h3 class="text-blue-grey mb-4">ルート詳細</h3>
      <v-spacer></v-spacer>
    </div>
    <template
      v-if="points.length"
      v-for="(route, r) in points"
      :key="r"
    >
      <div
        class="d-flex flex-column"
        v-if="route.children"
      >
        <v-icon class="mx-auto">mdi-chevron-down</v-icon>
        <v-sheet class="rounded-t border-t border-e border-s">
          <div class="d-flex justify-space-between">
            <template v-for="(cld, c) in route.children">
              <v-divider vertical v-if="c > 0"></v-divider>
              <span
                class="px-3 py-1 text-center text-blue-grey"
                style="width:50%"
              >{{cld.label}}</span>
            </template>
          </div>
        </v-sheet>
      </div>
      <v-sheet
        color="indigo-lighten-5"
        class="d-flex align-center px-3 py-2"
        :class="!r ? 'rounded' : 'rounded-b'"
        style="gap:10px;"
      >
        <v-icon size="30" color="indigo">mdi-map-marker-radius</v-icon>
        <div class="d-flex flex-column">
          <span class="text-indigo text-subtitle-2">{{ route.facility }}</span>
          <small class="text-indigo">{{ route.label }}</small>
        </div>
      </v-sheet>
    </template>
  </v-sheet>
</template>

<style scoped>
</style>

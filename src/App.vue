<script setup>
// コンポーネント
import CmpButtons from './components/Buttons.vue';
import CmpSettings from './components/Settings.vue'
import CmpCourse from './components/Course.vue'
import CmpMap from './components/Map.vue'

import { onMounted, ref, watch } from 'vue'
import { login } from './plugins/firebase-auth'
// =================================
// データ
const docId  = ref(null)
const search = ref(false)
const routes = ref([])

// =================================
// 項目入力用
const inputs = ref({
  date: null,
  name: null,
  mapSetting: {
    travelMode       : 'DRIVING',
    avoidHighways    : true,
    optimizeWaypoints: true,
  },
  car: {
    jumbo  : 0,
    compact: 1,
  },
  type  : 'car',
  people: 0,
  start : '高知よさこいタクシー',
  goal  : '',
  points: [],
})

// =================================
// 距離・時間・料金出力用
const values = ref({
  dulation: 0,
  distance: 0,
  prices  : {},
})


onMounted(async () => {
  await login()
})

/** ****************************************
 * calcType を監視
 **************************************** */
watch(() => inputs.value.type, () => {
  inputs.value.car    = { jumbo: 0, compact: 1 }
  inputs.value.people = 1
})


/** ****************************************
 * 検索ボタン クリックアクション
 **************************************** */
const clickSearch = () => search.value = true

/** ****************************************
 * 経路検索結果
 * @param {Array} route - ルート
 * @param {Object} dnd  - 距離・時間
 * @param {Array} price - 車両別料金
 **************************************** */
const searchDistance = (route, dnd, price) => {
  search.value = false
  routes.value = route
  values.value = {
    distance: dnd.distance,
    dulation: dnd.dulation,
    prices  : price,
  }
}
</script>

<template>
  <v-app>
    <v-main>
      <v-container>

        <!-- :disabled-create="!routes.length ? true : false" -->
        <!-- :disabled-save="false" -->
        <CmpButtons
          :disabled-save="!routes.length ? true : false"
          :disabled-load="false"
          :disabled-create="true"
          :inputs="inputs"
          :values="values"
          @save="docId = $event"
          @load="inputs = $event"
        />

        <v-sheet
          class="d-flex flex-lg-row flex-column"
          elevation="2"
          rounded
        >
          <v-sheet class="d-flex flex-md-row flex-column">
            <CmpSettings
              :inputs="inputs"
              :values="values"
              :routes="routes"
              @update="inputs = $event"
              @search="clickSearch"
            />
          </v-sheet>

          <v-divider
            class="mx-0 my-5 mx-md-5 my-md-0"
            :vertical="!$vuetify.display.md && !$vuetify.display.sm && !$vuetify.display.xs"
          />

          <CmpCourse :points="routes" />

          <v-divider
            class="mx-0 mt-5 ml-md-5 my-md-0"
            :vertical="!$vuetify.display.md && !$vuetify.display.sm && !$vuetify.display.xs"
          />

          <CmpMap
            :inputs="inputs"
            :search="search"
            @search="searchDistance"
          />
        </v-sheet>
      </v-container>
    </v-main>
  </v-app>

</template>

<style scoped lang="scss">
.calc-contents {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.number-of-car {
  display: flex;
  flex-direction: column;
  gap: 5px;

  .car-input {
    display: flex;
    gap: 5px;
    align-items: end;
  }
}
</style>


<style lang="scss">
.icon-del {
  .v-field__field {
    align-items: flex-end;
    span, input {
      padding: 0;
    }

    input {
      &::-webkit-calendar-picker-indicator {
        display: none;
      }
    }
  }
}

.v-timeline-item__opposite {
  display: none;
}
</style>

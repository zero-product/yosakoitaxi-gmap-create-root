<script setup>
import CmpPrices from './Prices.vue'
import { ref, watch, onMounted } from 'vue';

const inputs = ref({})
const calcTypes = ref([
  { label: '車種で計算', value: 'car' },
  { label: '人数で計算', value: 'people' }
])
const emit  = defineEmits(['search'])
const props = defineProps({
  inputs: Object,
  values: Object,
  routes: Array,
})
onMounted(() => {
  inputs.value = props.inputs
})


watch(() => props.inputs, (aft) => inputs.value = aft)
watch(() => inputs.value, (aft) => emit('update', aft))


/** ****************************************
 * 人数に伴う車両数算出
 * @param {Number} ppl - 人数
 **************************************** */
const carValiables = (ppl) => {
  const input = inputs.value
  const car   = input.car

  if (input.type === 'people') {
    ppl = Number(ppl.target.value)

    const max_compact = 4
    const max_jumbo   = 9

    const jumbo = Math.floor(ppl / max_jumbo)
    car.jumbo = jumbo
    if (jumbo === 0) {
      // 4人以下
      const _compact  = ppl % max_compact
      const compact   = Math.floor(ppl / max_compact)
      if (_compact > 0 && compact > 0 || compact > 1) {
        car.compact = 0
        car.jumbo = 1
      } else {
        car.compact = 1
      }
    } else {
      // 5人以上
      const _jumbo    = ppl % max_jumbo
      const _compact  = _jumbo % max_compact
      const compact   = Math.floor(_jumbo / max_compact)
      if (compact && _compact || compact > 1 ) {
        car.compact = 0
        car.jumbo   = jumbo + 1
      } else if (!compact && _compact || compact && !_compact) {
        inputs.value.car.compact = 1
      } else {
        car.compact = 0
      }
    }
  }
}

/** ****************************************
 * 経路追加・削除ボタン
 * @param {Number} i - 配列インデックス番号
 **************************************** */
const addPoint    = (i) => inputs.value.points.splice(i+1, 0, {place: '', standBy: 0})
const removePoint = (i) => inputs.value.points.splice(i, 1)
</script>

<template>
  <v-sheet
    v-if="Object.keys(inputs).length"
    class="d-flex calc-contents px-3 py-4"
    width="500px"
    min-width="330px"
    max-width="100%"
  >
    <div class="d-flex">
      <h3 class="text-blue-grey">経路設定</h3>
      <v-spacer></v-spacer>
      <v-text-field
        type="date"
        class="icon-del"
        density="compact"
        variant="underlined"
        hide-details="auto"
        style="max-width:200px"
        suffix="ご利用"
        v-model="inputs.date"
      ></v-text-field>
    </div>

    <v-btn-toggle
      mandatory
      v-model="inputs.type"
      variant="outlined"
      selected-class="bg-green"
      density="compact"
      class="mb-5 d-print-none"
    >
      <v-btn
        style="width:50%;"
        v-for="(type, i) in calcTypes"
        :value="type.value"
      >{{type.label}}</v-btn>
    </v-btn-toggle>

    <div
      v-if="inputs.type === 'car'"
      class="d-flex" style="gap:10px;"
    >
      <div class="car-input">
        <v-text-field
          hide-details
          :min="0"
          type="number"
          label="小型タクシー"
          density="compact"
          variant="outlined"
          v-model="inputs.car.compact"
          @change="carValiables"
        >
          <template v-slot:prepend-inner>
            <v-icon
              icon="mdi-car-side"
              :color="Number(inputs.car.compact) ? 'blue-darken-1' : 'grey lighten-1'"
            />
          </template>
          <template v-slot:append-inner>
            <span>台</span>
          </template>
        </v-text-field>
      </div>

      <div class="car-input">
        <v-text-field
          hide-details
          :min="0"
          type="number"
          label="ジャンボタクシー"
          density="compact"
          variant="outlined"
          v-model="inputs.car.jumbo"
          @change="carValiables"
        >
          <template v-slot:prepend-inner>
            <v-icon
              icon="mdi-car-estate"
              :color="Number(inputs.car.jumbo) ? 'blue-darken-3' : 'grey lighten-1'"
            />
          </template>
          <template v-slot:append-inner>
            <span>台</span>
          </template>
        </v-text-field>
      </div>
    </div>

    <div v-else>
      <v-text-field
        hide-details
        min="1"
        type="number"
        label="人数"
        class="mb-3"
        density="compact"
        variant="outlined"
        v-model="inputs.people"
        @change="carValiables"
      >
        <template v-slot:prepend-inner>
          <v-icon icon="mdi-account" />
        </template>
        <template v-slot:append-inner>
          <span style="white-space:nowrap;">名様</span>
        </template>
      </v-text-field>

      <div class="d-flex justify-center" style="gap:20px;">
        <div class="d-flex flex-column align-center">
          <strong
            class="text-caption font-weight-bold"
            :class="inputs.car.compact > 0 ? 'text-blue' : 'text-blue-grey-lighten-4'"
            v-text="'小型タクシー'"
          ></strong>

          <div style="display:flex;gap:5px;align-items:center;">
            <v-icon
              size="30"
              :color="inputs.car.compact > 0 ? 'blue' : 'blue-grey-lighten-4'"
            >mdi-car-side</v-icon>
            <span>
              <v-icon size="20">mdi-close</v-icon>
              <span>{{inputs.car.compact}}</span>
              <span>台</span>
            </span>
          </div>
        </div>

        <div class="d-flex flex-column align-center">
          <strong
            class="text-caption font-weight-bold"
            :class="inputs.car.jumbo > 0 ? 'text-blue' : 'text-blue-grey-lighten-4'"
            v-text="'ジャンボタクシー'"
          ></strong>
          <div style="display:flex;gap:5px;align-items:center;">
            <v-icon
              size="30"
              :color="inputs.car.jumbo > 0 ? 'blue' : 'blue-grey-lighten-4'"
            >mdi-car-estate</v-icon>
            <span>
              <v-icon size="20">mdi-close</v-icon>
              <span>{{inputs.car.jumbo}}</span>
              <span>台</span>
            </span>
          </div>
        </div>
      </div>
    </div>


    <div>
      <v-switch
        @change="inputs.mapSetting.avoidHighways = !$event.target.checked"
        hide-details
        color="green"
        class="d-print-none"
        label="高速道路を使用する"
        density="compact"
      ></v-switch>
    </div>

    <div class="d-flex flex-column" style="gap:12px;">
      <div
        class="d-flex align-center"
        style="gap:10px;"
      >
        <v-text-field
          hide-details
          label="出発地"
          density="compact"
          variant="outlined"
          v-model="inputs.start"
          :style="{
            width: 'calc(100% - '+ (inputs.points.length ? 170 : 40) +'px)',
            maxWidth: 'calc(100% - '+ (inputs.points.length ? 170 : 40) +'px)'
          }"
        ></v-text-field>
        <v-btn
          icon="mdi-plus"
          color="info"
          class="d-print-none"
          density="compact"
          :disabled="inputs.points.length >= 8 ? true : false"
          @click="addPoint(-1)"
        ></v-btn>
      </div>

      <div
        class="d-flex align-center"
        style="gap:10px;"
        v-if="inputs.points.length"
        v-for="(point, p) in inputs.points"
        :key="p"
      >
        <v-text-field
          hide-details
          label="経由地"
          density="compact"
          variant="outlined"
          v-model="point.place"
          :style="{
            width: 'calc(100% - '+ (inputs.points.length ? 170 : 40) +'px)',
            maxWidth: 'calc(100% - '+ (inputs.points.length ? 170 : 40) +'px)'
          }"
        ></v-text-field>
        <div
          class="d-flex align-center"
          style="gap:5px;"
        >
          <v-text-field
            hide-details
            min="0"
            type="number"
            label="滞在時間"
            style="max-width:90px"
            density="compact"
            variant="outlined"
            v-model="point.standBy"
            @change="point.standBy = $event.target.value || 0 "
          >
            <template v-slot:append-inner>
              <span>分</span>
            </template>
          </v-text-field>
          <div class="d-flex d-print-none" style="gap:5px;">
            <v-btn
              icon="mdi-plus"
              color="info"
              density="compact"
              :disabled="inputs.points.length === 8"
              @click="addPoint(p)"
            ></v-btn>
            <div style="flex:1"></div>
            <v-btn
              icon="mdi-minus"
              color="warning"
              density="compact"
              @click="removePoint(p)"
            ></v-btn>
          </div>
        </div>
      </div>

      <v-text-field
        hide-details
        label="到着地"
        density="compact"
        variant="outlined"
        v-model="inputs.goal"
        :style="{
          width: 'calc(100% - '+ (inputs.points.length ? 170 : 40) +'px)',
          maxWidth: 'calc(100% - '+ (inputs.points.length ? 170 : 40) +'px)'
        }"
      ></v-text-field>
    </div>

    <div class="d-flex">
      <v-btn
        block
        size="default"
        color="green"
        class="d-print-none"
        rounded="pill"
        prepend-icon="mdi-map-search"
        :disabled="
          !inputs.start ||
          !inputs.goal ||
          inputs.points.filter(v => !v.place).length ? true : false"
        @click="emit('search')"
      >検索</v-btn>
    </div>

    <CmpPrices
      v-if="Object.keys(inputs.mapSetting).length"
      :prices="props.values.prices"
      :distance="props.values.distance"
      :dulation="props.values.dulation"
      :map-setting="inputs.mapSetting"
    />
  </v-sheet>
</template>

<style lang="scss" scoped>

</style>
<template>
  <v-sheet
    color="green-lighten-5"
    elevation="2"
  >
    <div class="px-4 py-2 text-green">距離： <span class="font-weight-bold">{{distance/1000}} km</span></div>
    <v-divider color="green-lighten-4"></v-divider>
    <div class="px-4 py-2 text-green">時間： <span class="font-weight-bold">{{sec2time(dulation)}}</span></div>
    <v-divider color="green-lighten-4"></v-divider>
    <div class="px-4 py-2 text-green">料金： <span class="font-weight-bold">{{outputPrice()}}</span></div>
  </v-sheet>
  <small v-if="!mapSetting.avoidHighways" class="text-error font-weight-bold">※ 高速料金は別途お支払いいただきます。</small>
</template>

<script setup>
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import duration from 'dayjs/plugin/duration'
dayjs.extend(utc)
dayjs.extend(duration)

const props = defineProps({
  prices    : Object,
  distance  : Number,
  dulation  : Number,
  mapSetting: Object,
})

/** ****************************************
 * 料金出力
 * - 距離 または 時間貸 で多い方を出力
 **************************************** */
const outputPrice = () => {
  const prc = props.prices
  const appr_price = prc.time > prc.distance ? prc.time : prc.distance
  return appr_price ? '￥'+Number(appr_price).toLocaleString() : '－'
}

/** ****************************************
 * 秒から時分秒に変換
 * @param {Number} sec - 秒数
 **************************************** */
const sec2time = (sec) => {
  const sub = dayjs().subtract(sec, 'seconds')
  const duration = dayjs.duration(dayjs().diff(sub))
  return dayjs.utc(duration.asMilliseconds()).format('H:mm:ss')
}
</script>

<style lang="scss" scoped>

</style>
<template>
  <v-sheet width="100%">
    <div id="map" style="width:100%"></div>
  </v-sheet>
</template>

<script setup>
import { watch } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';
const env = import.meta.env

const emit  = defineEmits(['search'])
const props = defineProps({
  inputs: Object,
  search: Boolean,
})


watch(() => props.search, async (aft, bef) => {
  console.log(aft, bef)
  if (aft) await distanceMatrix()
})


const loaderInit = async () => {
  const loader = new Loader({
    apiKey    : env.VITE_API_KEY,
    language  : 'ja',
    region    : 'JP',
    libraries : ['drawing', 'geometry', 'places', 'visualization'],
  });
  return await loader.load()
}


/** ****************************************
 * マップ表示 - ルート出力
 **************************************** */
const distanceMatrix = async () => {
  const google = await loaderInit()

  const dnd   = { dulation: 0, distance: 0 }
  const mapEl = document.getElementById('map')
  mapEl.style.width  = '100%'
  mapEl.style.height = '480px'


  const waypoints = props.inputs.points.map(p => { return { location: p.place } })
  const drConfig  = { draggable: true, preserveViewport:false }

  const map = new google.maps.Map(mapEl);
  const d   = new google.maps.DirectionsService()
  const dr  = new google.maps.DirectionsRenderer(drConfig)


  dr.setMap(map)
  d.route({
    origin            : props.inputs.start,  // 出発地
    destination       : props.inputs.goal,   // 到着地
    avoidHighways     : props.inputs.mapSetting.avoidHighways, // 高速は利用しない
    travelMode        : google.maps.TravelMode[props.inputs.mapSetting.travelMode], // 車モード
    // optimizeWaypoints : mapSetting.optimizeWaypoints, // 最適化を有効
    waypoints         : waypoints, // 経由地
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      dr.setDirections(response);
      const legs = response.routes[0].legs
      const routes = []

      legs.forEach((leg, i) => {
        if (!i) {
          routes.push({
            id: i + 1,
            label: leg.start_address.replace(/日本、.*\s/, ''),
            facility: props.inputs.start,
          })
        }

        routes.push({
          id: i + 2,
          label: leg.end_address.replace(/日本、.*\s/, ''),
          facility: i + 1 === legs.length ? props.inputs.goal : props.inputs.points[i].place,
          expanded: true,
          children: [
            { id: 1, label: '距離：'+leg.distance.text },
            { id: 2, label: '時間：'+leg.duration.text },
          ]
        })
      })

      legs.forEach(val => {
        dnd.dulation += val.duration.value;
        dnd.distance += val.distance.value;
      })

      dr.setDirections(response)
      let standBy = 0
      props.inputs.points.forEach(v => {
        dnd.dulation += (v.standBy * 60)
        standBy  += (v.standBy * 60)
      })

      const price_compact = priceValiables('small', props.inputs.car.compact, dnd.distance, dnd.dulation, standBy)
      const price_jumbo   = priceValiables('large', props.inputs.car.jumbo, dnd.distance, dnd.dulation, standBy)
      const prices = {
        time: price_compact.time + price_jumbo.time,
        distance: price_compact.distance + price_jumbo.distance
      }

      emit('search', routes, dnd, prices)
    } else {
      alert('Directions 失敗(' + status + ')');
    }
  })
}


/** ****************************************
 * 料金算出
 * @param {String} type       - 車種(small|large)
 * @param {Number} amount     - 台数
 * @param {Number} distance   - 距離(m)
 * @param {Number} time       - 所要時間(s)
 * @param {Number} stay       - 待ち時間(s)
 * @param {Boolean} handicap  - 障害者
 * @param {Boolean} night     - 深夜早朝
 **************************************** */
const priceValiables = (type, amount, distance, time, stay = 0, handicap = false, night = false) => {
  const ret = { time: '', distance: '' }
  // console.log(type, amount, distance, time, stay)

  const default_distance = 1250 // 初乗り距離(m)
  const default_price = type === 'small' ? 580 : 590  // 初乗り運賃(円)
  const add_distance  = type === 'small' ? 288 : 293  // 加算距離(m)
  const add_price     = type === 'small' ? 80 : 90    // 加算運賃(円)

  const stay_time   = type === 'small' ? 110 : 105  // 待ち時間(s)
  const stay_price  = type === 'small' ? 80 : 90    // 待ち運賃(円)

  const halfHour_price  = type === 'small' ? 2800 : 3090  // 30分運賃(円)
  const min_time        = 30 * 60  // 最低使用時間(30分 -> 秒)

  ret.time = calcByTime()
  ret.distance = calcByDistance()


  // 深夜2割増し
  if ( night ) {
    ret.time = Math.ceil(ret.time * 1.2)
    ret.distance = Math.ceil(ret.distance * 1.2)
  }

  // 障がい者1割引
  if ( handicap ) {
    ret.time = Math.ceil(ret.time * 0.9)
    ret.distance = Math.ceil(ret.time * 0.9)
  }

  // 台数分算出
  ret.time = ret.time * amount
  ret.distance = ret.distance * amount

  return ret

  // ---------------------
  // 距離運賃
  function calcByDistance() {
    // 総合距離から初乗り距離を差し引いた距離
    const diff_distance = distance - default_distance

    // 加算される料金(切り捨て)
    const diff_price = Math.floor(diff_distance / add_distance) * add_price

    // 待ち時間料金
    const stayed_price = stay ? Math.floor(stay / stay_time) * stay_price : 0

    // 総合計
    return default_price + diff_price + stayed_price
  }

  // ---------------------
  // 時間制運賃
  function calcByTime() {
    // 時間計算(切り上げ)
    const price_of_time = Math.ceil(time / min_time) * halfHour_price

    // 待ち時間料金
    const stayed_price = stay ? Math.floor(stay / stay_time) * stay_price : 0

    return price_of_time + stayed_price
  }
}
</script>

<style lang="scss" scoped>

</style>
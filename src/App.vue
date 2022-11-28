<script setup>
// import { Loader } from 'google-maps';
import { Loader } from '@googlemaps/js-api-loader';
import { onMounted, ref, watch } from 'vue';
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import utc from 'dayjs/plugin/utc'
import { Icon } from '@iconify/vue';
const env = import.meta.env

dayjs.extend(utc)
dayjs.extend(duration)

const loader = new Loader(env.VITE_API_KEY);
// const loader = new Loader({
//   apiKey    : 'AIzaSyCKRJqa7GsR4M2IAqski7Eah6jzoBJenZM',
//   language  : 'ja',
//   region    : 'JP',
//   libraries : ['drawing', 'geometry', 'places', 'visualization'],
// });

// 要素
const mapElement  = ref()
const map = ref(null)


// データ
const points = ref([{place: '', standBy: 0}])
const startPoint = ref('高知よさこいタクシー')
const goalPoint = ref('高知竜馬空港')
const routeSetting = ref({
  travelMode       : 'DRIVING',
  avoidHighways    : true,
  optimizeWaypoints: true,
})
const g         = ref(null)
const dulation  = ref(0)
const distance  = ref(0)
const people    = ref(1)
const car       = ref({ jumbo: 0, compact: 1 })
const prices    = ref({})
const calcTypes = ref([
  { label: '車種で計算', value: 'car' },
  { label: '人数で計算', value: 'people' }
])
const calcType  = ref('car')
const routeTree = ref([])

onMounted(async () => {
  g.value = await loader.load();
})

/** ****************************************
 * calcType を監視
 **************************************** */
watch(calcType, () => {
  car.value = { jumbo: 0, compact: 1 }
  people.value = 1
})


/** ****************************************
 * 人数に伴う車両数算出
 * @param {Number} ppl - 人数
 **************************************** */
const carValiables = (ppl) => {
  if (calcType.value === 'people') {
    ppl = Number(ppl.target.value)

    const max_compact = 4
    const max_jumbo   = 9

    const jumbo = Math.floor(ppl / max_jumbo)
    car.value.jumbo = jumbo
    if (jumbo === 0) {
      // 4人以下
      const _compact  = ppl % max_compact
      const compact   = Math.floor(ppl / max_compact)
      if (_compact > 0 && compact > 0 || compact > 1) {
        car.value.compact = 0
        car.value.jumbo = 1
      } else {
        car.value.compact = 1
      }
    } else {
      // 5人以上
      const _jumbo    = ppl % max_jumbo
      const _compact  = _jumbo % max_compact
      const compact   = Math.floor(_jumbo / max_compact)
      if (compact && _compact || compact > 1 ) {
        car.value.compact = 0
        car.value.jumbo   = jumbo + 1
      } else if (!compact && _compact || compact && !_compact) {
        car.value.compact = 1
      } else {
        car.value.compact = 0
      }
    }
  }
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

/** ****************************************
 * 料金出力
 * - 距離 または 時間貸 で多い方を出力
 **************************************** */
const outputPrice = () => {
  const prc = prices.value
  const appr_price = prc.time > prc.distance ? prc.time : prc.distance
  return appr_price ? '￥'+Number(appr_price).toLocaleString() : '－'
}

/** ****************************************
 * 経路追加・削除ボタン
 * @param {Number} i - 配列インデックス番号
 **************************************** */
const addPoint    = (i) => points.value.splice(i + 1, 0, {place: '', standBy: 0})
const removePoint = (i) => points.value.splice(i, 1)

/** ****************************************
 * 秒から時分秒に変換
 * @param {Number} sec - 秒数
 **************************************** */
const sec2time = (sec) => {
  const sub = dayjs().subtract(sec, 'seconds')
  const duration = dayjs.duration(dayjs().diff(sub))
  return dayjs.utc(duration.asMilliseconds()).format('H:mm:ss')
}

/** ****************************************
 * マップ表示 - ルート出力
 **************************************** */
const distanceMatrix = async () => {
  const google = g.value

  dulation.value = 0
  distance.value = 0

  const mapEl = mapElement.value
  mapEl.style.width  = '100%'
  mapEl.style.height = '480px'
  map.value = new google.maps.Map(mapEl, {
    center: new google.maps.LatLng(33.5596775,133.5290307), // マップの中心
    zoom  : 11 // ズームレベル
  });


  const waypoints = []
  points.value.forEach(p => waypoints.push({ location: p.place }))

  const drConf = {
    draggable: true,
    preserveViewport:false
  }

  const d   = new google.maps.DirectionsService()
  const dr  = new google.maps.DirectionsRenderer(drConf)
  dr.setMap(map.value);
  // dr.setPanel(routePanel.value);


  d.route({
		origin            : startPoint.value,  // 出発地
		destination       : goalPoint.value,  // 到着地
		avoidHighways     : routeSetting.value.avoidHighways, // 高速は利用しない
		travelMode        : google.maps.TravelMode[routeSetting.value.travelMode], // 車モード
		optimizeWaypoints : routeSetting.value.optimizeWaypoints, // 最適化を有効
		waypoints         : waypoints.filter(v => v) // 経由地
	}, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      dr.setDirections(response);
      const legs = response.routes[0].legs


      routeTree.value = legs.map((leg, i) => {
        return {
          id: i + 1,
          label: leg.start_address.replace(/日本.*\s/, ''),
          facility: !i ? startPoint.value : points.value[i - 1].place,
          expanded: true,
          children: [
            { id: 1, label: '距離：'+leg.distance.text },
            { id: 2, label: '時間：'+leg.duration.text },
          ]
        }
      })
      routeTree.value.push({
        id: legs.length,
        label: legs[legs.length - 1].end_address.replace(/日本.*\s/, ''),
        facility: goalPoint.value,
      })


      legs.forEach(val => {
        dulation.value += val.duration.value;
				distance.value += val.distance.value;
      })

      dr.setDirections(response)
      let standBy = 0
      points.value.forEach(v => {
        dulation.value += (v.standBy * 60)
        standBy += (v.standBy * 60)
      })

      const price_compact = priceValiables('small', car.value.compact, distance.value, dulation.value, standBy)
      const price_jumbo   = priceValiables('large', car.value.jumbo, distance.value, dulation.value, standBy)
      prices.value = {
        time: price_compact.time + price_jumbo.time,
        distance: price_compact.distance + price_jumbo.distance
      }
		} else {
      prices.value = {}
			alert('Directions 失敗(' + status + ')');
		}
  })

}
</script>

<template>
  <div>
    <div class="pa-4">
      <va-card>
        <!-- <va-card-title>経路設定</va-card-title> -->
        <va-card-content style="display:flex;">
          <div style="width:50%">

            <div>
              <va-radio
                v-for="(type, i) in calcTypes"
                v-model="calcType"
                :key="i"
                :label="type.label"
                :option="type.value"
              />
            </div>

            <div>
              <div
                v-if="calcType === 'car'"
                :style="{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  padding: '15px'
                }"
              >
                <div style="display:flex;gap:5px;align-items:end;">
                  <Icon
                    icon="mdi:car-side"
                    :width="30"
                    :color="car.compact > 0 ? '#3472F0':'#aaa'"
                  />
                  <va-input
                    outline
                    clearable
                    min="0"
                    type="number"
                    label="小型タクシー"
                    style="max-width:150px"
                    v-model="car.compact"
                    @change="carValiables"
                  />
                  <span>台</span>
                  <div style="flex:1"></div>
                </div>

                <div style="display:flex;gap:5px;align-items:end;">
                  <Icon
                    icon="mdi:car-estate"
                    :width="30"
                    :color="car.jumbo > 0 ? '#3472F0':'#aaa'"
                  />
                  <va-input
                    outline
                    clearable
                    min="0"
                    type="number"
                    label="ジャンボタクシー"
                    style="max-width:150px"
                    v-model="car.jumbo"
                    @change="carValiables"
                  />
                  <span>台</span>
                  <div style="flex:1"></div>
                </div>
              </div>

              <div
                v-else
                :style="{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  padding: '15px'
                }"
              >
                <div style="display:flex;gap:5px;align-items:end;">
                  <va-input
                    outline
                    clearable
                    min="1"
                    max="90"
                    type="number"
                    label="人数"
                    style="width:100px;max-width:100px"
                    v-model="people"
                    @change="carValiables"
                  />
                  <span>名様</span>
                </div>

                <div style="display:flex;gap:20px;">
                  <div
                    :style="{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }"
                  >
                    <strong :style="{
                      color: car.compact > 0 ? '#3472F0' : '#aaa',
                      fontSize: '11px',
                    }">小型タクシー</strong>
                    <div style="display:flex;gap:5px;align-items:center;">
                      <Icon
                        icon="mdi:car-side"
                        :width="30"
                        :color="car.compact > 0 ? '#3472F0':'#aaa'"
                      />
                      <span>
                        <Icon icon="mdi:close" />
                        <span>{{car.compact}}</span>
                        <span>台</span>
                      </span>
                    </div>
                  </div>

                  <div
                    :style="{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }"
                  >
                    <strong :style="{
                      color: car.jumbo > 0 ? '#3472F0' : '#aaa',
                      fontSize: '11px',
                    }">ジャンボタクシー</strong>
                    <div style="display:flex;gap:5px;align-items:center;">
                      <Icon
                        icon="mdi:car-estate"
                        :width="30"
                        :color="car.jumbo > 0 ? '#3472F0':'#aaa'"
                      />
                      <span>
                        <Icon icon="mdi:close" />
                        <span>{{car.jumbo}}</span>
                        <span>台</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div :style="{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              padding: '15px'
            }">
              <va-checkbox
                class="mb-1"
                v-model="routeSetting.avoidHighways"
                label="高速道路を使用しない"
              />

              <!--
                <va-checkbox
                  class="mb-1"
                  v-model="routeSetting.optimizeWaypoints"
                  label="ルートを最適化する"
                />
              -->

              <!--
                <va-select
                  outline
                  class="mb-1"
                  label="移動手段"
                  style="width:150px"
                  text-by="text"
                  value-by="value"
                  :options="[
                    { text: '徒歩', value: 'WALKING' },
                    { text: '自転車', value: 'BICYCLING' },
                    { text: '自動車', value: 'DRIVING' },
                    { text: '電車', value: 'TRANSIT' },
                  ]"
                  v-model="routeSetting.travelMode"
                />
              -->
            </div>

            <div
              :style="{
                display: 'flex',
                gap: '10px',
                flexDirection: 'column',
                padding: '15px'
              }"
            >
              <div>
                <va-input
                  outline
                  clearable
                  type="text"
                  label="出発地"
                  style="width:300px"
                  v-model="startPoint"
                />
              </div>

              <div
                v-for="(point, p) in points"
                :key="p"
                :style="{
                  display: 'flex',
                  gap: '7px',
                  alignItems: 'center',
                }"
              >
                <div>
                  <va-input
                    outline
                    clearable
                    type="text"
                    label="経由地"
                    style="width:300px"
                    v-model="points[p].place"
                  />
                </div>
                <div style="display:flex;gap:3px;align-items:end;">
                  <va-input
                    outline
                    clearable
                    min="0"
                    type="number"
                    label="滞在時間"
                    style="width:100px;"
                    v-model="points[p].standBy"
                    @change="points[p].standBy = $event.target.value || 0 "
                  />
                  <span>分</span>
                </div>
                <va-button
                  gradient
                  icon="add"
                  color="primary"
                  icon-color="#fff"
                  :disabled="points.length === 8"
                  @click="addPoint(p)"
                />
                <va-button
                  gradient
                  icon="remove"
                  color="danger"
                  icon-color="#fff"
                  :disabled="points.length === 1"
                  @click="removePoint(p)"
                />
              </div>

              <div>
                <va-input
                  outline
                  clearable
                  type="text"
                  label="到着地"
                  style="width:300px"
                  v-model="goalPoint"
                />
              </div>

              <div>
                <va-button
                  type="button"
                  @click="distanceMatrix"
                  :disabled="points.filter(v => !v.place).length || !startPoint || !goalPoint ? true : false"
                >取得</va-button>
              </div>
            </div>

            <div style="padding: 15px;">
              <va-card outlined>
                <va-card-content>
                  <div>距離： {{distance/1000}} km</div>
                  <div>時間： {{sec2time(dulation)}}</div>
                  <div>料金： {{outputPrice()}}</div>
                  <!-- <div>{{prices}}</div> -->

                  <va-tree-view
                    v-if="routeTree.length"
                    :nodes="routeTree"
                  >
                    <template #content="route">
                      <div style="margin-right: 0.5rem;">
                        <div class="display-6"><strong>{{ route.facility }}</strong></div>
                        <div>
                          <small
                            v-if="route.level === 0"
                            class="va-text-secondary mb-0"
                            style="font-size:14px;"
                            v-text="route.label"
                          ></small>
                          <p
                            v-else
                            class="mb-0"
                            v-text="route.label"
                          ></p>
                        </div>
                      </div>
                    </template>
                  </va-tree-view>
                </va-card-content>
              </va-card>
            </div>

          </div>

          <div style="width:50%">
            <div ref="mapElement"></div>
          </div>
        </va-card-content>
      </va-card>

      <!-- <va-card>
        <va-card-content>
          <div ref="routePanel"></div>
        </va-card-content>
      </va-card> -->
    </div>
  </div>

</template>

<style scoped>
</style>


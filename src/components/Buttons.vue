<template>
  <v-sheet
    class="d-flex justify-end mb-2"
    style="gap:10px;"
  >
    <v-btn
      class="d-print-none"
      color="error"
      rounded="pill"
      prepend-icon="mdi-autorenew"
      @click="reload"
    >再読込</v-btn>
    <v-spacer></v-spacer>
    <v-btn
      class="d-print-none"
      color="success"
      rounded="pill"
      prepend-icon="mdi-content-save"
      :disabled="disabledSave"
      @click="dialogSave = true"
    >保存</v-btn>
    <v-btn
      class="d-print-none"
      color="warning"
      rounded="pill"
      :disabled="disabledLoad"
      prepend-icon="mdi-content-save-edit"
      @click="dialogLoad = true"
    >読込</v-btn>
    <v-btn
      class="d-print-none"
      color="primary"
      rounded="pill"
      :disabled="disabledCreate"
      prepend-icon="mdi-download"
      @click=""
    >出力</v-btn>
  </v-sheet>

  <v-overlay
    v-model="loading"
    class="align-center justify-center"
  >
    <v-progress-circular
      indeterminate
      size="64"
      color="primary"
    ></v-progress-circular>
  </v-overlay>

  <v-dialog
    v-model="dialogLoad"
    max-width="450"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6 font-weight-bold bg-warning">
        データ選択
      </v-card-title>
      <v-card-text>
        <v-autocomplete
          label="データ"
          color="warning"
          density="compact"
          variant="outlined"
          :items="loadDocs"
          v-model="loadDocId"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="error"
          variant="text"
          @click="dialogLoad = false"
        >閉じる</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="warning"
          variant="elevated"
          :disabled="loadDocId ? false : true"
          @click="loadDoc(loadDocId)"
        >読み込み</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="dialogSave"
    max-width="450"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6 font-weight-bold bg-success">
        保存
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" v-if="loadDocId">
            <span>{{loadDocId}}</span>
          </v-col>
          <v-col cols="12">
            <v-text-field
              label="タイトル"
              color="success"
              density="compact"
              variant="outlined"
              placeholder="○○様 △△コース"
              messages="わかりやすい名前をつけてください"
              :disabled="loadDocId ? true : false"
              v-model="saveName"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="error"
          variant="text"
          @click="dialogSave = false"
        >閉じる</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="success"
          variant="elevated"
          :disabled="saveName ? false : true"
          @click="saveDoc(loadDocId)"
        >保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar
    :timeout="2000"
    color="success"
    elevation="24"
    v-model="loadSnackbar"
  >「{{saveName}}」のデータを取得しました。</v-snackbar>

  <v-snackbar
    :timeout="2000"
    color="success"
    elevation="24"
    v-model="saveSnackbar"
  >「{{saveName}}」を保存しました。</v-snackbar>
</template>

<script setup>
import dayjs from 'dayjs'
import { ref,watch } from 'vue';
import firestore from '../plugins/firebase-firestore'
import { doc, setDoc, getDoc, getDocs, collection, query } from 'firebase/firestore'

const loading       = ref(false)
const loadSnackbar  = ref(false)
const saveSnackbar  = ref(false)
const dialogSave    = ref(false)
const dialogLoad    = ref(false)
const saveName      = ref(null)
const loadDocId     = ref(null)
const loadDocs      = ref([])

watch(() => dialogLoad.value, async (aft) => {
  if (aft) await getDocuments()
})

const emit  = defineEmits(['load', 'save'])
const props = defineProps({
  disabledSave: Boolean,
  disabledLoad: Boolean,
  disabledCreate: Boolean,
  inputs: Object,
  values: Object,
})


/** *******************************************
 * 全ドキュメント取得
 ******************************************* */
const getDocuments = async () => {
  try {
    const docs = query(collection(firestore, 'routes'))
    const load = await getDocs(docs);
    loadDocs.value = load.docs.map(v => {
      const data = v.data()
      return { title: data.name, value: v.id }
    })
    console.log(loadDocs.value)
  } catch(e) {
    console.error(e)
  }
}


const reload = () => location.reload()

/** *******************************************
 * ドキュメント取得
 * @param {String|Number} docId - Document ID
 ******************************************* */
const loadDoc = async (docId) => {
  loading.value = true

  try {
    const docRef = doc(firestore, `routes/${docId}`);
    const docSnap = await getDoc(docRef)
    const data = docSnap.data()
    console.log(docSnap.data())
    if (docSnap.exists()) emit('load', data);
    loadSnackbar.value  = true
    dialogLoad.value    = false
    saveName.value      = data.name
  } catch(e) {
    console.error(e)
  }
  loading.value = false
}


/** *******************************************
 * ドキュメント保存
 * @param {String|Number} docId - Document ID
 ******************************************* */
const saveDoc = async (docId) => {
  try {
    if (docId) {
      await setDoc(doc(firestore, `routes/${docId}`), props.inputs, { merge: true })
    } else {
      docId = dayjs().unix()
      const inputs = JSON.parse(JSON.stringify(props.inputs))
      inputs.name = saveName.value
      await setDoc(doc(firestore, `routes/${docId}`), inputs)
    }
    console.log(loadDocId.value)
    saveSnackbar.value  = true
    dialogSave.value    = false
    loadDocId.value     = docId
  } catch(e) {
    console.error(e)
  }
}
</script>

<style lang="scss" scoped>
</style>
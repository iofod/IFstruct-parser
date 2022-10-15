<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition
        v-bind:name="transitionType"
        v-on:before-enter="beforeEnter"
        v-on:before-leave="beforeLeave"
        v-on:after-leave="afterLeave"
      >
        <component :is="Component" />
      </transition>
    </router-view>
    <Global hid="Global" :clone="''"></Global>
    <PreviewCursor></PreviewCursor>
  </div>
</template>

<script lang="ts">
import { $store } from './store'
import FN from './common/FN'
import Global from './view/Global.vue'
import PreviewCursor from './components/cursor.vue'
import { BehaviorSubject } from 'rxjs'
import HeroMixin from './lib/hero/hero.mixin'
import ActionMixin from './common/FA.mixin'

async function updatePage(pid, tree, sets) {
  if (!sets[pid]) {
    for (let hid in tree) {
      sets[hid] = tree[hid]
    }
  }
}

export default {
  name: 'app',
  mixins: [HeroMixin, ActionMixin],
  data() {
    return {
      toward: 'right',
      transitionName: 'slide-left',
    }
  },
  components: {
    Global, PreviewCursor
  },
  computed: {
    transitionType() {
      let type = this.historyNavState.transition

      switch (type) {
        case 'slide':
          type = type + '-' + this.toward
          break

        default:
          break
      }
      return type
    },
    historyNavState() {
      let futureList = this.history.future
      if (this.toward == 'left' && futureList.length > 0) {
        let future = futureList[futureList.length - 1]

        return future
      } else {
        return this.history.current
      }
    },
    $store() {
      return $store
    },
    app() {
      return this.$store.app
    },
    sets() {
      return this.$store.sets
    },
    pid() {
      return this.$store.app.currentPage
    },
    history() {
      return this.$store.history
    },
  },
  beforeCreate() {
    FN.PS.subscribe('updatePage', (msg, data) => {
      let { tree, pid } = data

      updatePage(pid, tree, this.SETS)
    })
  },
  methods: {
    beforeEnter(el) {
      el.style.transitionDuration = this.historyNavState.during + 'ms'
    },
    beforeLeave(el) {
      el.style.transitionDuration = this.historyNavState.during + 'ms'
    },
    afterLeave(el) {
      el.style.transitionDuration = ''
    },
    updateModelSubscription() {
      let newVal = this.$store.models

      Object.keys(newVal).forEach((id) => {
        if (newVal[id]) {
          let { id: pid } = newVal[id]

          if (!FN.FLOW_CACHE[pid]) {
            FN.FLOW_CACHE[pid] = new BehaviorSubject(undefined)
          }
        }
      })
    },
  },
  mounted() {
    this.history.current.target = this.pid

    this.updateModelSubscription()
    this.initActionListener()
    this.initHeroListener()
  },
}
</script>

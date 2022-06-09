<template>
  <v-app theme="light">
    <v-app-bar
      app
      dark
      density="prominent"
      elevation="0"
      clipped-left
      color="primary"
      class="rounded-be-xl"
      :class="{ 'rounded-bs-xl': !showDrawer }"
    >
      <template v-slot:prepend>
        <v-app-bar-nav-icon
          @click.stop="showDrawer = !showDrawer"
        />
      </template>
      <v-app-bar-title>
        <v-img
          src="/logo/name-no-background-white.png"
          max-height="80"
          class="my-3"
        />
      </v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-model="showDrawer"
      app
      clipped
      dark
      temporary
      color="primary"
      floating
    />

    <v-main>
      <v-container>
        <slot />
      </v-container>
    </v-main>
    <v-footer
      app
      dark
      absolute
      color="primary"
      class="rounded-t-xl"
    >
      <v-col
        class="text-center"
        cols="12"
      >
        {{ new Date().getFullYear() }} — <strong>AlvaSori</strong>
      </v-col>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'DefaultLayout',
  data: () => ({
    showDrawer: false,
    temporaryDrawer: true
  }),
  mounted () {
    setTimeout(() => {
      this.temporaryDrawer = false
    }, 500)
  }
}
</script>
<template>
  <v-app theme="light">
    <v-app-bar
      app
      dark
      density="prominent"
      elevation="0"
      clipped-left
      color="primary"
      class="rounded-be-lg"
      :class="{ 'rounded-bs-lg': !showDrawer }"
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
    >
      <v-list-item
        prepend-avatar="/logo/icon-no-background-white.png"
        title="AlvaSori"
        value="/"
      />
      <v-divider />
      <v-list bg-color="primary" theme="dark">
        <v-list-item prepend-icon="mdi-cart" title="E-Commerce Solutions" value="ecommerce" />
        <v-list-item prepend-icon="mdi-cash-multiple" title="Financial Coaching" value="coaching" />
        <v-list-item prepend-icon="mdi-account-group" title="About Us" value="about-us" />
      </v-list>
    </v-navigation-drawer>

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
      class="rounded-t-lg"
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
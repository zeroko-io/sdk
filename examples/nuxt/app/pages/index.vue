<script setup lang="ts">
const { data } = await useFetch("/api/visits", { method: "POST" })
</script>

<template>
  <h1>Nuxt on Zeroko: visit number {{ data?.visits }}</h1>
</template>

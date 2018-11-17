<template>
  <audio controls="controls" :src="payload.url" v-once></audio>
</template>
<script>
'use strict';

export default {
    name: 'recime-received-message-audio',
    props: {
      payload: {
        type: Object
      },
    }
}
</script>

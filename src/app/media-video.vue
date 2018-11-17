<template>
  <video controls="controls" :src="payload.url" v-once></video>
</template>
<script>
'use strict';

export default {
    name: 'recime-received-message-video',
    props: {
      payload: {
        type: Object
      },
    }
}
</script>

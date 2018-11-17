<template>
  <div class="recime-sent-message-container">
    <div class="recime-sent-message" v-html="conversation.content.text" v-linkified v-once></div>
    <div class="recime-sent-message-status" v-if="conversation.showStatus">
      <span v-if="conversation.status === MessageStatus.Failed" class="recime-text-error">Failed</span>
      <div class="recime-sent-message-time" v-if="conversation.status === MessageStatus.Sent" v-once>
        {{ conversation.createdAt | moment('calendar') }}
      </div>
    </div>
  </div>
</template>

<script>
  'use strict';

  import { MessageType, MessageStatus } from './enums';

  export default {
    name: 'recime-sent-message-container',
    data() {
      return {
        MessageStatus
      }
    },
    props: {
      conversation: {
        type: Object,
        default() {
          return {
            type: MessageType.OutgoingMessage,
            status: MessageStatus.Sending,
            showStatus: true
          }
        }
      }
    }
  }
</script>

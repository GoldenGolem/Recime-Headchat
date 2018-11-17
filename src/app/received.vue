<template>
  <div class="recime-received-message-container">
    <div class="recime-received-message-details">
      <div class="recime-received-avatar"><img :src="bot.icon" v-once></div>
      <div class="recime-received-message-block">
            <div v-if="['text', 'image', 'audio', 'video'].indexOf(conversationType) > -1" class="recime-received-message-quick-reply">
            <div v-if="conversationType === 'text'" class="recime-received-message" v-html="conversation.content.text" v-linkified v-once></div>
            <div v-else-if="conversationType === 'image'" class="recime-received-message-image">
              <img :src="conversation.content.attachment.payload.url" @load="onImageLoaded" v-once>
            </div>
            <div v-else-if="conversationType === 'audio'" class="recime-received-message-audio">
              <MediaAudio :payload="conversation.content.attachment.payload"></MediaAudio>
            </div>
            <div v-else-if="conversationType === 'video'" class="recime-received-message-video">
              <MediaVideo :payload="conversation.content.attachment.payload"></MediaVideo>
            </div>
            <ul v-if="conversation.content.quick_replies && conversation.content.quick_replies.length">
              <li v-for="reply in conversation.content.quick_replies" :key="reply.id">
                <button type="button" @click="post(reply)" v-once>{{ reply.title }}</button>
              </li>
            </ul>
          </div>
          <div v-else-if="conversationType === 'button-template'" class="recime-received-message-button-template">
            <p v-html="conversation.content.attachment.payload.text" v-linkified></p>
            <ul v-if="conversation.content.attachment.payload.buttons">
              <li v-for="button in conversation.content.attachment.payload.buttons" :key="button.id">
                <button v-if="button.type === 'postback'" type="button" @click="post(button)" v-once>{{ button.title }}</button>
                <a target="_blank" rel="noopener" v-if="button.type === 'web_url'" :href="button.url" v-once>{{ button.title }}</a>
              </li>
            </ul>
          </div>
          <div v-else-if="['generic-template', 'card-template'].indexOf(conversationType) > -1" class="recime-received-message-generic-template">
            <GenericTemplate :service="service" :elements="conversation.content.attachment.payload.elements" @imageLoaded="onImageLoaded" @botRespond="onBotRespond"></GenericTemplate>
          </div>
          <div class="recime-received-message-time" v-once>{{ conversation.receivedAt | moment('calendar') }}</div>      
        </div> 
      </div>
  </div>
</template>

<script>
  'use strict';

  import { MessageType, MessageStatus } from './enums';
  import MediaAudio from './media-audio.vue';
  import MediaVideo from './media-video.vue';
  import GenericTemplate from './generic-template.vue';

  export default {
    name: 'recime-received-message-container',
    components: { MediaAudio, MediaVideo, GenericTemplate },
    props: {
      service: {
        type: Object
      },
      conversation: {
        type: Object,
        default() {
          return {
            content: {
              type: Object
            },
            type: {
              type: Number,
              default() {
                return MessageType.IncomingMessage;
              }
            },
            status: {
              type: Number,
              default() {
                return MessageStatus.Sending;
              }
            },
            showStatus: {
              type: Boolean,
              default() {
                return true;
              }
            },
            receivedAt: Number
          }
        }
      },
      bot: {
        type: Object,
        default() {
          return {
            id: String,
            region: String,
            icon: String
          };
        }
      }
    },
    computed: {
      conversationType() {
        const conversation = this.conversation;

        if (conversation.content.attachment){
          if (conversation.content.attachment.payload) {
            if (conversation.content.attachment.type === 'template') {
              const type = conversation.content.attachment.payload.template_type;

              if (type === 'button') {
                return 'button-template';
              }

              if (type === 'generic') {
                return 'generic-template';
              }
            } else if (conversation.content.attachment.type === 'image') {
              return 'image';
            } else if (conversation.content.attachment.type === 'audio') {
              return 'audio';
            } else if (conversation.content.attachment.type === 'video') {
              return 'video';
            }
          }
        }

        return 'text';
      }
    },
    methods: {
      post(target) {
        this.onBotRespond(false);
        return this.service.post(
          target.title, {
            postback: {
              payload: target.payload
            },
            event: {
              name: target.payload
            }
          })
          .then(() => this.onBotRespond(true))
          .catch(() => this.onBotRespond(true));
      },

      reply(target) {
        this.onBotRespond(false);
        return this.service.reply(target.title, target.payload)
          .then(() => this.onBotRespond(true))
          .catch(() => this.onBotRespond(true));
      },

      onImageLoaded() {
        this.$emit('imageLoaded');
      },

      onBotRespond(done) {
        this.$emit('botRespond', done);
      }
    }
  }
</script>

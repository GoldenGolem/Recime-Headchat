<template>
  <div class="recime-application-container">
    <div class="recime-conversation-header">
      <h1 v-once>
         <h3 v-once>{{ bot.title }}</h3>
         <div class="recime-title-buttons">
            <button type="button" id="recime-messenger-reload-btn" @click="reload">
                <i class="fa fa-refresh fa-2x"></i>
            </button>
             <button type="button" id="recime-messenger-close-btn" @click="close">
                <i class="fa fa-times fa-2x"></i>
           </button>
         </div>
      </h1>
    </div>

    <div class="recime-conversation-body">
      <div class="recime-conversation-body-wrapper">
        <div v-for="conversation in conversations" :key="conversation.id">
          <Sent v-if="conversation.type === MessageType.OutgoingMessage" :conversation="conversation"></Sent>
          <Received v-if="conversation.type === MessageType.IncomingMessage" :conversation="conversation" :bot="bot" :service="service" @imageLoaded="onImageLoaded" @botRespond="onBotRespond"></Received>
        </div>
        <div v-if="botRespondig">
          <div class="recime-received-message-container">
            <div class="recime-received-message-details">
              <div class="recime-received-avatar"><img :src="bot.icon" v-once></div>
              <div>
                <div class="recime-typing-indicator-container">
                  <div class="recime-typing-indicator pull-right">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="recime-conversation-footer">
      <div>
        <div class="recime-composer">
          <input id="composer" placeholder="Enter your message" @keyup.enter="sendMessage" v-model.trim="draft"/>
          <button type="button" @click="sendMessage">
                <i class="fa fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  'use strict';

  import { MessageType, MessageStatus } from './enums';
  import { Service } from './service';

  import Sent from './sent.vue';
  import Received from './received.vue';

  const config = getConfig();
  const icon = `https://icons.recime.io/${config.id}.png`;

  if (config.primaryColor) {
      const $doc = document;
      const $messengerStyle = $doc.createElement('style');
      
      $messengerStyle.setAttribute('id', 'recime-messenger-frame-styles');
      $messengerStyle.setAttribute('type', 'text/css');

      let styles =
        '.recime-conversation-header h1 {border-bottom: 2px solid ' +
        config.primaryColor +
        '!important;} .recime-sent-message{background-color:' +
        config.primaryColor +
        '!important;} .recime-received-message-quick-reply button { color: ' +
        config.primaryColor +
        '!important;} .recime-sent-message { background-color:' +
        config.primaryColor + 
        '!important;} .recime-received-message-generic-template button { color: ' +
        config.primaryColor +
        '!important;} .recime-received-message-generic-template a { color: ' +
        config.primaryColor+
        '!important;}';
 
      $messengerStyle.appendChild(
        $doc.createTextNode(styles)
      );

      $doc
        .getElementsByTagName('head')[0]
        .appendChild($messengerStyle);

  }

  const service = Service.create(config);

  function getConfig() {
    const decode = (() => {
      if (typeof(atob) === 'function') {
        return value => atob(decodeURIComponent(value));
      }

      return value => decodeURIComponent(value);
    })();

    const queryString = window.location.search;

    if (!queryString.length) {
      return void 0;
    }

    const result = {};

    queryString.substring(1)
      .split('&')
      .forEach(pair => {
        const [key, value] = pair.split('=');
        const plain = decode(value);

        if (!plain || plain === 'undefined') {
          return;
        }

        result[key] = plain;
      });

    result.meta = JSON.parse(result.meta || '{}');

    return result;
  }

  export default {
    name: 'recime-application-container',
    components: { Sent, Received },
    computed: {
      service() {
        return service;
      },
      isConsole() {
        return config.mode === 'console';
      },
      isPublic() {
        return config.mode !== 'console' &&  config.mode !== 'dev';
      },
      bot() {
        return {
          id: config.id,
          region: config.region,
          title: config.title,
          description: config.description,
          icon
        };
      },
      MessageType() {
        return MessageType;
      },
      MessageStatus() {
        return MessageStatus;
      }
    },
    data () {
      return {
        conversations: service.get(),
        draft: '',
        botRespondig: false
      }
    },
    methods: {
      close() {
        window.parent.postMessage('messenger.closed', "*");
      },

      reload() {
        this.service.reload();
        this.conversations = this.service.get();

        this.onBotRespond(false);
        this.service.start()
          .then(() => this.onBotRespond(true))
          .catch(() => this.onBotRespond(true));
      },

      sendMessage() {
        if (!this.draft) {
          return;
        }

        this.onBotRespond(false);
        this.service.send(this.draft)
          .then(() => this.onBotRespond(true))
          .catch(() => this.onBotRespond(true));

        this.draft = '';
      },

      scrollToBottom() {
        this.$el.querySelector('.recime-conversation-body').scrollTop =
          this.$el.querySelector('.recime-conversation-body-wrapper').scrollHeight;
      },

      onImageLoaded() {
        this.scrollToBottom();
      },

      onBotRespond(done) {
        this.botRespondig = !done;
      }
    },
    watch: {
      conversations() {
        this.$nextTick(() => {
          const lastItem = this.conversations[this.conversations.length - 1];
          this.conversations.forEach(item => {
            if (lastItem.type === MessageType.IncomingMessage ||
              (item.status === MessageStatus.Sent &&
                Date.now() - item.createdAt > 5000 )) {
              item.showStatus = false;
            }
          });
          this.scrollToBottom();

          if (lastItem.type === MessageType.IncomingMessage) {
            this.onBotRespond(true);
          }
        });
      }
    },
    mounted() {
      if (this.conversations.length) {
        this.onBotRespond(true);
        this.scrollToBottom();
      }
      else {
        this.onBotRespond(false);
        this.service.start().then(() => {
          this.onBotRespond(true);
        });
      }
    }
  }
</script>

/* eslint no-console: ['error', { allow: ['error'] }] */

'use strict';

import axios from 'axios';
import uuid from 'uuid/v1';

import { MessageType, MessageStatus } from './enums';

const generateId = () =>
  uuid()
    .replace(/-/g, '')
    .toLowerCase();

function create(config) {
  const storageKey = `recime-${config.id}`;

  const endpoint = (() => {
    if (config.mode === 'dev') {
      if (!config.endpoint) {
        throw new Error('No endpoint has been set for development mode!!!');
      }
      return config.endpoint;
    }

    return config.region === 'us-west-2'
      ? `https://bot.recime.io/${config.id}/v1`
      : `https://${config.region}-bot.recime.io/${config.id}/v1`;
  })();

  const sessionId = (() => {
    if (config.mode !== 'live') {
      return 'developer';
    }

    const sessionKey = `recime-session-${config.id}`;

    try {
      const localId = localStorage.getItem(sessionKey);

      if (localId) {
        return localId;
      }
    } catch (e) {
      console.error('Error loading session id from local storage!', e);
    }

    const id = generateId();
    try {
      localStorage.setItem(sessionKey, id);
    } catch (e) {
      console.error('Error persisting session id from local storage!', e);
    }

    return id;
  })();

  const storage = (() => {
    if (config.mode !== 'live') {
      return [];
    }

    try {
      const payload = localStorage.getItem(storageKey);

      if (payload) {
        return JSON.parse(payload);
      }
    } catch (e) {
      console.error('Error loading conversations from local storage!', e);
    }

    return [];
  })();

  function start() {
    return axios
      .post(endpoint, {
        event: { name: 'start' },
        sender: sessionId,
        meta: config.meta
      })
      .then(response => {
        loadResponse(response);
        persist();
      })
      .catch(error => {
        console.error('Error starting: ', error);
      });
  }

  function get() {
    return storage;
  }

  function send(message) {
    const conversation = {
      id: generateId(),
      content: {
        text: message
      },
      type: MessageType.OutgoingMessage,
      createdAt: Date.now(),
      status: MessageStatus.Sending,
      showStatus: true
    };

    storage.push(conversation);
    persist();

    return axios
      .post(endpoint, { text: message, sender: sessionId, meta: config.meta })
      .then(response => {
        conversation.status = MessageStatus.Sent;
        conversation.deliveredAt = Date.now();
        loadResponse(response);
        persist();
      })
      .catch(error => {
        conversation.status = MessageStatus.Failed;
        persist();
        console.error('Error sending: ', error);
      });
  }

  function post(title, payload) {
    const conversation = {
      id: generateId(),
      content: {
        text: title
      },
      type: MessageType.OutgoingMessage,
      createdAt: Date.now(),
      status: MessageStatus.Sending,
      showStatus: true
    };

    storage.push(conversation);
    persist();

    payload.sender = sessionId;
    payload.meta = config.meta;

    return axios
      .post(endpoint, payload)
      .then(response => {
        conversation.status = MessageStatus.Sent;
        conversation.deliveredAt = Date.now();
        loadResponse(response);
        persist();
      })
      .catch(error => {
        conversation.status = MessageStatus.Failed;
        persist();
        console.error('Error posting: ', error);
      });
  }

  function reply(title, payload) {
    const conversation = {
      id: generateId(),
      content: {
        text: title
      },
      type: MessageType.OutgoingMessage,
      createdAt: Date.now(),
      status: MessageStatus.Sending,
      showStatus: true
    };

    storage.push(conversation);
    persist();

    return axios
      .post(endpoint, { text: payload, sender: sessionId, meta: config.meta })
      .then(response => {
        conversation.status = MessageStatus.Sent;
        conversation.deliveredAt = Date.now();
        loadResponse(response);
        persist();
      })
      .catch(error => {
        conversation.status = MessageStatus.Failed;
        persist();
        console.error('Error replying: ', error);
      });
  }

  function reload() {
    storage.length = 0;
    persist();
  }

  function loadResponse(response) {
    const replies = (Array.isArray(response.data)
      ? response.data
      : [response.data]
    ).map(item => {
      return {
        id: generateId(),
        content: item,
        type: MessageType.IncomingMessage,
        createdAt: Date.now(),
        status: MessageStatus.Received,
        showStatus: false
      };
    });

    storage.push(...replies);
  }

  function persist() {
    if (config.mode !== 'live') {
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(storage));
    } catch (e) {
      console.error('Error persisting conversations to local storage!', e);
    }
  }

  return {
    start,
    get,
    send,
    post,
    reply,
    reload
  };
}

export const Service = {
  create
};

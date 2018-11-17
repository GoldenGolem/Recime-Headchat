'use strict';

import Vue from 'vue';
import VueMoment from 'vue-moment';




import App from './app/app.vue';
import linkify from './app/linkify.directive';

import './index.css';
import './index.html';

Vue.use(VueMoment);

Vue.directive('linkified', linkify);

new Vue({
  el: '#recime-headchat',
  render: h => h(App)
});

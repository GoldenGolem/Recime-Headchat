'use strict';

import './launcher.css';
import './launcher.html';
import './test.html';

(($win, $doc) => {
  const addHandler = (() => {
    if (typeof $win.attachEvent === 'function') {
      return ($target, event, handler) =>
        $target.attachEvent(`on${event}`, handler);
    }
    return ($target, event, handler) =>
      $target.addEventListener(event, handler, false);
  })();

  let $launcher;

  function notifyParent(message) {
    $win.parent.postMessage(`launcher.${message}`, '*');
    return false;
  }

  function receiveMessage(event) {
    if (!event.data) {
      return;
    }

    const [namespace, action] = event.data.toString().split('.');

    if (namespace && action && namespace === 'shim' && action === 'closed') {
      updateState();
    }
  }

  function updateState() {
    if ($launcher.className.match(/(?:^|\s)active-chat(?!\S)/)) {
      notifyParent('closed');
      $launcher.className = $launcher.className.replace(
        /(?:^|\s)active-chat(?!\S)/g,
        ''
      );
    } else {
      notifyParent('opened');
      $launcher.className += ' active-chat';
    }
  }

  function getConfig() {
    const decode = (() => {
      if (typeof atob === 'function') {
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

  (() => {
    const config = getConfig();

    if (config && config.mode === 'console') {
      $doc.querySelector('.recime-launcher-open').className += ' console';
      $doc.querySelector('.recime-launcher-close').className += ' console';
      $doc.querySelector('.recime-launcher-open > span').style.display =
        'inline-block';
    }

    if (config.primaryColor) {
      const $launcherStyle = $doc.createElement('style');
      $launcherStyle.setAttribute('id', 'recime-launcher-frame-styles');
      $launcherStyle.setAttribute('type', 'text/css');

      const styles =
        '.recime-launcher-open{background-color:' +
        config.primaryColor +
        '!important;} .recime-launcher-close{background-color:' +
        config.primaryColor +
        '!important;}';

      $launcherStyle.appendChild($doc.createTextNode(styles));

      $doc.getElementsByTagName('head')[0].appendChild($launcherStyle);
    }

    $launcher = $doc.getElementById('recime-launcher');

    addHandler($launcher, 'click', updateState);
    addHandler($win, 'message', receiveMessage);
  })();
})(window, document);

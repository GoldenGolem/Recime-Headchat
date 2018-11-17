/* eslint no-console: ['error', { allow: ['error'] }] */

'use strict';

(($win, $doc) => {
  const production = process.env.NODE_ENV === 'production';

  const settings = {
    template:
      '<div id="recime-chatbot"> \
         <div id="recime-messenger-root" class="recime-messenger-align-{{position}}">\
            <iframe src="index.html" allowfullscreen class="recime-messenger-frame" scrolling="no"></iframe>\
         </div> \
        <iframe src="launcher.html" allowfullscreen class="recime-launcher-frame" scrolling="no"></iframe> \
      </div>',
    messengerPath: 'index.html',
    launcherPath: 'launcher.html',
    serverBaseUrl: 'https://headchat.recime.io/',
    localBaseUrl: '',
    rootStyle:
      ' @media only screen and (max-device-width: 667px) {#recime-chatbot #recime-messenger-root{top:0;right:0;bottom:0;left:0;height:100%;width:100%;z-index:99999;max-height:inherit;box-shadow:none;border-radius:inherit;}} ' +
      ' .recime-chatbot{position:fixed;right:0;bottom:0;z-index:999;} ' +
      ' #recime-messenger-root{display:none;z-index:1000;position:fixed;height:calc(100% - 120px);width:370px;min-height:250px;max-height:590px;box-shadow:0 5px 40px rgba(0,0,0,.16);overflow:hidden;border:0;}' +
      ' .recime-messenger-align-center{top:50%;left:50%;transform:translate(-50%,-50%);}' +
      ' .recime-messenger-frame{width:100%;height:100%;border:0;}',
    otherStyle:
      ' .recime-launcher-frame{z-index:999;position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;transition:box-shadow 80ms ease-in-out;box-shadow:0 1px 6px rgba(0,0,0,.06),0 2px 32px rgba(0,0,0,.16);border:0;}' +
      ' .recime-messenger-align-bottom-right{bottom:90px;right:20px;}',
    consoleStyle:
      ' .recime-launcher-frame{z-index:999;position:fixed;bottom:30px;right:40px;width:180px;height:45px;border-radius:25px;transition:box-shadow 80ms ease-in-out;box-shadow:0 1px 6px rgba(0,0,0,.06),0 2px 32px rgba(0,0,0,.16);border:0;}' +
      ' .recime-messenger-align-bottom-right{bottom:30px;right:40px;}'
  };

  const encode = (() => {
    if (typeof btoa === 'function') {
      return value => encodeURIComponent(btoa(value));
    }
    return value => encodeURIComponent(value);
  })();

  const addHandler = (() => {
    if (typeof $win.attachEvent === 'function') {
      return ($target, event, handler) =>
        $target.attachEvent(`on${event}`, handler);
    }
    return ($target, event, handler) =>
      $target.addEventListener(event, handler, false);
  })();

  let $messenger, $launcher, $root;

  function createElement(html) {
    const $e = $doc.createElement('div');
    $e.innerHTML = html;
    return $e.firstChild;
  }

  function updateState(state) {
    if (state === 'closed') {
      $root.style.display = 'none';
    } else if (state === 'opened') {
      $root.style.display = 'block';
    }
  }

  function receiveMessage(event) {
    if (production) {
      if (!event.origin || settings.serverBaseUrl.indexOf(event.origin) !== 0) {
        return;
      }
    }

    const [namespace, action] = event.data.toString().split('.');

    if (!namespace || !action) {
      return;
    }

    if (namespace === 'launcher') {
      $messenger && $messenger.postMessage(`shim.${action}`, '*');
    } else if (namespace === 'messenger') {
      $launcher && $launcher.postMessage(`shim.${action}`, '*');
      return;
    }

    updateState(action);
  }

  function getConfig() {
    const key = 'recime-bot';
    let payload;

    try {
      payload = $win.sessionStorage.getItem(key);
    } catch (e) {
      // ignore
    }

    if (!payload) {
      payload = $win[key];
    }

    if (!payload) {
      return void 0;
    }

    let config;

    try {
      config = JSON.parse(payload);
    } catch (e) {
      console.error('Error parsing bot config.');
      return void 0;
    }

    if (config.meta) {
      config.meta = JSON.stringify(config.meta);
    }

    return config;
  }

  (() => {
    const config = getConfig();

    if (!config) {
      console.error('Could not find Recime HeadChat configuration!!!');
      return;
    }

    if (!config.mode) {
      config.mode = 'live';
    }

    if (!config.meta) {
      config.meta = {};
    }

    addHandler($win, 'message', receiveMessage);

    const messengerUrl =
      (production ? settings.serverBaseUrl : settings.localBaseUrl) +
      settings.messengerPath +
      '?' +
      Object.keys(config)
        .map(key => `${key}=${encode(config[key])}`)
        .join('&');

    let launcherUrl =
      (production ? settings.serverBaseUrl : settings.localBaseUrl) +
      settings.launcherPath +
      '?mode=' +
      encode(config.mode);

    if (config.primaryColor){
      launcherUrl += '&primaryColor=' + encode(config.primaryColor);
    }

    const position = (() => {
      switch (config.mode) {
        case 'live':
        case 'console': {
          return 'bottom-right';
        }
        case 'dev': {
          return 'center';
        }
        default: {
          throw new Error(`Unknown mode: "${config.mode}"!`);
        }
      }
    })();

    const app = settings.template
      .replace(settings.messengerPath, messengerUrl)
      .replace(settings.launcherPath, launcherUrl)
      .replace('{{position}}', position);

    const $style = $doc.createElement('style');
    $style.setAttribute('id', 'recime-chatbot-styles');
    $style.setAttribute('type', 'text/css');
    $style.appendChild(
      $doc.createTextNode(
        settings.rootStyle +
          (config.mode === 'console'
            ? settings.consoleStyle
            : settings.otherStyle)
      )
    );

    $doc.getElementsByTagName('head')[0].appendChild($style);
    $doc.getElementsByTagName('body')[0].appendChild(createElement(app));

    $messenger = $doc.querySelector('iframe.recime-messenger-frame')
      .contentWindow;

    $launcher = (() => {
      const l = $doc.querySelector('iframe.recime-launcher-frame');
      if (config.mode === 'dev') {
        l.style.display = 'none';
      }
      return l.contentWindow;
    })();

    $root = $doc.getElementById('recime-messenger-root');

    if (config.mode === 'dev') {
      updateState('opened');
    }
  })();
})(window, document);

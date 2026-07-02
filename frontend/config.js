(function () {
    'use strict';

    var BACKEND_URL = '';

    if (window.__ENV && window.__ENV.BACKEND_URL) {
        BACKEND_URL = window.__ENV.BACKEND_URL;
    }

    BACKEND_URL = BACKEND_URL.replace(/\/+$/, '');

    var WS_URL = '';
    if (BACKEND_URL) {
        var wsProtocol = BACKEND_URL.indexOf('https') === 0 ? 'wss:' : 'ws:';
        var host = BACKEND_URL.replace(/^https?:\/\//, '');
        WS_URL = wsProtocol + '//' + host;
    } else {
        var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        WS_URL = protocol + '//' + window.location.host;
    }

    window.APP_CONFIG = {
        BACKEND_URL: BACKEND_URL,
        WS_URL: WS_URL
    };
})();

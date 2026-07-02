(function () {
    'use strict';

    var BACKEND_URL = 'https://impartial-surprise-production-2aa0.up.railway.app';

    BACKEND_URL = BACKEND_URL.replace(/\/+$/, '');

    var WS_URL = 'wss://impartial-surprise-production-2aa0.up.railway.app';

    window.APP_CONFIG = {
        BACKEND_URL: BACKEND_URL,
        WS_URL: WS_URL
    };
})();

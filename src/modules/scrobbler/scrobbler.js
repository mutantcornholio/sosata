import config from '../../config.js'
import md5 from 'md5'
import querystring from 'querystring';

export const LOCAL_STORAGE_KEYS = {
    scrobblerSessionKey: 'scrobblerSessionKey'
};

export class Scrobbler {
    isConnected = false;
    _sessionKey;

    constructor() {
        this._sessionKey = localStorage.getItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey);

        if (this._sessionKey) {
            this.isConnected = true;
        }
    }

    connect(token) {

    }

    static _buildSignedRequest(params) {
        const sortedKeys = Object.keys(params).sort();

        let paramsString = '';

        for (const key of sortedKeys) {
            paramsString += key + params[key];
        }

        paramsString += config.lastfm.secret;

        const hash = md5(paramsString);

        return querystring.stringify(Object.assign({api_sig: hash}, params));
    }
}

export default Scrobbler;

import config from '../../config.js'
import md5 from 'md5'
import querystring from 'querystring';
import $ from 'jquery';

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
        $.ajax(`http://ws.audioscrobbler.com/2.0/?${Scrobbler._buildSignedRequest({
            method: 'auth.getSession',
            token,
            api_key: config.lastfm.apiKey
        })}`).done(result => {
            localStorage.setItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey, result.session.key);

            this.isConnected = true;
        });
    }

    static _buildSignedRequest(params) {
        const sortedKeys = Object.keys(params).sort();

        let paramsString = '';

        for (const key of sortedKeys) {
            paramsString += key + params[key];
        }

        paramsString += config.lastfm.secret;

        const hash = md5(paramsString);

        return querystring.stringify(Object.assign({
            api_sig: hash,
            format: 'json'
        }, params));
    }
}

export default Scrobbler;

import config from '../../config.js'
import md5 from 'md5'
import querystring from 'querystring';
import $ from 'jquery';

export const LOCAL_STORAGE_KEYS = {
    scrobblerSessionKey: 'scrobblerSessionKey',
    scrobblingQueue: 'scrobblingQueue',
};

export class Scrobbler {
    isConnected = false;
    _sessionKey;
    _scrobblingQueue = [];

    constructor() {
        this._sessionKey = localStorage.getItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey);

        let oldQueue = localStorage.getItem(LOCAL_STORAGE_KEYS.scrobblingQueue);

        if (oldQueue) {
            try {
                this._scrobblingQueue = JSON.parse(oldQueue);
            } catch (_) {
                localStorage.removeItem(LOCAL_STORAGE_KEYS.scrobblingQueue);
            }
        }

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
            this._sessionKey = result.session.key;
            localStorage.setItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey, this._sessionKey);

            this.isConnected = true;
        });
    }

    scrobble(track, timestamp) {
        this._scrobblingQueue.push(Object.assign({__timestamp: timestamp}, track));

        localStorage.setItem(LOCAL_STORAGE_KEYS.scrobblingQueue, JSON.stringify(this._scrobblingQueue));

        this._scrobble();
    }

    _scrobble() {
        if (this._scrobblingQueue.length > 0) {
            $.ajax(`http://ws.audioscrobbler.com/2.0/?method=track.scrobble`, {
                method: 'POST',
                data: Scrobbler._buildSignedRequest({
                    method: 'track.scrobble',
                    api_key: config.lastfm.apiKey,
                    sk: this._sessionKey
                })
            });
        }
    }

    static _buildSignedRequest(params) {
        const sortedKeys = Object.keys(params).sort();

        let paramsString = '';

        for (const key of sortedKeys) {
            paramsString += key + params[key];
        }

        paramsString += config.lastfm.secret;

        const hash = md5(paramsString);

        const resultParams = Object.assign({
            api_sig: hash,
            format: 'json'
        }, params);

        return Object.keys(resultParams)
            .sort()
            .reduce(
                (acc, key) =>
                    `${acc}${(acc.length > 0) ? '&' : ''}${key}=${encodeURIComponent(resultParams[key])}`
                , '')
    }
}

export default Scrobbler;

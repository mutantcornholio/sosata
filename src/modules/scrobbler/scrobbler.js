import config from '../../config.js'
import md5 from 'md5'

export const LOCAL_STORAGE_KEYS = {
    scrobblerSessionKey: 'scrobblerSessionKey',
    scrobblingQueue: 'scrobblingQueue',
};

export const LAST_FM_API_PATH = 'http://ws.audioscrobbler.com/2.0';

const SCROBBLE_RETRY_TIMEOUT = 60;

export class Scrobbler {
    isConnected = false;
    _sessionKey;
    _scrobblingQueue = [];
    _stagingScrobblingQueue = [];

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
        return new Promise((resolve, reject) => {
            fetch(`${LAST_FM_API_PATH}/?${Scrobbler._buildSignedRequest({
                method: 'auth.getSession',
                token,
                api_key: config.lastfm.apiKey
            })}`)
                .then(result => result.json())
                .then(result => {
                    this._sessionKey = result.session.key;
                    localStorage.setItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey, this._sessionKey);

                    this.isConnected = true;
                    resolve();
                }).catch(reject);
        });
    }

    scrobble(track, timestamp) {
        this._scrobblingQueue.push(Object.assign({__timestamp: timestamp}, track));

        this._updateScrobblingQueue();

        this._scrobble();
    }

    _updateScrobblingQueue() {
        localStorage.setItem(LOCAL_STORAGE_KEYS.scrobblingQueue, JSON.stringify(this._scrobblingQueue));
    }

    _scrobble() {
        if (this._scrobblingQueue.length > 0 ) {
            if (this._stagingScrobblingQueue.length !== 0) {
                return;
            }

            this._stagingScrobblingQueue = this._scrobblingQueue.splice(0, 50);

            const scrobblingItems = {};

            for (const [index, track] of this._stagingScrobblingQueue.entries()) {
                scrobblingItems[`artist[${index}]`] = track.artist;
                scrobblingItems[`track[${index}]`] = track.title;
                scrobblingItems[`timestamp[${index}]`] = track.__timestamp;
                track.album && (scrobblingItems[`album[${index}]`] = track.album);
                track.duration && (scrobblingItems[`duration[${index}]`] = track.duration);
            }

            fetch(`http://ws.audioscrobbler.com/2.0/?method=track.scrobble`, {
                method: 'POST',
                body: Scrobbler._buildSignedRequest(Object.assign(scrobblingItems, {
                    method: 'track.scrobble',
                    api_key: config.lastfm.apiKey,
                    sk: this._sessionKey
                }))
            })
                .then((response) => {
                    if (!response.ok) {
                        this._scrobblingQueue = this._stagingScrobblingQueue.concat(this._scrobblingQueue);
                        this._stagingScrobblingQueue = [];
                        setTimeout(() => {this._scrobble()}, SCROBBLE_RETRY_TIMEOUT * 1000);
                    }

                    this._updateScrobblingQueue();
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

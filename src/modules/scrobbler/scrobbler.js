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
}

export default Scrobbler;
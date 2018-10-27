import PubSub from 'pubsub-js';
import config from '../../config.js'
import * as Exceptions from './exceptions.js';
import $ from 'jquery';
import Scrobbler from '../scrobbler/scrobbler';
import {LOCAL_STORAGE_KEYS} from "../localStorageKeys";

export let player = {};

export const events = {
    PLAYLIST_CHANGED: 'PLAYLIST_CHANGED',
    PLAYBACK_CHANGED: 'PLAYBACK_CHANGED',
    PLAYBACK_POSITION_CHANGED: 'PLAYBACK_POSITION_CHANGED'
};

export class Player {
    _currentTrackId = -1;
    _audioElement;
    _isPlaying = false;
    _playlist = [];
    _addQueue = [];
    _secondsTrackListened = 0; // Not affected by seeking. Needed for scrobbling
    _currentTrackScrobbled = false;

    scrobbler;

    // custom audioElement is passed in tests
    constructor(audioElement) {
        this._audioElement = audioElement || document.createElement('AUDIO');
        this._audioElement.addEventListener('ended', this._handleTrackEnd.bind(this));
        this.scrobbler = new Scrobbler();

        this._loadFromLS();
        PubSub.subscribe(events.PLAYLIST_CHANGED, this._handlePlaylistChange);

        setInterval(this._playtick, 1000);
    }

    _changeTrack(trackNo) {
        this._currentTrackId = trackNo;
        this._audioElement.src = `http://${config.host}/music/${this._playlist[trackNo].url}`;
        this._audioElement.load();

        this._currentTrackScrobbled = false;
        this._secondsTrackListened = 0;
    }

    _handlePlaylistChange = () => {
        if (this._currentTrackId === -1) {
            this._ensureTrackId(0);
        }

        this._saveToLS();
    };

    _handleTrackEnd() {
        this.next();
    }

    _ensureTrackId(trackNo) {
        if (this._playlist.length === 0) {
            return false;
        }

        if (trackNo !== undefined) {
            if (trackNo >= this._playlist.length) {
                throw new Exceptions.IndexError(trackNo, this._playlist.length);
            }

            this._changeTrack(trackNo);
        }

        if (this._currentTrackId === -1) {
            this._changeTrack(0);
        }

        return true;
    }

    getPlaylist() {
        return this._playlist;
    }

    addToPlaylist(items) {
        this._popAddQueue(items);
    }

    getPosition() {
        return this._audioElement.currentTime;
    }

    seek(position) {
        this._audioElement.currentTime = position;
        PubSub.publish(events.PLAYBACK_POSITION_CHANGED);
    }

    getDuration() {
        return this._audioElement.duration;
    }

    removeFromPlaylist(indices) {
        const reverseIndices = indices.sort((a, b) => b - a);

        for (const index of reverseIndices) {
            this._playlist.splice(index, 1);
        }

        PubSub.publish(events.PLAYLIST_CHANGED);
    }

    _saveToLS() {
        localStorage.setItem(LOCAL_STORAGE_KEYS.currentPlaylist, JSON.stringify(this._playlist));
    }

    _loadFromLS() {
        const playlist = localStorage.getItem(LOCAL_STORAGE_KEYS.currentPlaylist);

        if (playlist) {
            try {
                this._playlist = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.currentPlaylist));
                PubSub.publish(events.PLAYLIST_CHANGED);
            } catch (e) {
                if (typeof jest === 'undefined') {
                    console.error(e);
                }

                localStorage.removeItem(LOCAL_STORAGE_KEYS.currentPlaylist);
            }
        }
    }

    _popAddQueue = (prevResult) => {
        if (prevResult instanceof Array) {
            this._addQueue = prevResult.concat(this._addQueue);
        } else if (prevResult) {
            this._addQueue = [prevResult].concat(this._addQueue);
        }

        while(this._addQueue.length) {
            let el = this._addQueue[0];
            this._addQueue = this._addQueue.slice(1);

            if (el.type === 'directory') {
                this._fetchDirectory(el);
                return;
            } else if (el.type === 'file') {
                this._playlist.push(el);
            }
        }

        this._ensureTrackId();
        PubSub.publish(events.PLAYLIST_CHANGED);
    };

    _fetchDirectory(directory) {
        $.ajax(`http://${config.host}/library/${encodeURIComponent(directory.path)}/index.json`)
            .done((data) => {
                let items = [];

                for (let index in data) {
                    if (!data.hasOwnProperty(index)) {
                        continue;
                    }

                    items.push(data[index]);
                }

                this._popAddQueue(items)
            })
            .fail((error) => {
                console.error(error);

                this._popAddQueue();
            });
    }

    _playtick = () => {
        if (!this._isPlaying) {
            return;
        }

        PubSub.publish(events.PLAYBACK_POSITION_CHANGED);
        this._secondsTrackListened++;

        const halfDuration = this._playlist[this._currentTrackId].duration / 2;


        if (!this._currentTrackScrobbled && this._secondsTrackListened > halfDuration) {
            this.scrobbler.scrobble(this._playlist[this._currentTrackId], unixTime());
            this._currentTrackScrobbled = true;
        }
    };

    play() {
        if (this._isPlaying) {
            return;
        }

        if (!this._ensureTrackId()) {
            return;
        }

        this._audioElement.play();
        this._isPlaying = true;
        PubSub.publish(events.PLAYBACK_CHANGED);
    }

    pause() {
        if (!this._isPlaying) {
            return;
        }

        this._audioElement.pause();
        this._isPlaying = false;
        PubSub.publish(events.PLAYBACK_CHANGED);
    }

    toggle() {
        if (this._isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    next() {
        this.pause();

        if (this._currentTrackId === this._playlist.length - 1) {
            this._ensureTrackId(0);
        } else {

            this._ensureTrackId(this._currentTrackId + 1);
        }

        this.play();
    }

    prev() {
        this.pause();

        if (this._currentTrackId === 0) {
            this._ensureTrackId(this._playlist.length - 1);
        } else {
            this._ensureTrackId(this._currentTrackId - 1);
        }

        this.play();
    }

    currentTrack() {
        return this._currentTrackId;
    }

    switchTo(index) {
        if (typeof index !== 'number') {
            throw new TypeError('index is not a number');
        }

        this.pause();
        this._ensureTrackId(index);
        this.play();
    }
}

export default Player;

function unixTime() {
    return ((new Date()).getTime()/1000).toFixed();
}

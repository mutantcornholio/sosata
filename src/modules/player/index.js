import PubSub from 'pubsub-js';
import config from '../../config.js'
import * as Exceptions from './exceptions.js';
import $ from 'jquery';
import Scrobbler from '../scrobbler/scrobbler';

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
    scrobbler;

    // custom audioElement is passed in tests
    constructor(audioElement) {
        this._audioElement = audioElement || document.createElement('AUDIO');
        this._audioElement.addEventListener('ended', this._handleTrackEnd.bind(this));
        this.scrobbler = new Scrobbler();

        PubSub.subscribe(events.PLAYLIST_CHANGED, this._handlePlaylistChange);
    }

    _changeTrack(trackNo) {
        this._currentTrackId = trackNo;
        this._audioElement.src = `http://${config.host}/music/${this._playlist[trackNo].url}`;
        this._audioElement.load();
    }

    _handlePlaylistChange = () => {
        if (this._currentTrackId === -1) {
            this._ensureTrackId(0);
        }
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

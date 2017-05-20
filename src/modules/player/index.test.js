import {Player, events} from './';
import {Audio, TimedAudio} from '../../helpers/mock-audio-element'
import PubSub from 'pubsub-js';
import config from '../../config.js'
import * as Exceptions from './exceptions.js';
import $ from 'jquery';
import mockjax from 'jquery-mockjax';
mockjax($, window);

$.mockjaxSettings.logging = 0;
$.mockjaxSettings.responseTime = 0;

let fakeTracks = [{
    "album": "erroor",
    "artist": "r.roo",
    "checksum": "421507598195eab518d84437d8be9fcb",
    "date": "2016",
    "disc": "0",
    "duration": 426.16,
    "mtime": 1462264780,
    "name": "01 - art of forgetting",
    "path": "artists/r.roo/2016.03 - erroor/01. art of forgetting.mp3",
    "size": 17191071,
    "title": "art of forgetting",
    "track": "01",
    "type": "file",
    "url": "artists/r.roo/2016.03%20-%20erroor/01.%20art%20of%20forgetting.mp3"
},{
    "album": "erroor",
    "artist": "r.roo",
    "checksum": "a9ade32bac461810caefcef9ce3a42f8",
    "date": "2016",
    "disc": "0",
    "duration": 353.12,
    "mtime": 1462264782,
    "name": "02 - erroor",
    "path": "artists/r.roo/2016.03 - erroor/02. erroor.mp3",
    "size": 14269514,
    "title": "erroor",
    "track": "02",
    "type": "file",
    "url": "artists/r.roo/2016.03%20-%20erroor/02.%20erroor.mp3"
},{
    "album": "erroor",
    "artist": "r.roo",
    "checksum": "c2967c1e1ff64c34286e6596d0eac109",
    "date": "2016",
    "disc": "0",
    "duration": 453.8,
    "mtime": 1462264782,
    "name": "03 - miraclemike",
    "path": "artists/r.roo/2016.03 - erroor/03. miraclemike.mp3",
    "size": 18296561,
    "title": "miraclemike",
    "track": "03",
    "type": "file",
    "url": "artists/r.roo/2016.03%20-%20erroor/03.%20miraclemike.mp3"
}];

let fakeDirectories = [
    {
        "cover": null,
        "name": "Aphrodite",
        "path": "tags/jungle/Aphrodite",
        "type": "directory"
    }, {
        "cover": null,
        "name": "DJ K",
        "path": "tags/jungle/DJ K",
        "type": "directory"
    }, {
        "cover": null,
        "name": "Production Unit Xero",
        "path": "tags/jungle/Production Unit Xero",
        "type": "directory"
    }
];

let fakeAudio;

beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 500;
});


let testSubscription = false;
afterEach(() => {
    if (testSubscription) {
        PubSub.unsubscribe(testSubscription);
    }
});

describe('Player', () => {
    describe('constructor', () => {
        beforeEach(() => {
            fakeAudio = new Audio();
        });

        it('should create player with empty playlist', () => {
            let player = new Player(fakeAudio);
            expect(player.getPlaylist()).toEqual([]);
        });
    });

    describe('.addToPlaylist', () => {
        let player;

        beforeEach(() => {
            fakeAudio = new Audio();
            player = new Player(fakeAudio);
        });

        afterEach(() => {
            $.mockjax.clear();
        });

        it('should add track to playlist', () => {
            player.addToPlaylist([fakeTracks[0]]);
            expect(player.getPlaylist()).toEqual([fakeTracks[0]]);
        });

        it('should add multiple tracks to playlist', () => {
            player.addToPlaylist([fakeTracks[0], fakeTracks[1], fakeTracks[2]]);
            expect(player.getPlaylist()).toEqual([fakeTracks[0], fakeTracks[1], fakeTracks[2]]);
        });

        it('should not add garbage to playlist array', () => {
            player.addToPlaylist(['test', fakeTracks[0], {type: 'foo'}]);

            expect(player.getPlaylist()).toEqual([fakeTracks[0]]);
        });

        it('should fetch directory when adding it to playlist', (done) => {
            $.mockjax({
                url: `http://${config.host}/library/tags%2Fjungle%2FAphrodite/index.json`,
                contentType: 'application/json',
                dataType: 'json',
                responseText: {track: fakeTracks[0]},
                onAfterComplete: done
            });

            player.addToPlaylist([fakeDirectories[0]]);
        });

        it('should add child directories', (done) => {
            $.mockjax({
                url: `http://${config.host}/library/${encodeURIComponent('tags/jungle')}/index.json`,
                contentType: 'application/json',
                dataType: 'json',
                responseText: {a: fakeDirectories[0], b: fakeDirectories[1]}
            });

            $.mockjax({
                url: `http://${config.host}/library/${encodeURIComponent(fakeDirectories[0].path)}/index.json`,
                contentType: 'application/json',
                dataType: 'json',
                responseText: {a: fakeTracks[0], b: fakeTracks[1]}
            });

            $.mockjax({
                url: `http://${config.host}/library/${encodeURIComponent(fakeDirectories[1].path)}/index.json`,
                contentType: 'application/json',
                dataType: 'json',
                responseText: {a: fakeTracks[1], b: fakeTracks[2]}
            });

            player.addToPlaylist({
                "cover": null,
                "name": "jungle",
                "path": "tags/jungle",
                "type": "directory"
            });

            setTimeout(() => {
                try {
                    expect(player.getPlaylist()).toEqual([fakeTracks[0], fakeTracks[1], fakeTracks[1], fakeTracks[2]]);
                    done();
                } catch (e) {
                    done.fail(e);
                }
            }, 10);
        });

        it('should keep order of adding', (done) => {
            $.mockjax({
                url: `http://${config.host}/library/tags%2Fjungle%2FAphrodite/index.json`,
                contentType: 'application/json',
                dataType: 'json',
                responseText: {track: fakeTracks[2]}
            });

            player.addToPlaylist([fakeTracks[0], fakeDirectories[0], fakeTracks[1], fakeTracks[2]]);

            setTimeout(() => {
                try {
                    expect(player.getPlaylist()).toEqual([fakeTracks[0], fakeTracks[2], fakeTracks[1], fakeTracks[2]]);
                    done();
                } catch (e) {
                    done.fail(e);
                }
            }, 10);
        });

        it('should publish event on adding track to playlist', (done) => {
            testSubscription = PubSub.subscribe(events.PLAYLIST_CHANGED, done);

            player.addToPlaylist([fakeTracks[0]]);
        });

        it('should publish event on adding directories to playlist', (done) => {
            $.mockjax({
                url: `http://${config.host}/library/tags/jungle/Aphrodite/index.json`,
                contentType: 'application/json',
                dataType: 'json',
                responseText: {track: fakeTracks[2]}
            });

            testSubscription = PubSub.subscribe(events.PLAYLIST_CHANGED, done);

            player.addToPlaylist([fakeDirectories[0]]);
        });
    });

    describe('.play', () => {
        let player;

        beforeEach(() => {
            fakeAudio = new Audio();
            player = new Player(fakeAudio);
            player.addToPlaylist([fakeTracks[0]]);
        });

        it('should set correct src to audio element', () => {
            player.play();

            expect(fakeAudio.src).toEqual(
                `http://${config.host}/music/artists/r.roo/2016.03%20-%20erroor/01.%20art%20of%20forgetting.mp3`
            );
        });

        it('should start playback', (done) => {
            fakeAudio.addEventListener('play', done);
            player.play();
        });

        it('should publish event', (done) => {
            testSubscription = PubSub.subscribe(events.PLAYBACK_CHANGED, done);
            player.play();
        });

        it('should not publish event if already playing', (done) => {
            player.play();
            setTimeout(() => {
                testSubscription = PubSub.subscribe(events.PLAYBACK_CHANGED, done.fail);
                player.play();
                setTimeout(done, 1);
            }, 1);
        });
    });

    describe('.switchTo', () => {
        let player;

        beforeEach(() => {
            fakeAudio = new Audio();
            player = new Player(fakeAudio);
            player.addToPlaylist([fakeTracks[0], fakeTracks[1], fakeTracks[2]]);
        });

        it('should set desired index', () => {
            player.switchTo(1);
            expect(player.currentTrack()).toEqual(1);

            player.switchTo(2);
            expect(player.currentTrack()).toEqual(2);
        });

        it('should throw IndexError when trying to set track out of range', () => {
            expect(() => {player.switchTo(3)}).toThrow(Exceptions.IndexError);
        });

        it('should throw TypeError if passed non-number', () => {
            expect(() => {player.switchTo('1')}).toThrow(TypeError);
        });

        it('should start playback', (done) => {
            fakeAudio.addEventListener('play', done);
            player.switchTo(1);
        });

        it('should publish event', (done) => {
            testSubscription = PubSub.subscribe(events.PLAYBACK_CHANGED, done);
            player.switchTo(1);
        });
    });

    describe('.next', () => {
        let player;

        beforeEach(() => {
            fakeAudio = new Audio();
            player = new Player(fakeAudio);
            player.addToPlaylist([fakeTracks[0], fakeTracks[1], fakeTracks[2]]);
        });

        it('should switch to next index', () => {
            player.switchTo(1);
            player.next();
            expect(player.currentTrack()).toEqual(2);
        });

        it('should start playback', (done) => {
            fakeAudio.addEventListener('play', done);
            player.next(1);
        });

        it('should publish event', (done) => {
            testSubscription = PubSub.subscribe(events.PLAYBACK_CHANGED, done);
            player.next(1);
        });

        it('should publish switch to first track if player was at last one', () => {
            player.switchTo(2);
            player.next();
            expect(player.currentTrack()).toEqual(0);
        });
    });

    describe('.prev', () => {
        let player;

        beforeEach(() => {
            fakeAudio = new Audio();
            player = new Player(fakeAudio);
            player.addToPlaylist([fakeTracks[0], fakeTracks[1], fakeTracks[2]]);
        });

        it('should switch to previous index', () => {
            player.switchTo(1);
            player.prev();
            expect(player.currentTrack()).toEqual(0);
        });

        it('should start playback', (done) => {
            fakeAudio.addEventListener('play', done);
            player.prev(1);
        });

        it('should publish event', (done) => {
            testSubscription = PubSub.subscribe(events.PLAYBACK_CHANGED, done);
            player.prev(1);
        });

        it('should publish switch to last track if player was at first one', () => {
            player.switchTo(0);
            player.prev();
            expect(player.currentTrack()).toEqual(2);
        });
    });

    describe('track ending handling', () => {
        let player;

        beforeEach(() => {
            fakeAudio = new Audio();
            player = new Player(fakeAudio);
            player.addToPlaylist([fakeTracks[0], fakeTracks[1], fakeTracks[2]]);
        });

        it('should switch to next track', (done) => {
            player.play();

            fakeAudio.emit('ended');

            setTimeout(() => {
                try {
                    expect(player.currentTrack()).toEqual(1);
                    done();
                } catch (e) {
                    done.fail(e);
                }
            }, 1);
        });
    });

    describe('scrobbling', () => {
        let player;

        beforeAll(jest.useFakeTimers);

        beforeEach(() => {
            fakeAudio = new Audio();
            player = new Player(fakeAudio);

            player.addToPlaylist([fakeTracks[0]]);
        });

        it('should call scrobble after half of track has been played', () => {
            spyOn(player.scrobbler, 'scrobble');

            player.play();

            jest.runTimersToTime(200 * 1000);

            expect(player.scrobbler.scrobble).not.toHaveBeenCalled();

            jest.runTimersToTime(215 * 1000);

            expect(player.scrobbler.scrobble).toHaveBeenCalledWith(fakeTracks[0], jasmine.anything());
        })
    });
});

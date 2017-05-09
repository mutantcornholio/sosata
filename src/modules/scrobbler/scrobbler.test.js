import {Scrobbler, LOCAL_STORAGE_KEYS} from './scrobbler';
import config from '../../config.js'
import fetchMock from 'fetch-mock';

const fakeTracks = [{
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

describe('scrobbler', () => {
    let scrobbler;

    function unmatchedRequestFail(doneFail) {
        return function (url) {
            doneFail(`Invalid/unmocked request: ${url}`);

            return {
                status: 400,
                body: 'Invalid/unmocked request'
            };
        };
    }

    beforeAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 500;
    });

    afterEach(() => {
        fetchMock.restore();
        localStorage.removeItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.scrobblingQueue);
    });

    describe('.isConnected', () => {
        it('shoud return false if no session key saved in localstorage', () => {
            scrobbler = new Scrobbler(config);

            expect(scrobbler.isConnected).toBe(false);
        });

        it('shoud return true if session key saved in localstorage', () => {
            localStorage.setItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey, 'd580d57f32848f5dcf574d1ce18d78b2');

            scrobbler = new Scrobbler(config);

            expect(scrobbler.isConnected).toBe(true);
        });

        it('shoud change to true after settting session key in localstorage', () => {
            localStorage.setItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey, 'd580d57f32848f5dcf574d1ce18d78b2');

            scrobbler = new Scrobbler(config);

            expect(scrobbler.isConnected).toBe(true);
        });


    });

    describe('.connect', () => {
        const response = {
            session: {
                key: 'd580d57f32848f5dcf574d1ce18d78b2'
            }
        };

        it('should fetch web session', (done) => {
            fetchMock.mock({
                matcher: 'glob:http://ws.audioscrobbler.com/2.0/*method=auth.getSession*',
                response: () => {
                    done();

                    return {
                        body: {
                            session: {
                                key: 'd580d57f32848f5dcf574d1ce18d78b2'
                            }
                        },
                        sendAsJson: true
                    }
                }
            }).catch(unmatchedRequestFail(done.fail));

            scrobbler = new Scrobbler(config);

            scrobbler.connect('qwertyuiopasdfghjkl');
        });

        it('should store key in localstorage', (done) => {
            fetchMock.mock({
                matcher: 'glob:http://ws.audioscrobbler.com/2.0/*method=auth.getSession*',
                response: {
                    session: {
                        key: 'd580d57f32848f5dcf574d1ce18d78b2'
                    }
                }
            }).catch(unmatchedRequestFail(done.fail));

            scrobbler = new Scrobbler(config);

            scrobbler.connect('qwertyuiopasdfghjkl').then(() => {
                const sessionKey = localStorage.getItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey);

                try {
                    expect(sessionKey).toEqual(response.session.key);
                    done();
                } catch (e) {
                    done.fail(e);
                }
            });
        });

        it('should set .isConnected to true', (done) => {
            fetchMock.mock({
                matcher: 'glob:http://ws.audioscrobbler.com/2.0/*method=auth.getSession*',
                response: {
                    session: {
                        key: 'd580d57f32848f5dcf574d1ce18d78b2'
                    }
                }
            }).catch(unmatchedRequestFail(done.fail));

            scrobbler = new Scrobbler(config);

            scrobbler.connect('qwertyuiopasdfghjkl').then(() => {
                try {
                    expect(scrobbler.isConnected).toEqual(true);
                    done();
                } catch (e) {
                    done.fail(e);
                }
            });
        });
    });

    function mockScrobble() {
        fetchMock.mock({
            matcher: 'glob:http://ws.audioscrobbler.com/2.0/*method=track.scrobble*',
            method: 'POST',
            response: {}
        }).catch(error => {
            throw error;
        });
    }

    // Whitebox unit testing here. Sorry.
    describe('.scrobble', () => {
        beforeEach(mockScrobble);

        it('should add track to scrobbling queue', () => {
            scrobbler = new Scrobbler(config);

            scrobbler.scrobble(fakeTracks[0], unixTime());

            expect(scrobbler._scrobblingQueue[0].checksum).toEqual(fakeTracks[0].checksum);
        });

        it('should add timestamp to track at scrobbling queue', () => {
            scrobbler = new Scrobbler(config);

            const timestamp = unixTime();

            scrobbler.scrobble(fakeTracks[0], timestamp);

            expect(scrobbler._scrobblingQueue[0].__timestamp).toEqual(timestamp);
        });

        it('should toggle _scrobble method', () => {
            scrobbler = new Scrobbler(config);

            spyOn(scrobbler, '_scrobble');

            const timestamp = unixTime();

            scrobbler.scrobble(fakeTracks[0], timestamp);

            expect(scrobbler._scrobble).toHaveBeenCalled();
        });

        it('should save scrobbling queue to localStorage', () => {

            scrobbler = new Scrobbler(config);

            const timestamp = unixTime();
            scrobbler.scrobble(fakeTracks[0], timestamp);

            const lsQueue = localStorage.getItem(LOCAL_STORAGE_KEYS.scrobblingQueue);

            expect(lsQueue).toContain(fakeTracks[0].checksum);
            expect(lsQueue).toContain(timestamp);
        });
    });

    it('should load scrobbling queue from localStorage', () => {
        mockScrobble();

        scrobbler = new Scrobbler(config);

        scrobbler.scrobble(fakeTracks[0], unixTime());

        const oldQueueItem = scrobbler._scrobblingQueue[0];

        const newScrobbler = new Scrobbler(config);

        expect(newScrobbler._scrobblingQueue).toEqual([oldQueueItem]);
    });

    describe('._scrobble', () => {
        xit('should call scrobble api with track and timestamp', (done) => {
            const timestamp = unixTime();

            fetchMock.mock({
                matcher: 'glob:http://ws.audioscrobbler.com/2.0/*method=track.scrobble*',
                name: 'scrobble',
                method: 'POST',
                response: url => {
                    setTimeout(() => {
                        try{
                            const call = fetchMock.calls('scrobble')[0];
                            const body = call[1].body;

                            expect(body).toContain(`artist[0]=${encodeURIComponent(fakeTracks[0].artist)}`);
                            expect(body).toContain(`track[0]=${encodeURIComponent(fakeTracks[0].track)}`);
                            expect(body).toContain(`timestamp[0]=${timestamp}`);
                            done();
                        } catch (e) {
                            done.fail(e);
                        }
                    }, 0);

                    return {};
                }
            }).catch(unmatchedRequestFail(done.fail));

            scrobbler = new Scrobbler(config);
            scrobbler.scrobble(fakeTracks[0], timestamp);
        });

        xit('should remove item from queue if scrobble succedes', (done) => {
            const timestamp = unixTime();

            fetchMock.mock({
                matcher: 'glob:http://ws.audioscrobbler.com/2.0/*method=track.scrobble*',
                name: 'scrobble',
                method: 'POST',
                response: url => {
                    setTimeout(() => {
                        try {
                            const call = fetchMock.calls('scrobble')[0];
                            const body = call[1].body;

                            expect(scrobbler._scrobblingQueue.length).toEqual(0);
                            done();
                        } catch (e) {
                            done.fail(e);
                        }
                    }, 0);

                    return {};
                }
            }).catch(unmatchedRequestFail(done.fail));

            scrobbler = new Scrobbler(config);
            scrobbler.scrobble(fakeTracks[0], timestamp);
        });

        xit('should put items back if scrobble fails', (done) => {
            const timestamp = unixTime();

            fetchMock.mock({
                matcher: 'glob:http://ws.audioscrobbler.com/2.0/*method=track.scrobble*',
                name: 'scrobble',
                method: 'POST',
                response: url => {
                    setTimeout(() => {
                        try{
                            const call = fetchMock.calls('scrobble')[0];
                            const body = call[1].body;

                            expect(scrobbler._scrobblingQueue[0].checksum).toEqual(fakeTracks[0].checksum);
                            done();
                        } catch (e) {
                            done.fail(e);
                        }
                    }, 0);

                    return {};
                }
            }).catch(unmatchedRequestFail(done.fail));

            scrobbler = new Scrobbler(config);
            scrobbler.scrobble(fakeTracks[0], timestamp);
        });

        xit('should scrobble in batches of 50', (done) => {
            const timestamp = unixTime();

            fetchMock.mock({
                matcher: 'glob:http://ws.audioscrobbler.com/2.0/*method=track.scrobble*',
                name: 'scrobble',
                method: 'POST',
                response: url => {
                    setTimeout(() => {
                        try {
                            const call = fetchMock.calls('scrobble')[0];
                            const body = call[1].body;

                            expect(scrobbler._scrobblingQueue.length).toEqual(20);
                            done();
                        } catch (e) {
                            done.fail(e);
                        }
                    }, 0);

                    return {};
                }
            }).catch(unmatchedRequestFail(done.fail));

            scrobbler = new Scrobbler(config);

            for (let i = 0; i < 70; i++) {
                scrobbler.scrobble(fakeTracks[0], timestamp + 1);
            }
        });

        xit('should retry scrobbling', (done) => {
            done.fail();
        });
    });
});

function unixTime() {
    return ((new Date()).getTime()/1000).toFixed();
}

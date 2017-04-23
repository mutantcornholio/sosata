import {Scrobbler, LOCAL_STORAGE_KEYS} from './scrobbler';
import config from '../../config.js'
import $ from 'jquery';
import mockjax from 'jquery-mockjax';
mockjax($, window);

$.mockjaxSettings.logging = 0;
$.mockjaxSettings.responseTime = 0;


describe('scrobbler', () => {
    let scrobbler;

    afterEach(() => {
        $.mockjax.clear();
        localStorage.removeItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey);
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
            $.mockjax({
                url: `http://ws.audioscrobbler.com/2.0/*method=auth.getSession*`,
                dataType: 'json',
                responseText: response,
                onAfterComplete: done
            });

            scrobbler = new Scrobbler(config);

            scrobbler.connect('qwertyuiopasdfghjkl');
        });

        it('should store key in localstorage', (done) => {
            $.mockjax({
                url: `http://ws.audioscrobbler.com/2.0/?*method=auth.getSession*`,
                dataType: 'json',
                responseText: response,
                onAfterComplete: () => {
                    const sessionKey = localStorage.getItem(LOCAL_STORAGE_KEYS.scrobblerSessionKey);

                    expect(sessionKey).toEqual(response.session.key);

                    done();
                }
            });

            scrobbler = new Scrobbler(config);

            scrobbler.connect('qwertyuiopasdfghjkl');
        });

        it('should set .isConnected to true', (done) => {
            scrobbler = new Scrobbler(config);

            $.mockjax({
                url: `http://ws.audioscrobbler.com/2.0/?*method=auth.getSession*`,
                dataType: 'json',
                responseText: response,
                onAfterComplete: () => {
                    expect(scrobbler.isConnected).toEqual(true);

                    done();
                }
            });

            scrobbler.connect('qwertyuiopasdfghjkl');
        });
    });
});

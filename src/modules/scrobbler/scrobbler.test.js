import {Scrobbler, LOCAL_STORAGE_KEYS} from './scrobbler';
import config from '../../config.js'
import $ from 'jquery';
import mockjax from 'jquery-mockjax';
mockjax($, window);

$.mockjaxSettings.logging = 0;
$.mockjaxSettings.responseTime = 0;


describe('scrobbler', () => {
    let scrobbler;

    // it('should renew api key on start', () => {
    //     expect(false).toBe(true);
    // });
    beforeAll(() => {
        if (!global.localStorage) {
            global.localStorage = {
                items: {

                },
                getItem(key) {
                    return this.items[key];
                },
                setItem(key, value) {
                    this.items[key] = value;
                }
            }
        }
    });

    afterEach(() => {
        $.mockjax.clear();
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
        it('should fetch web session', (done) => {
            // FIXME: api_sig
            $.mockjax({
                url: `http://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${config.lastfm.apiKey}`,
                dataType: 'json',
                responseText: {track: fakeTracks[0]},
                onAfterComplete: done
            });

            done.fail();
        })
    });
});

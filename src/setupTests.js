'use strict';

if (!global.localStorage) {
    global.localStorage = {
        items: {

        },
        getItem(key) {
            return this.items[key];
        },
        setItem(key, value) {
            this.items[key] = value;
        },
        removeItem(key) {
            if (this.items[key]) {
                delete this.items[key];
            }
        }
    };
}

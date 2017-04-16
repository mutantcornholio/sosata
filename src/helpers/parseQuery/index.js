// http://stackoverflow.com/a/13419367/1958334
export function parseQuery(qstr) {
    const query = {};
    const a = (qstr[0] === '?' ? qstr.substr(1) : qstr).split('&');

    for (let i = 0; i < a.length; i++) {
        const b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
    }

    return query;
}

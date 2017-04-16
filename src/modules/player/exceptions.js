export class IndexError extends Error {
    constructor(index, length) {
        super();
        this.message = `Item '${index}' is out of range (${length})`;
    }
}

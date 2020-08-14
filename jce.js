"use strict";
const Readable = require("stream").Readable;
class JceError extends Error {};

function readHead(stream) {
    const head = stream.read(1).readUInt8();
    let tag = (head & 0xF0) >> 4;
    const type = head & 0xF;
    if (tag >= 15)
        tag = stream.read(1).readUInt8();
    return {tag, type};
}

function readBody(stream, head, struct) {
    switch(head.type) {
        case 0:
            return stream.read(1).readInt8();
        case 1:
            return stream.read(2).readInt16BE();
        case 2:
            return stream.read(4).readInt32BE();
        case 3:
            return stream.read(8).readBigInt64BE();
        case 4:
            return stream.read(4).readFloatBE();
        case 5:
            return stream.read(8).readDoubleBE();
        case 6:
            return stream.read(stream.read(1).readUInt8());
        case 7:
            return stream.read(stream.read(4).readUInt32BE());
        case 8:
            var len = stream.read(4).readUInt32BE();
            const map = {};
            while(len > 0) {
                map[readElement(stream).data.toString()] = readElement(stream).data;
                --len;
            }
            return data;
        case 9:
            var len = stream.read(4).readUInt32BE();
            const list = [];
            while(len > 0) {
                list.push(readElement(stream).data);
                --len;
            }
            return data;
        case 10:
            const nested = struct.hasOwnProperty(head.tag) ? struct[head.tag] : {};
            return readFrom(stream, nested);
        case 11:
            return undefined;
        case 12:
            return 0;
        case 13:
            readHead(stream);
            return stream.read(stream.read(4).readUInt32BE());
        default:
            throw new JceError("unknown jce type: " + head.type)
    }
}

function readElement(stream, struct) {
    const head = readHead(stream);
    const data = readBody(stream, head, struct);
    return {
        tag: head.tag, type: head.type, data
    };
}

function readFrom(stream, struct) {
    stream.read(0);
    const result = {};
    while(stream.readableLength) {
        const {tag, type, data} = readElement(stream, struct);
        if (type === 11)
            break;
        if (struct.hasOwnProperty(tag))
            result[struct[tag]] = data;
    }
    return result;
}

class JceStruct {
    constructor(struct, name) {
        for (let k in struct) {
            this[k] = struct[k]
        }
    }
    getName() {
        return this._name
    }
}

var a = new JceStruct({bbb: 123}, 123);

console.log(a)

const struct = {
    qaz: 0,
    wsx: 1,
    edc: 2,
    rfc: 4,
    tgb: {
        yhn: 1,
        ujm: 2
    }
}

const blob = Buffer.alloc(1);
const stream = Readable.from(blob, {objectMode: false});
// readFrom(stream, struct);

function writeFrom(object, tags) {

}

"use strict";
/**
 * @typedef Readable
 */
const Readable = require("stream").Readable;
class JceError extends Error {};

/**
 * @typedef {Object} JceStruct jce data struct
 * An object which can be nested. K is a human-readable name(String), and V is the value of its tag(UInt8).
 * When nesting, V becomes an array(length=2). The 1st element is the value of the tag, and the 2nd element is the nesting JceStruct.
 * 一个可以嵌套的object，K是字段名(String)，V是tag值(UInt8)；
 *   嵌套的时候（即StructBegin开始处）v变为长度为2的数组，第一个元素是tag值，第二个元素是嵌套的JceStruct
 * Example：
 * {
 *   qaz: 0,
 *   wsx: 1,
 *   edc: 3,
 *   rfv: [
 *     4,
 *     {
 *       foo: 0,
 *       bar: 1,
 *       ...<more>
 *     }
 *   ],
 *   tgb: 5,
 *   ...<more>
 * }
 */

const TYPE_INT8 = 0;
const TYPE_INT16 = 1;
const TYPE_INT32 = 2;
const TYPE_INT64 = 3;
const TYPE_FLOAT = 4;
const TYPE_DOUBLE = 5;
const TYPE_STRING1 = 6;
const TYPE_STRING4 = 7;
const TYPE_MAP = 8;
const TYPE_LIST = 9;
const TYPE_STRUCT_BEGIN = 10;
const TYPE_STRUCT_END = 11;
const TYPE_ZERO = 12;
const TYPE_SIMPLE_LIST = 13;

const TAG_MAP_K = 0;
const TAG_MAP_V = 1;
const TAG_LIST_E = 0;
const TAG_BYTES = 0;
const TAG_STRUCT_END = 0;

let _encoding = "utf8";

/**
 * @param {JceStruct} struct 
 * @param {Number} tag UInt8
 */
function findNameByTag(struct, tag) {
    if (!struct)
        return undefined;
    return Object.keys(struct).find((v)=>{
        if (typeof struct[v] === "number") {
            return struct[v] === tag;
        } else {
            return struct[v][0] === tag;
        }
    })
}

/**
 * @param {Readable} stream 
 * @param {JceStruct} struct 
 * @returns {Object} {tag: UInt8, type: UInt8, name: String}
 */
function readHead(stream, struct) {
    const head = stream.read(1).readUInt8();
    const type = head & 0xf;
    let tag = (head & 0xf0) >> 4;
    if (tag === 0xf)
        tag = stream.read(1).readUInt8();
    const name = findNameByTag(struct, tag);
    return {tag, type, name};
}

/**
 * @param {Readable} stream 
 * @param {Object} head @see readHead
 * @param {JceStruct} struct 
 * @returns {any}
 */
function readBody(stream, head, struct) {
    var len;
    switch(head.type) {
        case TYPE_INT8:
            return stream.read(1).readInt8();
        case TYPE_INT16:
            return stream.read(2).readInt16BE();
        case TYPE_INT32:
            return stream.read(4).readInt32BE();
        case TYPE_INT64:
            var value = stream.read(8).readBigInt64BE();
            if (value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER)
                value = parseInt(value);
            return value;
        case TYPE_FLOAT:
            return stream.read(4).readFloatBE();
        case TYPE_DOUBLE:
            return stream.read(8).readDoubleBE();
        case TYPE_STRING1:
            if (_encoding === "raw")
                return stream.read(stream.read(1).readUInt8());
            else
                return stream.read(stream.read(1).readUInt8()).toString(_encoding);
        case TYPE_STRING4:
            if (_encoding === "raw")
                return stream.read(stream.read(4).readUInt32BE());
            else
                return stream.read(stream.read(4).readUInt32BE()).toString(_encoding);
        case TYPE_MAP:
            len = stream.read(4).readUInt32BE();
            const map = {};
            while(len > 0) {
                map[readElement(stream).value.toString()] = readElement(stream).value;
                --len;
            }
            return map;
        case TYPE_LIST:
            len = stream.read(4).readUInt32BE();
            const list = [];
            while(len > 0) {
                list.push(readElement(stream).value);
                --len;
            }
            return list;
        case TYPE_STRUCT_BEGIN:
            const nested = struct.hasOwnProperty(head.name) ? struct[head.name][1] : {};
            return readFrom(stream, nested);
        case TYPE_STRUCT_END:
            return undefined;
        case TYPE_ZERO:
            return 0;
        case TYPE_SIMPLE_LIST:
            readHead(stream);
            return stream.read(stream.read(4).readUInt32BE());
        default:
            throw new JceError("unknown jce type: " + head.type)
    }
}

/**
 * @param {Readable} stream 
 * @param {JceStruct} struct 
 * @returns {Object} {tag: UInt8, type: UInt8, value: any}
 */
function readElement(stream, struct) {
    const head = readHead(stream, struct);
    const value = readBody(stream, head, struct);
    return {
        tag: head.tag, type: head.type, name: head.name, value
    };
}

/**
 * @param {Readable} stream 
 * @param {JceStruct} struct 
 * @returns {Object}
 */
function readFrom(stream, struct) {
    const result = {};
    while(stream.readableLength) {
        const {type, name, value} = readElement(stream, struct);
        if (type === TYPE_STRUCT_END)
            break;
        if (name)
            result[name] = value;
    }
    return result;
}

//------------------------------------------------------------------

/**
 * @param {Number} type UInt8 0~13
 * @param {Number} tag UInt8
 * @returns {Buffer}
 */
function createHead(type, tag) {
    if (tag < 15) {
        return Buffer.from([(tag<<4)|type]);
    } else if (tag < 256) {
        return Buffer.from([0xf0|type, tag]);
    } else {
        throw new JceError("Tag must be less than 256")
    }
}

/**
 * @param {Number} type UInt8 0~13
 * @param {Number|BigInt|String|Buffer|Array|Object} value 
 * @returns {Buffer}
 */
function createBody(type, value) {
    var body, len;
    switch (type) {
        case TYPE_INT8:
            return Buffer.from([parseInt(value)]);
        case TYPE_INT16:
            body = Buffer.alloc(2);
            body.writeInt16BE(parseInt(value));
            return body;
        case TYPE_INT32:
            body = Buffer.alloc(4);
            body.writeInt32BE(parseInt(value));
            return body;
        case TYPE_INT64:
            body = Buffer.alloc(8);
            body.writeBigInt64BE(BigInt(value));
            return body;
        case TYPE_FLOAT:
            body = Buffer.alloc(4);
            body.writeFloatBE(value);
            return body;
        case TYPE_DOUBLE:
            body = Buffer.alloc(8);
            body.writeDoubleBE(value);
            return body;
        case TYPE_STRING1:
            len = Buffer.from([value.length]);
            return Buffer.concat([len, Buffer.from(value)]);
        case TYPE_STRING4:
            len = Buffer.alloc(4);
            len.writeUInt32BE(value.length);
            return Buffer.concat([len, Buffer.from(value)]);
        case TYPE_MAP:
            body = [];
            let n = 0;
            for (let k of Object.keys(value)) {
                ++n;
                body.push(createElement(TAG_MAP_K, k));
                body.push(createElement(TAG_MAP_V, value[k]));
            }
            len = Buffer.alloc(4);
            len.writeUInt32BE(n);
            body.unshift(len);
            return Buffer.concat(body);
        case TYPE_LIST:
            len = Buffer.alloc(4);
            len.writeUInt32BE(value.length);
            body = [len];
            for (let i = 0; i < value.length; ++i) {
                body.push(createElement(TAG_LIST_E, value[i]));
            }
            return Buffer.concat(body);
        case TYPE_STRUCT_BEGIN:
        case TYPE_STRUCT_END:
        case TYPE_ZERO:
            return Buffer.alloc(0);
        case TYPE_SIMPLE_LIST:
            len = Buffer.alloc(4);
            len.writeUInt32BE(value.length);
            return Buffer.concat([createHead(0, TAG_BYTES), len, value]);
    }
}

/**
 * @param {Number} tag UInt8
 * @param {Number|BigInt|String|Buffer|Array|Object} value 
 * @param {JceStruct|undefined} nested
 * @returns {Buffer}
 */
function createElement(tag, value, nested = undefined) {
    if (nested) {
        const head_struct_begin = createHead(TYPE_STRUCT_BEGIN, tag);
        const body = encode(value, nested);
        const head_struct_end = createHead(TYPE_STRUCT_END, TAG_STRUCT_END);
        return Buffer.concat([head_struct_begin, body, head_struct_end]);
    }
    let type = typeof value;
    switch (type) {
        case "string":
            if (_encoding !== "raw")
                value = Buffer.from(value, _encoding);
            type = Buffer.byteLength(value) <= 0xff ? TYPE_STRING1 : TYPE_STRING4;
            break;
        case "object":
            if (value === null)
                return;
            if (value instanceof Buffer)
                type = TYPE_SIMPLE_LIST;
            else
                type = Array.isArray(value) ? TYPE_LIST : TYPE_MAP;
            break;
        case "bigint":
        case "number":
            if (value == 0)
                type = TYPE_ZERO;
            else if (Number.isInteger(value) || type === "bigint") {
                if (value >= -0x80 && value <= 0x7f)
                    type = TYPE_INT8;
                else if (value >= -0x8000 && value <= 0x7fff)
                    type = TYPE_INT16;
                else if (value >= -0x80000000 && value <= 0x7fffffff)
                    type = TYPE_INT32;
                else if (value >= -0x8000000000000000n && value <= 0x7fffffffffffffffn)
                    type = TYPE_INT64;
                else
                    throw new JceError("Unsupported integer range: " + value);
            } else {
                type = TYPE_DOUBLE; //we don't use float
            }
            break;
        default:
            return;
    }
    const head = createHead(type, tag);
    const body = createBody(type, value);
    return Buffer.concat([head, body]);
}

//--------------------------------------------------------------------

/**
 * @param {Buffer} blob 
 * @param {JceStruct} struct 
 * @returns {Object}
 */
function decode(blob, struct) {
    const stream = Readable.from(blob, {objectMode: false});
    stream.read(0);
    return readFrom(stream, struct);
}

/**
 * @param {Object} object 
 * @param {JceStruct} struct 
 */
function encode(object, struct) {
    const elements = [];
    for (let name of Object.keys(object)) {
        let tag = struct[name], nested = undefined;
        if (typeof tag !== "number") {
            tag = tag[0], nested = tag[1];
        }
        elements.push(createElement(tag, object[name], nested));
    }
    return Buffer.concat(elements);
}

/**
 * @param {String} encoding If it is set to "raw", values of String type will return a raw buffer.
 * @returns {void}
 */
function setEncoding(encoding = "utf8") {
    _encoding = encoding;
}

module.exports = {
    setEncoding, decode, encode
};

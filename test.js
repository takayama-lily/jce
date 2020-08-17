"use strict";
const jce = require("./jce");

const struct_nested = {
    foo: 1,
    bar: 3,
    ooo: 5,
    kkk: 7
};
const struct = {
    qaz: 0,
    wsx: 1,
    edc: 2,
    rfc: 4,
    tgb: 5,
    yhn: 255
};

const object_nested = {
    foo: 666,
    bar: "teststr",
    ooo: [
    	1, "abc", {a:1, b:2}
    ],
    kkk: Buffer.from("qwerty")
};
const object = {
    qaz: 1.3,
    wsx: 12n,
    edc: BigInt(2**62),
    tgb: {
        a:Buffer.from("123"), b:[1,"1"]
    },
    yhn: undefined
};

var encoded, decoded, encoded_nested, decoded_nested;
console.time();
for (let i = 0; i < 1; ++i) {
	// jce.setEncoding("utf8");
    encoded_nested = jce.encodeNested(object_nested, struct_nested);
    object.yhn = encoded_nested
	encoded = jce.encode(object, struct);
	// jce.setEncoding("raw");
	decoded = jce.decode(encoded, struct);
    decoded_nested = jce.decode(decoded.yhn, struct_nested);
}
console.timeEnd();
console.log(encoded);
console.log(encoded_nested);
console.log(decoded);
console.log(decoded_nested);

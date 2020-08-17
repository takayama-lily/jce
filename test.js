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
    tgb: [
        5,
        struct_nested
    ]
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
    tgb: object_nested
};

var encoded, decoded;
console.time();
for (let i = 0; i < 100000; ++i) {
	// jce.setEncoding("utf8");
	encoded = jce.encode(object, struct);
	// jce.setEncoding("raw");
	decoded = jce.decode(encoded, struct);
}
console.timeEnd();
console.log(encoded);
console.log(decoded);

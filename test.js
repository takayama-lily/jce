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
    yhn: 255,
    ppp:6
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
    yhn: undefined,
    ppp: 45
};

var encoded, decoded, encoded_nested, decoded_nested;

    
console.time();
for (let i = 0; i < 1; ++i) {
	// jce.setEncoding("utf8");
    encoded_nested = jce.encodeNested(object_nested, struct_nested);
    object.yhn = encoded_nested
	encoded = jce.encode(object, struct);
	// jce.setEncoding("raw");
	decoded = jce.decode(encoded);
    // decoded_nested = jce.decode(decoded.yhn, struct_nested);
}
console.timeEnd();
console.log(encoded);
console.log(encoded_nested);
console.log(decoded);
console.log(decoded_nested);

// const encoded_arr = jce.encode([0,1,2,"abc",null,undefined,3.3,{a:1},[666,Buffer.from("qaz")]])
// const decoded_arr = jce.decode(encoded_arr)
// console.log(encoded_arr)
// console.log(decoded_arr)

// const encoded_map = jce.encode({0:1,3:"abc",5:[1,2,3]})
// const decoded_map = jce.decode(encoded_map)
// console.log(encoded_map)
// console.log(decoded_map)

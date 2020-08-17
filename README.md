# **jce**
  
一种自解释型的 TTLV<Tag，Type，Length，Value> 数据交换协议

**Install with npm:**

```shell
# npm i jce
```

**Example:**

```js
const jce = require("jce");

const struct = {
    foo: 0, //tag0
    bar: 1, //tag1
    baz: 2  //tag2
};
const object = {
    foo: 12.34,
    bar: "bar123",
    baz: {
        qaz: [Buffer.from("abcdef"), 12n]
    }
};
const encoded = jce.encode(object, struct);
const decoded = jce.decode(encoded, struct);

console.log(encoded);
console.log(decoded);
```

**Nesting Usage:**  
[test.js](./test.js)

# **jce**
  
一种自解释型的 TTLV<Tag，Type，Length，Value> 数据交换协议

**Install with npm:**

```
$ npm i jce
```

**Example:**

```js
const jce = require("jce")

const struct = {
    foo: 0, //tag0
    bar: 1, //tag1
    baz: [  //tag2, nested
        2,
        {
            qaz: 0, //nested tag0
        }
    ]
}
const object = {
    foo: 12.34,
    bar: "bar123",
    baz: {
        qaz: [1, 2]
    }
}
const encoded = jce.encode(object, struct);
const decoded = jce.decode(encoded, struct);

console.log(encoded);
console.log(decoded);
```

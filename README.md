# **jce**
  
一种自解释型的 TTLV<Tag，Type，Length，Value> 数据交换协议

**Install with npm:**

```shell
# npm i jce
```

**Simple Example:**

```js
const jce = require("jce");

// encode by array
const encoded1 = jce.encode([
    "abc", 1, 3.3, null, //null and undefined will be skipped
    [0, 12n, Buffer.from("def")],   //list
    {a: 0xffffff, b: BigInt(2**60)} //map
]);

// encode by object
const encoded2 = jce.encode({
    1:"a", 3:12.34, 5:{}, 7:[]
});

// decode
jce.decode(encoded1);
jce.decode(encoded2);
```

**Struct Usage:**

```js
const jce = require("jce");
const struct = {
    foo: 0, //tag0
    bar: 1, //tag1
    baz: 2  //tag2
};
const object = {
    foo: 12.34,
    bar: "bar123"
};
const encoded = jce.encode(object, struct);
const decoded = jce.decode(encoded);
```

**Nesting Usage:**  
@see [test.js](./test.js)

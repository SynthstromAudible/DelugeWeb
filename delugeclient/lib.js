export function loadlib(cb) {
  let memory = new WebAssembly.Memory({ initial: 2048, maximum: 4096 });
  let heap = new Uint8Array(memory.buffer);
  let imports = { env: { memory: memory } };

  WebAssembly.instantiateStreaming(fetch("./lib.wasm"), imports).then(function(obj) {
    // one would think that a priority for wasm 1.0 would be convenient interop with javascript typed arrays,
    // like why not allow you to just pass in an Uint8Array array as a param and have it "mmap()"
    // the array buffer for the duration of the function call to some high memory address
    // and pass it in as a pointer. But alas no, one is supposed to perform rituals like this
    obj.heap = heap;
    obj.inbuffer = heap.subarray(0,1024);
    obj.outbuffer = heap.subarray(1024,2048);
    obj.fn = obj.instance.exports;
    obj.wrap_array = function(fn, src) {
      obj.inbuffer.set(src)
      let len = fn(obj.outbuffer.byteOffset, obj.outbuffer.byteLength, obj.inbuffer.byteOffset,src.length);
      if (len < 0) {
  //      throw new Error("failed at call" + fn + ": " + len);
      }
      return new Uint8Array(obj.outbuffer.subarray(0,len));
    }
    cb(obj);
  });
}


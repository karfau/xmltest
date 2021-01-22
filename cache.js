exports.cache = () => {
  let map = new Map();

  return {
    clear: () => {
      map = new Map();
    },
    delete: (key) => map.delete(key),
    get: (key) => map.get(key),
    has: (key) => map.has(key),
    keys: () => [...map.keys()],
    set: (key, value) => {
      map.set(key, value)
    },
  };
};

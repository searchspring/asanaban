module.exports = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key, defaultValue) {
    if (this.has(key)) {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch (exception) {
        console.warn(exception);
        let value = localStorage.getItem(key);
        this.set(key, value);
        return value;
      }
    }
    if (arguments.length == 2) {
      return defaultValue;
    } else {
      throw `no entry for ${key}, and no default given`;
    }
  },
  has(key) {
    return localStorage.getItem(key) !== null;
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  },
};

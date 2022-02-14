class JsonStore {
  set(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  get<T>(key: string, defaultValue?: T): any {
    if (this.has(key)) {
      try {
        return JSON.parse(localStorage.getItem(key)!);
      } catch (exception) {
        console.warn(exception);
        const value = localStorage.getItem(key);
        this.set(key, value);
        return value;
      }
    }
    if (defaultValue) {
      return defaultValue;
    } else {
      throw `no entry for ${key}, and no default given`;
    }
  }
  has(key: string) {
    return localStorage.getItem(key) !== null;
  }
  remove(key: string) {
    localStorage.removeItem(key);
  }
  clear() {
    localStorage.clear();
  }
};

const store = new JsonStore();

export default store;

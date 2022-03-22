type NonUndefined<T> = T extends undefined ? never : T;

class JsonStore {
  set<T>(key: string, value: NonUndefined<T>) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  get<T>(key: string, defaultValue?: T): any {
    if (this.has(key)) {
      return JSON.parse(localStorage.getItem(key)!);
    }
    if (arguments.length === 2) {
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

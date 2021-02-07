module.exports = {
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value))
    },
    get(key, defaultValue) {
        if (this.has(key)) {
            try {
                return JSON.parse(localStorage.getItem(key))
            } catch (exception) {
                console.warn(exception)
                // do nothing, bad json value in storage.
            }
        }
        if (defaultValue) {
            return defaultValue
        } else {
            throw `no entry for ${key}, and no default given`
        }
    },
    has(key) {

        if (localStorage.getItem(key) !== null) {
            try {
                JSON.parse(localStorage.getItem(key))
                return true
            } catch (exception) {
                return false
            }
        }
        return false
    },
    remove(key) {
        localStorage.removeItem(key)
    },
    clear() {
        localStorage.clear()
    }
}
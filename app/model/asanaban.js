const m = require('mithril')
const jsonstore = require('../utils/jsonstore')
const Asana = require('./asana')

const Asanaban = {
    backgroundImage: '',
    statusTimeout: null,
    initFromStorage() {
        if (jsonstore.has('backgroundImage')) {
            this.setBackgroundImage(jsonstore.get('backgroundImage'))
        }
    },
    async setBackgroundImage(backgroundImage) {
        jsonstore.set('backgroundImage', backgroundImage)
        this.backgroundImage = backgroundImage
        document.body.style.backgroundImage = `url('${this.backgroundImage}')`
        document.body.style.backgroundSize = 'cover'
    },
    setStatus(color, text, append) {
        let el = document.getElementById('status')
        el.classList.remove('text-yellow-900', 'text-green-900', 'text-red-900', 'hidden', 'bg-yellow-300', 'bg-green-300', 'bg-red-300')
        el.classList.add(`text-${color}-900`, `bg-${color}-300`)
        el.innerHTML = append ? el.innerHTML + text : text
        this.disolveStatus(3000)
    },
    disolveStatus(timeout) {
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout)
        }
        if (document.getElementById('status').classList.contains('text-green-900')) {
            this.statusTimeout = self.setTimeout(() => {
                document.getElementById('status').classList.add('hidden')
            }, timeout ? timeout : 1000)
        }
    },
    toggleColumn(columnName){
        let key = `collapsed-${columnName}`
        if (jsonstore.has(key)) {
            jsonstore.set(key, !jsonstore.get(key))
        } else {
            jsonstore.set(key, true)
        }
    },
    doSearch(search) {
        this.search = search
        jsonstore.set('search', this.search)
        Asana.search(this.search)
        m.redraw()
    }

}

module.exports = Asanaban
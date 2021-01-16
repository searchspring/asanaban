const m = require('mithril')
const jsonstore = require('../utils/jsonstore')

const Asanaban = {
    backgroundImage: '',
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
    }
}

module.exports = Asanaban
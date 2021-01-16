const m = require('mithril')
const Layout = require('./Layout')

module.exports = {
    view: function () {
        return m(Layout, m('.text-xl.text-bold.container', 'Home'))
    }
}
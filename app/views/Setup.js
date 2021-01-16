const m = require('mithril')
const SetupUI = require('../components/SetupUI')
const Layout = require('./Layout')

module.exports = {
    view: function () {
        return m(Layout, m(SetupUI))
    }
}
const m = require('mithril')

module.exports = {
    view: function (vnode) {
        return m('', vnode.children)
    }
}
const m = require('mithril')
const Asana = require('../model/asana')
const Tagify = require('@yaireo/tagify')

const Tags = {
    oncreate(vnode) {
        let whitelist = []
        for (let tag of Asana.tags) {
            whitelist.push({ value: tag.name.trim(), color: tag.color, gid: tag.gid })
        }
        whitelist = whitelist.sort((a, b) => {
            return a.value.localeCompare(b.value)
        })
        console.log(whitelist);
        let tagify = new Tagify(document.getElementById('tags'), {
            whitelist: whitelist,
            dropdown: {
                enabled: 0,
                closeOnSelect: false,
                maxItems: 200,
                classname: 'tags-look'
            },
            enforceWhitelist: true,
            editTags: null
        })
        tagify.on('add', (e) => {
            vnode.attrs.onchange(`add`, e.detail.data)
        }).on('remove', (e) => {
            vnode.attrs.onchange(`remove`, e.detail.data)
        })

    },
    view(vnode) {
        return (
            <input type="text" id="tags" class="rounded h-10" />
        )
    }
}

module.exports = Tags
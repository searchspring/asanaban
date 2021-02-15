const m = require('mithril')
const Quill = require('quill')
const Asana = require('../model/asana')
require('quill-mention')

let Block = Quill.import('blots/block')
Block.tagName = 'SPAN'
Quill.register(Block, true)
var Link = Quill.import('formats/link')
class MyLink extends Link {
    static create(value) {
        let node = super.create(value)
        value = this.sanitize(value)
        node.setAttribute('href', value)
        node.removeAttribute('target')
        return node;
    }
}
Quill.register(MyLink);
let quillConfig = {
    modules: {
        toolbar: [
            ['bold', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
        ],
        mention: {
            defaultMenuOrientation: 'bottom',
            allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
            mentionDenotationChars: ["@", "#"],
            renderLoading: function (searchTerm, renderList, char) {
                return '<div class="p-4">loading...</div>'
            },
            source: async (searchTerm, renderList, char) => {
                if (char === '#') {
                    let matches = await Asana.searchAsana(searchTerm.length === 0 ? '' : searchTerm)
                    renderList(matches, searchTerm)
                } else {
                    let values = Asana.atValues;
                    if (searchTerm.length === 0) {
                        renderList(values, searchTerm);
                    } else {
                        const matches = [];
                        for (let i = 0; i < values.length; i++) {
                            if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase()) && matches.length < 5) {
                                matches.push(values[i]);
                            }
                        }
                        renderList(matches, searchTerm);
                    }
                }
            }
        }
    },
    theme: 'snow'
}

const QuillTextarea = {
    oncreate(vnode) {
        let quill = new Quill(`#${vnode.attrs.id}`, quillConfig);
        quill.root.innerHTML = vnode.attrs.value ? Asana.convertFromAsana(vnode.attrs.value) : ''
        quill.on('text-change', () => {
            vnode.attrs.onchange(Asana.convertToAsana(quill.root.innerHTML))
        })
    },
    view(vnode) {
        return (
            <div id={vnode.attrs.id} class="text-xs h-32 w-full bg-gray-300 rounded-b inline-block"></div>
        )
    }
}

module.exports = QuillTextarea 
const { render } = require('mithril')
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
        quill.root.innerHTML = vnode.attrs.value || ''
        quill.on('text-change', () => {
            vnode.attrs.onchange(QuillTextarea.convertToAsana(quill.root.innerHTML))
        })
    },
    view(vnode) {
        return (
            <div id={vnode.attrs.id} class="text-xs h-32 w-full bg-gray-300 rounded-b inline-block"></div>
        )
    },
    convertToAsana(text) {
        let regMention = /<span class="mention" data-index="[0-9]*" data-denotation-char="[@#]" data-id="([0-9]+)" data-value="[^"]*">\s*<span contenteditable="false">\s*<span class="ql-mention-denotation-char">[@#]<\/span>([^<]+)<\/span>\s*<\/span>/g
        return text.replace(regMention, '<a href="https://app.asana.com/0/$1/" data-asana-dynamic="true" data-asana-gid="$1" data-asana-accessible="true" data-asana-type="user">$2</a>')
            .replace(/<\/*span>/g, '')
            .replace(/<br>/g, '\n')
    }
}

module.exports = QuillTextarea
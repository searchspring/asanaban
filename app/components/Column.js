const m = require('mithril')
const Asana = require('../model/asana')
const Asanaban = require('../model/asanaban')
const jsonstore = require('../utils/jsonstore')
module.exports = {
    collapsed: false,
    oninit(){
    },
    view(vnode) {
        let c = vnode.attrs.column
        this.collapsed = localStorage.getItem(`collapsed-${c.sectionName}`) === 'true'
        let style = `flex-1 ml-1 ${this.collapsed ? 'collapsed':''}`
        return (
            <div class={style}>
                <a id="sectionHeader${id}" href="javascript:;" onclick={()=>{
                    Asanaban.toggleColumn(c.sectionName)
                }} class="hover:opacity-75 column-header text-white text-bold p-1 block rounded-t">
                    <div class="flex">
                        <span data-section-id="${id}" class="flex-1 text-gray-400 hover:underline hover:text-white inline-block ml-1 mr-1 pt-1 text-xs text-left">add task</span>
                        <span class="flex-1 whitespace-no-wrap">{c.sectionNameDisplay}</span>
                        <span class="flex-1 text-right">{c.maximum === 1000 ? null : <span class="ml-4 text-xs text-gray-600"><span class="count${name}">{c.count}</span> of {c.maximum}</span>}
                        {c.sectionName === 'done' || c.sectionName.startsWith('complete') || c.sectionName.startsWith('finish') ? <span data-section="${name}" class="text-gray-400 hover:underline hover:text-white inline-block mr-1 pt-1 text-xs">release</span> : null}
                        </span>
                    </div>
                </a>
                <div style="min-height:50px;" class="flex flex-wrap class${name}" id="section${id}"></div>
            </div>
        )
    }
}
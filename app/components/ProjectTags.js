const m = require('mithril')
const Asana = require('../model/asana');
const Asanaban = require('../model/asanaban');
module.exports = {
    view(vnode) {
        return (<div class="flex">
            { Object.values(Asana.projectTags).map((tag) => {
                let style = `${tag.color}`
                return <a href="javascript:;" style={style}
                    onclick={() => {
                        if (Asanaban.search === tag.name) {
                            Asanaban.doSearch('')
                        } else {
                            Asanaban.doSearch(tag.name)
                        }
                    }}
                    class="inline-block hover:border hover:border-1 hover:border-white text-center flex-1 p-1 px-1">{tag.name}</a>
            })}
        </div>
        )
    }
}

const m = require('mithril')
const Asana = require('../model/asana')
const Column = require('./Column')
module.exports = {
    view(vnode) {
        let blue = vnode.key % 2 == 0 ? 'bg-blue-800' : 'bg-blue-700'
        let classes = `${blue} opacity-90 text-white text-bold text-center p-1 py-4 rounded-r`
        return (
            <div class="flex mb-1">
                <h2 style="writing-mode: vertical-rl" className={classes}>{Asana.swimlanesDisplay[vnode.key]}</h2>
                <div class="flex-1 flex">
                    {Asana.swimlaneColumns[Asana.swimlanes[vnode.key]].map((column, index) => {
                        return <Column key={index} column={column} />
                    })}
                </div>
            </div>
        )
    }
}
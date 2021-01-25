const m = require('mithril')
const Asana = require('../model/asana')
module.exports = {
    view(vnode) {
        return (
            <select class={`${vnode.attrs.classNames}`} value={Asana.projectId} oninput={(e) => {
                vnode.attrs.callback(e.target.value)
            }}>
                {
                    Asana.projects.map((project, index) => {
                        return <option value={project.gid} id={index}>{project.name}</option>
                    })
                }
            </select>
        )
    }
}
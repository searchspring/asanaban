const m = require('mithril')
const Asana = require('../model/asana')
module.exports = {
    view(vnode) {
        let task = vnode.attrs.task
        let hasImage = task.assignee && task.assignee.photo
        let imageClasses = `${hasImage ? '' : 'hidden'} h-6 w-6 rounded-full inline-block mr-2`
        return <div style="width:50%; max-width:15rem" onclick="edit('${task.gid}')" id="task${task.gid}" class="border-1">
            <div id="taskBox${task.gid}" style="overflow:hidden" class="hover:shadow border rounded ml-1 bg-white mb-1 p-1 cursor-pointer text-center text-xxs">
                <img alt="user image" id="photo${task.gid}" class={imageClasses} src="${hasImage ? task.assignee.photo['image_60x60'] : 'images/blank.png'}" />
                <span id="taskName${task.gid}">{task.name}</span>
                <div id="taskDate${task.gid}"></div>
                <div id="taskTags${task.gid}" class="flex mt-1"></div>
            </div>
        </div>
    }
}
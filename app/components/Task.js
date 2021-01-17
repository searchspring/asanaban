const m = require('mithril')
const Asana = require('../model/asana')
const dateFns = require('date-fns')
module.exports = {
    view(vnode) {
        let task = vnode.attrs.task
        let hasImage = task.assignee && task.assignee.photo
        let imageClasses = `${hasImage ? '' : 'hidden'} h-6 w-6 rounded-full inline-block mr-2`
        let styles = this.getTaskStyles(task)
        return <div style="width:50%; max-width:15rem" onclick="edit('${task.gid}')" id="task${task.gid}" class="border-1">
            <div id="taskBox${task.gid}" style={styles.taskStyle} class={styles.taskClass}>
                <img alt="user image" id="photo${task.gid}" class={imageClasses} src="${hasImage ? task.assignee.photo['image_60x60'] : 'images/blank.png'}" />
                <span id="taskName${task.gid}">{task.name}</span>
                <div id="taskDate${task.gid}">
                    {task.due_on ? <div style="font-size:8px" class="text-left mt-1 border-t ${border}">Due Date<span class="float-right">{task.due_on}</span></div> : null}
                </div>
                <div id="taskTags${task.gid}" class="flex mt-1"></div>
            </div>
        </div>
    },
    getTaskStyles(task) {
        let lastMod = this.getCustomFieldDate(task)
        let daysSinceMove = dateFns.differenceInDays(new Date(), lastMod)
        if (daysSinceMove > 30) {
            daysSinceMove = 30
        }
        let taskBg = ''
        if (task.due_on) {
            if (dateFns.differenceInDays(dateFns.parse(task.due_on), new Date()) < 5) {
                taskBg = 'bg-red-600 text-white'
            } else {
                taskBg = 'bg-purple-600 text-white'
            }
        } 
        // if (task.tags) {
        //     let tagHtml = ''
        //     for (let tag of task.tags) {
        //         let color = convertTagColor(tag.color)
        //         tagHtml += `<div title="${tag.name}" style="${color};margin-right:1px;overflow-hidden;max-width:2rem" class="border border-1 border-white rounded-full flex-1">${tag.name.substring(0, 1).toLowerCase()}</div>`
        //         if (!$(`footer${tag.gid}`)) {
        //             $('footer').innerHTML = $('footer').innerHTML + `<a href="javascript:search('${tag.gid}')" id="footer${tag.gid}" style="${color}" class="inline-block hover:border hover:border-1 hover:border-white text-center flex-1 p-1 px-1">${tag.name}</a>`
        //         }
        //     }
        //     taskTagEl.innerHTML = tagHtml
        // }

        return {
            taskClass: `${taskBg} hover:shadow border rounded ml-1 bg-white mb-1 pt-1 px-1 cursor-pointer text-center text-xxs`,
            taskStyle: `overflow:hidden opacity:${(100 - (daysSinceMove * 2.3)) / 100}`
        }
    }, getCustomFieldDate(task) {
        if (Asana.customFieldId !== '-1') {
            for (let customField of task.custom_fields) {
                if (customField.gid = Asana.customFieldId) {
                    if (!customField.text_value || customField.text_value.trim() === '') {
                        return new Date()
                    }
                    let parsed = dateFns.parse(customField.text_value)
                    if (parsed.toString() === 'Invalid Date') {
                        return new Date()
                    }
                    return parsed
                }
            }
        }
        return new Date()
    }
}
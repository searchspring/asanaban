const m = require('mithril')
const Picker = require('vanilla-picker')
const Asana = require('../model/asana')
const x = require('../utils/xhr-with-auth')(m)
const QuillTextarea = require('./QuillTextarea')
const Tags = require('./Tags')
const taskFields = 'custom_fields.text_value,tags.name,tags.color,memberships.section.name,memberships.project.name,name,assignee.photo,assignee.name,assignee.email,due_on,modified_at,html_notes,notes,stories'
const TaskEditor = {
    open: false,
    new: true,
    taskId: null,
    task: null,
    sectionId: '',
    name: '',
    date: '',
    assignee: '',
    description: '',
    comment: '',
    comments: [],
    tagsQueue: [],
    tags: [],
    memberships: [],
    color: '',
    oncreate() {
        document.addEventListener("keydown", TaskEditor.escFunction)
    },
    onremove() {
        document.removeEventListener("keydown", TaskEditor.escFunction)
    },
    onbeforeupdate() {
        let parent = document.querySelector('#colorSelector')
        var picker = new Picker({
            parent: parent,
            alpha: false, editor: false, cancelButton: false, 
            color: TaskEditor.color
        })
        picker.onChange = (color) => {
            parent.style.background = color.rgbaString;
        };
        picker.onDone = (color) => {
            TaskEditor.color = color.hex
        }
    },
    view() {
        if (!this.open) return null
        let colorSelectorStyle = `background-color:${TaskEditor.color}`
        return (
            <div id="taskTemplate" style="top:0;overflow-y:scroll;z-index: 9999; background-color:rgba(255,255,255,0.9)" class="fixed w-full h-full">
                <div id="taskTemplateClick" style="width:40%" class="mx-auto bg-white mb-4 mt-4 p-4 rounded-lg shadow-2xl">
                    <div>
                        <div class="text-xs">name {this.new ? null : <a target="_blank" rel="noopener" href={`https://app.asana.com/0/${Asana.projectId}/${this.taskId}`} class="float-right" id="asanaLink"><img style="height:10px" class="inline-block" src="images/asana.png" /></a>} </div>
                        <div class="flex">
                            <div class="flex-grow">
                                <input value={this.name} oninput={(e) => { TaskEditor.name = e.target.value }} type="text" id="name" class="mr-1 h-8 w-full px-2 bg-gray-300 rounded inline-block" />
                            </div>
                            <div>
                                <div id="colorSelector" style={colorSelectorStyle} class="border-2 hover:border-gray-400 border-gray-500 rounded cursor-pointer flex-initial ml-2 mt-1 w-4 h-6 inline-block">&nbsp;</div>
                            </div>
                        </div>
                    </div>
                    <div class="flex mt-1">
                        <div class="flex-grow">
                            <div class="text-xs">assignee</div>
                            <div class="flex">
                                <img alt="user image" id="userImage" class="h-8 w-8 rounded-full" src="images/head.png" />
                                <select value={this.assignee}
                                    onchange={(e) => {
                                        TaskEditor.assignee = e.target.value
                                    }}
                                    class="text-xs ml-1 h-8 w-full px-2 bg-gray-300 rounded inline-block">
                                    <option value="">Unassigned</option>
                                    {Asana.usersInTasks.map((user) => {
                                        return <option value={`${user.gid}`}>{user.name}</option>
                                    })}
                                </select>
                            </div>
                        </div>
                        <div class="ml-2 flex-none">
                            <div class="text-xs">due date</div>
                            <input value={this.date} oninput={(e) => { TaskEditor.date = e.target.value }} type="date" id="date" class="mr-1 h-8 w-full px-2 text-sm bg-gray-300 rounded inline-block" />
                        </div>
                    </div>
                    <div class="mt-1">
                        <div class="text-xs">description</div>
                        <QuillTextarea id="description" value={this.description} onchange={(value) => {
                            TaskEditor.description = value
                        }} />
                        <div class="text-right text-xxs text-gray-400">use @ to mention people, use # to search for tasks</div>
                    </div>
                    <div class="mt-1">
                        <div class="text-xs">tags</div>
                        <Tags tags={this.tags} onchange={(method, tag) => {
                            TaskEditor.addTagsQueue(method, tag)
                        }} value={this.tags} />
                    </div>
                    {
                        !TaskEditor.new ?
                            <div>
                                <div id="comments" class="mt-2">
                                    {TaskEditor.comments.map((story) => {
                                        return <div>
                                            <div class="clear-fix">
                                                <span class="inline-block float-right p-1 px-2 text-gray-600 text-xs">{story.created_at.substring(0, 10)}</span>
                                            </div>
                                            <div class="comment w-full bg-gray-200 mb-1 p-1 px-2 rounded-lg text-xs">
                                                {story.created_by.name} says: {m.trust(story.html_text)}
                                            </div>
                                        </div>
                                    })}
                                </div>
                                <div id="newCommentHolder" class="mt-2">
                                    <div class="text-xs">new comment</div>

                                    <QuillTextarea value={TaskEditor.comment} id="comment" onchange={(value) => {
                                        TaskEditor.comment = value
                                    }} />
                                </div>
                            </div>
                            : null
                    }
                    <div class="clearfix mt-4 flex">
                        <div>
                            <a href="javascript:;" onclick={() => { TaskEditor.open = false }} id="cancel" class="hover:bg-gray-500 rounded-lg bg-gray-300 p-1 px-2 inline-block">cancel</a>
                        </div>
                        <div class="m-auto">
                            <div id="editButtons">
                                <a href="javascript:;" onclick={TaskEditor.deleteTask} class="hover:underline text-sm text-red-600 border border-gray-300 rounded-full p-1 px-2 inline-block">delete</a>
                                <a href="javascript:;" onclick={TaskEditor.completeTask} class="ml-6 hover:underline text-sm text-gray-600 border border-gray-300 rounded-full p-1 px-2 inline-block">complete</a>
                            </div>
                        </div>
                        <div>
                            <a href="javascript:;" onclick={this.save} class="hover:bg-gray-700 rounded-lg bg-gray-500 p-1 px-2 float-right inline-block">save</a>
                        </div>
                    </div>
                </div >
            </div >
        )
    },
    openNewTaskEditor(sectionId) {
        TaskEditor.open = true
        TaskEditor.new = true
        TaskEditor.sectionId = sectionId
        TaskEditor.tags = []
        TaskEditor.tagsQueue = []
        TaskEditor.comment = ''
        TaskEditor.name = ''
        TaskEditor.description = ''
        TaskEditor.memberships = [{
            project: { gid: Asana.projectId },
            section: Asana.sections[sectionId]
        }]
    },
    openEditTaskEditor(task, sectionId) {
        TaskEditor.open = true
        TaskEditor.new = false
        TaskEditor.taskId = task.gid
        TaskEditor.task = task
        TaskEditor.sectionId = sectionId
        TaskEditor.assignee = task.assignee ? task.assignee.gid : ''
        TaskEditor.name = task.name
        TaskEditor.date = task.due_on
        TaskEditor.description = task.html_notes === '<body></body>' ? '' : task.html_notes
        TaskEditor.tags = task.tags
        TaskEditor.tagsQueue = []
        TaskEditor.comment = ''
        TaskEditor.memberships = task.memberships
        TaskEditor.color = task.custom_fields[1].text_value
        let fields = `html_text,created_by.name,resource_subtype,type,created_at`
        x.request({ url: `https://app.asana.com/api/1.0/tasks/${TaskEditor.taskId}/stories?opt_fields=${fields}` }).then((response) => {
            TaskEditor.comments = response.data.filter((story) => {
                return story['resource_subtype'] === 'comment_added'
            })
        })
    },
    addTagsQueue(method, tag) {
        TaskEditor.tagsQueue.push({ method: method, tag: tag })
    },
    save() {
        if (TaskEditor.new) {
            TaskEditor.saveNew()
        } else {
            TaskEditor.saveEdit()
        }
        TaskEditor.open = false
    },
    saveEdit() {
        TaskEditor.debounceTags(TaskEditor.tagsQueue).map((tag) => {
            Asana.addProjectTag({ name: tag.value, color: tag.color, gid: tag.gid })
        })
        for (let tag of TaskEditor.tagsQueue) {
            Asana.queue.push({
                method: 'POST',
                url: `https://app.asana.com/api/1.0/tasks/${TaskEditor.taskId}/` + tag.method + 'Tag',
                body: {
                    'data': {
                        'tag': `${tag.tag.gid}`
                    }
                },
                message: `${tag.method} ${tag.tag.value}`,
                callback: (response) => {
                    console.info(response)
                }
            })
        }
        let rawComment = TaskEditor.comment
        if (rawComment.replace(/<br>/g, '').trim() !== '') {
            Asana.queue.push({
                method: `POST`,
                url: `https://app.asana.com/api/1.0/tasks/${TaskEditor.taskId}/stories`,
                body: {
                    'data': {
                        "html_text": '<body>' + rawComment + '</body>'
                    }
                },
                message: `adding comment ${TaskEditor.taskId}`,
                callback: (response) => {
                    console.info(response)
                }
            })
        }
        Asana.updateCustomFields(TaskEditor.taskId, TaskEditor.color)
        let localTask = TaskEditor.task
        Asana.queue.push({
            method: 'PUT',
            url: `https://app.asana.com/api/1.0/tasks/${TaskEditor.taskId}?opt_fields=${taskFields}`,
            body: {
                'data': {
                    'assignee': TaskEditor.assignee || null,
                    'name': TaskEditor.name,
                    'html_notes': '<body>' + TaskEditor.description + '</body>',
                    'due_on': TaskEditor.date,
                }
            },
            message: `updating ${TaskEditor.taskId}`,
            callback: (response) => {
                Object.assign(localTask, response.data)
                Asana.tasks[response.data.gid] = localTask
                Asana.rejiggerFields(Asana.tasks[response.data.gid])
            }
        })

    },
    saveNew() {
        let tagsToAdd = TaskEditor.debounceTags(TaskEditor.tagsQueue)

        let tagList = tagsToAdd.map((tag) => {
            Asana.addProjectTag({ name: tag.value, color: tag.color, gid: tag.gid })
            return tag.gid
        })
        let localMemberships = TaskEditor.memberships
        let localSectionId = TaskEditor.sectionId
        Asana.queue.push({
            method: 'POST',
            url: `https://app.asana.com/api/1.0/tasks?opt_fields=${taskFields}`,
            body: {
                'data': {
                    'assignee': TaskEditor.assignee || null,
                    'name': TaskEditor.name,
                    'html_notes': '<body>' + TaskEditor.description + '</body>',
                    'due_on': TaskEditor.date,
                    'projects': [`${Asana.projectId}`],
                    'tags': tagList
                }
            },
            message: `creating new task`,
            callback: (response) => {
                let rt = response.data
                rt.memberships = localMemberships
                let ss = Asana.getSectionAndSwimlane(Asana.sections[localSectionId])
                Asana.tasks[rt.gid] = rt
                if (!Asana.columnTasks[localSectionId]) {
                    Asana.columnTasks[localSectionId] = []
                }
                Asana.columnTasks[localSectionId].push(rt)
                Asana.sectionMeta[ss.sectionName].count++
                Asana.queue.push({
                    method: 'POST',
                    url: `https://app.asana.com/api/1.0/sections/${localSectionId}/addTask`,
                    body: {
                        "data": {
                            "task": rt.gid
                        }
                    },
                    message: `moving new task to section ${rt.gid}`,
                    callback: () => {
                        // do nothing
                    }
                })
                Asana.rejiggerFields(rt)
                Asana.updateCustomFields(rt.gid, TaskEditor.color)
            }
        })
    },
    debounceTags(tags) {
        return tags.filter(item => { return item.method === 'add' }).map((item) => { return item.tag })
    },
    deleteTask() {
        let confirmed = confirm('Are you sure? There is no undo!')
        if (confirmed) {
            Asana.queue.push({
                method: 'DELETE',
                url: `https://app.asana.com/api/1.0/tasks/${TaskEditor.taskId}`,
                message: `deleting ${TaskEditor.taskId}`,
                callback: () => {
                    // do nothing
                }
            })
            TaskEditor.removeFromView()
            TaskEditor.open = false
        }
    },
    completeTask() {
        Asana.queue.push({
            method: 'PUT',
            url: `https://app.asana.com/api/1.0/tasks/${TaskEditor.taskId}`,
            body: {
                'data': {
                    'completed': true
                }
            },
            message: `completing ${TaskEditor.taskId}`,
            callback: (response) => {
                // do nothing
            }
        })

        TaskEditor.removeFromView()
        TaskEditor.open = false
    },
    escFunction(e) {
        if (e.key === "Escape") {
            TaskEditor.open = false
            m.redraw()
        }
    },
    removeFromView() {
        let ss = Asana.getSectionAndSwimlane(Asana.sections[TaskEditor.sectionId])
        delete Asana.tasks[TaskEditor.taskId]
        Asana.sectionMeta[ss.sectionName].count--
        Asana.columnTasks[TaskEditor.sectionId] = Asana.columnTasks[TaskEditor.sectionId].filter(e => e.gid !== TaskEditor.taskId)
    }
}

module.exports = TaskEditor
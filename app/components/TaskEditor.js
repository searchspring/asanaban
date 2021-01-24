const m = require('mithril')
const Asana = require('../model/asana')
const QuillTextarea = require('./QuillTextarea')
const Tags = require('./Tags')

const TaskEditor = {
    open: false,
    new: true,
    taskId: null,
    sectionId: '1149690437186601',
    name: 'test',
    date: '2021-12-12',
    assignee: '1140147937013713',
    description: 'TEST',
    comment: 'my comment',
    tagsQueue: [],
    memberships: [],
    view() {
        if (!this.open) return null
        return (
            <div id="taskTemplate" style="top:0;overflow-y:scroll;z-index: 9999; background-color:rgba(255,255,255,0.9)" class="absolute w-full h-full">
                <div id="taskTemplateClick" style="width:40%" class="mx-auto bg-white mb-4 mt-4 p-4 rounded-lg shadow-2xl">
                    <div>
                        <div class="text-xs">name {this.new ? null : <a target="_blank" href="" class="float-right" id="asanaLink"><img style="height:10px" class="inline-block" src="images/asana.png" /></a>} </div>
                        <input value={this.name} oninput={(e) => { this.name = e.target.value }} type="text" id="name" class="mr-1 h-8 w-full px-2 bg-gray-300 rounded inline-block" />
                    </div>
                    <div class="flex mt-1">
                        <div class="flex-grow">
                            <div class="text-xs">assignee</div>
                            <div class="flex">
                                <img alt="user image" id="userImage" class="h-8 w-8 rounded-full" src="images/head.png" />
                                <select value={`${this.assignee}`}
                                    onchange={(e) => {
                                        TaskEditor.assignee = e.target.value
                                    }}
                                    class="text-xs ml-1 h-8 w-full px-2 bg-gray-300 rounded inline-block">
                                    <option value="no value">please select</option>
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
                    </div>
                    <div class="mt-1">
                        <div class="text-xs">tags</div>
                        <Tags onchange={(method, tag) => {
                            TaskEditor.addTagsQueue(method, tag)
                        }} value={this.tags} />
                    </div>
                    <div id="comments" class="mt-2"></div>
                    <div id="newCommentHolder" class="mt-2">
                        <div class="text-xs">new comment</div>

                        <QuillTextarea id="comment" onchange={(value) => {
                            TaskEditor.comment = value
                        }} />
                    </div>
                    <div class="clearfix mt-4 flex">
                        <div>
                            <a href="javascript:;" onclick={() => { TaskEditor.open = false }} id="cancel" class="hover:bg-gray-500 rounded-lg bg-gray-300 p-1 px-2 inline-block">cancel</a>
                        </div>
                        <div class="m-auto">
                            <div id="editButtons">
                                <a href="javascript:deleteTask()" id="delete" class="hover:underline text-sm text-red-600 border border-gray-300 rounded-full p-1 px-2 inline-block">delete</a>
                                <a href="javascript:complete()" id="complete" class="ml-6 hover:underline text-sm text-gray-600 border border-gray-300 rounded-full p-1 px-2 inline-block">complete</a>
                            </div>
                        </div>
                        <div>
                            <a href="javascript:;" onclick={this.save} class="hover:bg-gray-700 rounded-lg bg-gray-500 p-1 px-2 float-right inline-block">save</a>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    openNewTaskEditor(sectionId) {
        TaskEditor.open = true
        TaskEditor.new = true
        TaskEditor.sectionId = sectionId
        TaskEditor.tags = []
        TaskEditor.tagsQueue = []
        TaskEditor.memberships = [{
            project: { gid: Asana.projectId },
            section: Asana.sections[sectionId]
        }]
    },
    addTagsQueue(method, tag) {
        TaskEditor.tagsQueue.push({ method: method, tag: tag })
    },
    save() {
        if (TaskEditor.new) {
            let tagsToAdd = TaskEditor.debounceTags(TaskEditor.tagsQueue)

            let tagList = tagsToAdd.map((tag) => {
                Asana.addProjectTag({ name: tag.value, color: tag.color, gid: tag.gid })
                return tag.gid
            })
            TaskEditor.open = false
            let taskFields = 'custom_fields,tags.name,tags.color,memberships.section.name,memberships.project.name,name,assignee.photo,assignee.name,assignee.email,due_on,modified_at,html_notes,notes,stories'
            Asana.queue.push({
                method: 'POST',
                url: `https://app.asana.com/api/1.0/tasks?opt_fields=${taskFields}`,
                body: {
                    'data': {
                        'assignee': TaskEditor.assignee,
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
                    rt.memberships = TaskEditor.memberships
                    let ss = Asana.getSectionAndSwimlane(Asana.sections[TaskEditor.sectionId])
                    Asana.tasks[rt.gid] = rt
                    Asana.tasksOrder.push(rt.gid)
                    if (!Asana.columnTasks[TaskEditor.sectionId]) {
                        Asana.columnTasks[TaskEditor.sectionId] = []
                    }
                    Asana.columnTasks[TaskEditor.sectionId].push(rt)
                    Asana.sectionMeta[ss.sectionName].count++
                    Asana.queue.push({
                        method: 'POST',
                        url: `https://app.asana.com/api/1.0/sections/${TaskEditor.sectionId}/addTask`,
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
                }
            })
        }
    },
    debounceTags(tags) {
        return tags.filter(item => { return item.method === 'add' }).map((item) => { return item.tag })
    }
}

module.exports = TaskEditor
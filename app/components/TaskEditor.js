const m = require('mithril')
const Asana = require('../model/asana')

const TaskEditor = {
    open: true,
    new: true,
    sectionId: null,
    name: 'test',
    date: '2021-12-12',
    assignee: '1140147937013713', 
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
                                    class="text-xs ml-1 h-8 w-full px-2 bg-gray-300 rounded inline-block">
                                        <option value="no value">please select</option>
                                        { Asana.usersInTasks.map((user)=>{
                                            return <option value={`${user.gid}`}>{user.name}</option>
                                        })}
                                    </select>
                            </div>
                        </div>
                        <div class="ml-2 flex-none">
                            <div class="text-xs">due date</div>
                            <input value={this.date} oninput={(e) => { this.date = e.target.value }} type="date" id="date" class="mr-1 h-8 w-full px-2 text-sm bg-gray-300 rounded inline-block" />
                        </div>
                    </div>
                    <div class="mt-1">
                        <div class="text-xs">description</div>
                        <div id="description" class="text-xs h-32 w-full bg-gray-300 rounded inline-block"></div>
                    </div>
                    <div class="mt-1">
                        <div class="text-xs">tags</div>
                        <input type="text" id="tags" class="rounded h-10" />
                    </div>
                    <div id="comments" class="mt-2"></div>
                    <div id="newCommentHolder" class="mt-2">
                        <div class="text-xs">new comment</div>
                        <div id="addComment" class="text-xs h-32 w-full bg-gray-300 rounded inline-block"></div>
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
                            <a href="javascript:save()" id="save" class="hover:bg-gray-700 rounded-lg bg-gray-500 p-1 px-2 float-right inline-block">save</a>
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
    }
}

module.exports = TaskEditor
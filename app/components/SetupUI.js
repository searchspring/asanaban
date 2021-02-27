const m = require('mithril')
const Asana = require('../model/asana')
const jsonstore = require('../utils/jsonstore')
const Projects = require('../components/Projects')
module.exports = {
    async oninit() {
        await Asana.initFromStorage()
        if (jsonstore.has('pat') && jsonstore.has('workspaceId')) {
            await Asana.loadAllProjects()
        }
    },
    view() {
        return (
            <div id="starting" style="top:0;overflow-y:scroll;" class="absolute w-full h-full">
                <div style="width:80%" class="mx-auto bg-white mb-4 mt-4 p-4 rounded-lg shadow">
                    <div class="text-2xl">Getting Started</div>
                    <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-4">Step 1</div>
                    <div class="clearfix"> Get your Asana workspace gid by clicking <a target="_blank" class="text-blue-500 underline"
                        href="https://app.asana.com/api/1.0/workspaces">here</a>
                        <input placeholder="workspace id" id="workspaceId" type="text"
                            onchange={this.storeWorkspaceId} value={Asana.workspaceId} oninput={(e) => { Asana.setWorkspaceId(e.target.value) }}
                            class="float-right w-3/5 px-4 text-blue-500 border rounded-full inline-block" />
                    </div>
                    <div class="flex">
                        <div class="flex-1">
                            <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-8">Step 2</div>
                            <div> Create a new Asana project with the following named sections:
                            <ul class="ml-4 mt-2 text-blue-500">
                                    <li>Unscheduled:Backlog</li>
                                    <li>Unscheduled:In progress|3</li>
                                    <li>Unscheduled:Done</li>
                                </ul>
                            </div>
                        </div>
                        <div class="flex-1 ml-8">
                            <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-8">Step 3</div>
                            <div class="pr-16 mb-8">Click to the following page <a target="_blank" class="text-blue-500 underline"
                                href="https://app.asana.com/0/developer-console">Asana
                                Developer Console</a>.
                            And create a new token.
                            <img alt="helper image" class="shadow-xl rounded-lg border-gray-300 border-2 inline-block mt-8" src="images/pat1.png" />
                            </div>
                        </div>
                    </div>
                    <div class="flex">
                        <div class="flex-1">
                            <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-8">Step 4</div>
                            <div class="clearfix"> Enter your token here
                    <input placeholder="personal access token" id="pat" type="text"
                                    value={Asana.pat} oninput={(e) => { Asana.setPat(e.target.value); Asana.loadAllProjects() }}
                                    class="float-right w-3/5 px-4 text-blue-500 border rounded-full inline-block" />
                                <div id="patError" class="hidden text-xs block text-red-600"></div>
                            </div>
                        </div>
                        <div class="flex-1 ml-8">
                            <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-8">Step 5 {Asana.loadingProjects ? <span class="mt-1 float-right mr-2 text-sm">loading...</span> : null}</div>
                            <div>Select the name of your project.
                                    <Projects classNames="float-right w-3/5 px-4 text-blue-500 border rounded-full inline-block" callback={(projectId) => {
                                    Asana.setProjectId(projectId)
                                }} />
                            </div>
                        </div>
                    </div>
                    <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-8">Step 6</div>
                    <div class="mb-8">Hit go
                    {!this.showGo() ? '' :
                            <a class="focus:bg-blue-600 focus:outline-none float-right w-64 text-center hover:bg-blue-600 bg-blue-500 text-blue-100 px-4 py-2 rounded-full inline-block"
                                href="javascript:;" onclick={this.go}>Go</a>}
                        <span class="block text-gray-500 text-xs">What
                        happens when you click go?</span>
                        <div id="explain" class="text-gray-600 text-xs">
                            <ul>
                                <li>
                                    1. The system checks if you have a custom fields called "column-change" or "color" and creates
                                    them if they don't exist - this will only happen for the paid version of Asana.  Then the custom
                                    fields "column-change" and "colorz' are added to the selected project.
                                </li>
                                <li>2. The project is loaded in to the Kanban view and no other changes happen until you start editing tasks.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>)
    },
    showGo() {
        return jsonstore.has('pat') &&
            jsonstore.get('pat') !== '' &&
            jsonstore.has('workspaceId') &&
            jsonstore.get('workspaceId') !== '' &&
            jsonstore.has('projectId') &&
            jsonstore.get('projectId') !== '-1' &&
            jsonstore.get('projectId') !== ''
    },
    async go() {
        await Asana.setupProject()
        m.route.set('/')
    }
}
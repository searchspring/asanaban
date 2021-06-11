const m = require('mithril')
const Background = require('../components/Background')
const Projects = require('../components/Projects')
const Swimlane = require('../components/Swimlane')
const Asana = require('../model/asana')
const Asanaban = require('../model/asanaban')
const jsonstore = require('../utils/jsonstore')
const ProjectTags = require('../components/ProjectTags')
const Status = require('../components/Status')
const TaskEditor = require('../components/TaskEditor')

module.exports = {
    async oninit() {
        Asana.initFromStorage()
        Asanaban.initFromStorage()
        await Asana.loadTags(!Asana.testing)
    },
    async oncreate() {
        Status.set('green', 'loading...')
        await Asana.loadAllProjects()
        this.loadData(true)
        Asana.startSyncLoops()
        m.redraw()
    },
    async loadData(withCache) {
        Status.set('green', 'loading... sections')
        await Asana.loadSections(withCache)
        Status.set('green', ` loading... tasks`)
        await Asana.loadTasks(withCache)
        if (jsonstore.has('search')) {
            Asanaban.doSearch(jsonstore.get('search'))
        }
        Status.set('green', `loading... users`)
        Asana.loadUsers(!Asana.testing)
        Asanaban.setupDragula()

    },
    view() {
        //Asana.printColInfo()
        return (
            <div>
                <TaskEditor />
                <div class="p-1 flex title-bar mb-1 rounded-b shadow">
                    <div>
                        <img alt="logo" class="h-8 inline-block" style="filter:grayscale(100%) brightness(40%)" src="images/icon.png" />
                    </div>
                    <div>
                        <input id="search" class="h-8 ml-2 w-64 px-2 bg-gray-300 rounded-full inline-block" type="text" placeholder="search"
                            oninput={(e) => { Asanaban.doSearch(e.target.value) }} value={Asanaban.search} />
                    </div>
                    <div>
                        <div id="status" class="hidden ml-10 float-right rounded-full px-4 py-1"></div>
                    </div>
                    <div class="flex-grow">
                        <Background />
                        <Projects
                            callback={(projectId) => {
                                Asana.setProjectId(projectId)
                                this.loadData(false)
                            }}
                            classNames="mr-4 mt-1 float-right px-4 border-gray-500 text-gray-800 border rounded-full inline-block" />
                    </div>
                </div>
                <div id="wrapper" class="pb-10">
                    {
                        Asana.swimlanes.map((swimlaneName, index) => {
                            return <Swimlane key={index} swimlaneName={swimlaneName} />
                        })
                    }
                </div>
                <ProjectTags />
            </div>
        )
    }
}
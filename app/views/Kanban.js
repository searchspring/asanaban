const m = require('mithril')
const Background = require('../components/Background')
const Projects = require('../components/Projects')
const Section = require('../components/Column')
const Swimlane = require('../components/Swimlane')
const Asana = require('../model/asana')
const Asanaban = require('../model/asanaban')
const jsonstore = require('../utils/jsonstore')

module.exports = {
    search: '',
    oninit() {
        Asana.initFromStorage()
        Asanaban.initFromStorage()
        this.search = jsonstore.has('search') ? jsonstore.get('search') : ''
    },
    async oncreate() {
        Asanaban.setStatus('green', 'loading...')
        await Asana.loadAllProjects()
        Asanaban.setStatus('green', 'loading... sections')
        await Asana.loadSections()
        Asanaban.setStatus('green', ` loading... tasks`)
        await Asana.loadTasks()
        m.redraw()
    },
    view: function () {
        return (
            <div>
                <div class="p-1 flex title-bar mb-1 rounded-b shadow">
                    <div>
                        <img alt="logo" class="h-8 inline-block" style="filter:grayscale(100%) brightness(40%)" src="images/icon.png" />
                    </div>
                    <div>
                        <input id="search" class="h-8 ml-2 w-64 px-2 bg-gray-300 rounded-full inline-block" type="text" placeholder="search"
                        oninput={(e) => { this.doSearch(e.target.value) }} value={this.search} />
                    </div>
                    <div>
                        <div id="status" class="hidden ml-10 float-right rounded-full px-4 py-1"></div>
                    </div>
                    <div class="flex-grow">
                        <Background />
                        <Projects classNames="mr-4 mt-1 float-right px-4 border-gray-500 text-gray-800 border rounded-full inline-block" />
                    </div>
                </div>
                <div id="wrapper" class="mb-10">
                    {
                        Asana.swimlanes.map((swimlaneName, index) => {
                            return <Swimlane key={index} swimlaneName={swimlaneName} />
                        })
                    }
                </div>
            </div>
        )
    },
    doSearch(search){
        this.search = search
        jsonstore.set('search', this.search)
        Asasa.search(this.search)
    }
}
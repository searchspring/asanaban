const m = require('mithril')
const Background = require('../components/Background')
const Projects = require('../components/Projects')
const Asana = require('../model/asana')
const Asanaban = require('../model/asanaban')

module.exports = {
    oninit() {
        Asana.initFromStorage()
        Asanaban.initFromStorage()
    },
    async oncreate() {
        Asanaban.setStatus('green', 'loading...')
        await Asana.loadAllProjects()
        m.redraw()
    },
    view: function () {
        return (
            <div class="p-1 flex title-bar mb-1">
                <div>
                    <img alt="logo" class="h-8 inline-block" src="images/icon.png" />
                </div>
                <div>
                    <input id="search" class="h-8 ml-2 w-64 px-2 bg-gray-300 rounded-full inline-block" type="text"
                        placeholder="search" />
                </div>
                <div>
                    <div id="status" class="hidden ml-10 float-right rounded-full px-4 py-1"></div>
                </div>
                <div class="flex-grow">
                    <Background />
                    <Projects classNames="mr-4 mt-1 float-right px-4 border-gray-500 text-gray-800 border rounded-full inline-block" />
                </div>
            </div>
        )
    }
}
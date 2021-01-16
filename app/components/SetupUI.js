const m = require('mithril')

module.exports = {
    view() {
        return (
            <div>hello</div>
        )
        // return m('', 
        //         m.trust(`<div id="starting" style="top:0;overflow-y:scroll;" class="absolute w-full h-full">
        //     <div style="width:80%" class="mx-auto bg-white mb-4 mt-4 p-4 rounded-lg shadow">
        //         <div class="text-2xl">Getting Started</div>
        //         <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-4">1</div>
        //         <div class="clearfix"> Get your workspace gid by clicking <a target="_blank" class="text-blue-500 underline"
        //                 href="https://app.asana.com/api/1.0/workspaces">here</a>
        //             <input placeholder="workspace id" id="workspaceId" type="text"
        //                 class="float-right w-3/5 px-4 border-blue-500 text-blue-500 border rounded-full inline-block">
        //         </div>
        //         <div class="flex">
        //             <div class="flex-1">
        //                 <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-4">2</div>
        //                 <div> Create a new Asana project with the following named sections:
        //                     <ul class="ml-4 mt-2 text-blue-500">
        //                         <li>Unscheduled:Backlog</li>
        //                         <li>Unscheduled:In progress|3</li>
        //                         <li>Unscheduled:Done</li>
        //                     </ul>
        //                 </div>
        //             </div>
        //             <div class="flex-1 ml-8">
        //                 <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-4">3</div>
        //                 <div>Click to the following page <a target="_blank" class="text-blue-500 underline"
        //                         href="https://app.asana.com/0/developer-console">Asana
        //                         Developer Console</a>.
        //                     And create a new token.
        //                     <img alt="helper image" class="shadow inline-block mt-2" src="images/pat1.png">
        //                 </div>
        //             </div>
        //         </div>
        //         <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-4">4</div>
        //         <div class="clearfix"> Enter your token here
        //             <input onchange="newPat()" placeholder="personal access token" id="pat" type="text"
        //                 class="float-right w-3/5 px-4 border-blue-500 text-blue-500 border rounded-full inline-block">
        //             <div id="patError" class="hidden text-xs block text-red-600"></div>
        //         </div>
        //         <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-4">5</div>
        //         <div>Select the name of your project.
        //             <select class="float-right w-3/5 px-4 border-blue-500 text-blue-500 border rounded-full inline-block"
        //                 id="newProjects"></select>
        //         </div>
        //         <div class="block bg-gray-300 rounded-full text-xl bold pl-4 mb-2 mt-4">6</div>
        //         <div class="mb-8">Hit go
        //             <a class="float-right hover:bg-blue-600 bg-blue-500 text-blue-100 px-4 py-2 rounded-full inline-block"
        //                 href="javascript:go()">Go</a>
        //             <a href="javascript:$('explain').classList.remove('hidden')" class="block text-gray-500 text-xs">What
        //                 happens when I click go?</a>
        //             <div id="explain" class="hidden text-gray-600 text-xs">
        //                 <ul>
        //                     <li>1. The system checks if you have a custom field called "column-change" and creates
        //                         it if it
        //                         doesn't exist.</li>
        //                     <li>2. The custom field "column-change" is added to the selected project.</li>
        //                     <li>3. The project is loaded in to the Kanban view and no other changes happen until you
        //                         start
        //                         editing tasks. </li>
        //                 </ul>
        //             </div>
        //         </div>
        //     </div>
        // </div>`))
    }
}
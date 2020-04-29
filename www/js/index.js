let projectId = null
let workspaceId = null
let customFieldId = null

let $ = function (id) { return document.getElementById(id) }
let $c = function (classname) { return document.getElementsByClassName(classname) }
let sectionIds = []
let model = {
    sections: {},
    sectionsOrder: [],
    tasks: {},
    tasksOrder: [],
    sectionMeta: {},
    users: {},
    usersOrder: [],
    atValues: []
}
let queue = []

async function start() {
    ensureCustomField()
    await loadSections()
    await loadTasks()
    await loadUsers()
    setStatus('green', `loading complete`)
    disolveStatus(3000)
    createUI()
    startSyncLoop()
}
if (loadFromCookies()) {
    start()
} else {
    setup()
}
function setup(){
    $('startingOverlay').classList.remove('hidden')
    $('starting').classList.remove('hidden')
}
function loadFromCookies(){
    projectId = Cookies.get('projectId')
    customFieldId = Cookies.get('customFieldId')
    workspaceId = Cookies.get('workspaceId')
    let pat = Cookies.get('pat')
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + pat
    return projectId && customFieldId && pat && workspaceId
}

function ensureCustomField() {
    setStatus('green', `ensuring custom field`)
    axios.post(`https://app.asana.com/api/1.0/projects/${projectId}/addCustomFieldSetting`, {
        'data': {
            'custom_field': `${customFieldId}`
        }
    }).then((response) => {
        console.info(response)
    }).catch((error) => {
        if (error.response.status === 404 || error.response.status === 403) {
            // do nothing.
        } else {
            console.error(error)
        }
    })
}
function startSyncLoop() {
    self.setTimeout(syncLoop, 1000)
}
async function syncLoop() {
    let didSomeSyncing = false
    while (queue.length > 0) {
        setStatus('yellow', `syncing ${queue.length} items`)
        let queueItem = queue[0]
        await queueItem.httpFunc(queueItem.url, queueItem.body).then(queueItem.callback)
        queue.shift()
        didSomeSyncing = true
    }
    if (didSomeSyncing) {
        setStatus('green', `sync'd`)
        disolveStatus()
    }
    self.setTimeout(syncLoop, 500)
}
function setStatus(color, text, append) {
    let el = $('status')
    el.classList.remove('text-yellow-900', 'text-green-900', 'text-red-900', 'hidden', 'bg-yellow-300', 'bg-green-300', 'bg-red-300')
    el.classList.add(`text-${color}-900`, `bg-${color}-300`)
    el.innerHTML = append ? el.innerHTML + text : text
}
function disolveStatus(timeout) {
    self.setTimeout(() => {
        $('status').classList.add('hidden')
    }, timeout ? timeout : 1000)
}
async function loadSections() {
    setStatus('green', ` loading... sections`)
    await axios.get(`https://app.asana.com/api/1.0/projects/${projectId}/sections`).then((response) => {
        for (let section of response.data.data) {
            if (section.name.toLowerCase() === '(no section)') {
                continue
            }
            let ss = getSectionAndSwimlane(section)
            if (!ss) {
                continue
            }
            if (!model.sectionMeta[ss.sectionName]) {
                model.sectionMeta[ss.sectionName] = { count: 0, maximum: ss.maximum }
            }
            model.sections[section.gid] = section
            model.sectionsOrder.push(section.gid)
        }
    })
}
async function loadUsers() {
    setStatus('green', `loading... users`)
    await axios.get(`https://app.asana.com/api/1.0/users?opt_fields=name,photo.image_60x60,resource_type,email`).then((response) => {
        let users = {}
        let userWithSearchspring = {}
        for (let user of response.data.data) {
            if (user.name.indexOf('@') !== -1) {
                continue
            }
            users[user.gid] = user
            if (user.email.indexOf("@searchspring") !== -1) {
                userWithSearchspring[user.name] = true
            }
        }
        let dedupedUsers = []
        for (let key in users) {
            let user = users[key]
            if (user.email.indexOf('@searchspring') === -1 && userWithSearchspring[user.name]) {
                continue
            }
            dedupedUsers.push(user)
        }
        for (let user of dedupedUsers) {
            model.users[user.gid] = user
            model.usersOrder.push(user)
        }
        model.usersOrder.sort((a, b) => {
            return a.name.localeCompare(b.name)
        })
        for (let user of model.usersOrder) {
            model.atValues.push({ id: user.gid, value: user.name + (user.email.indexOf('@searchspring') === -1 ? (' (' + user.email + ')') : '') })
        }
    })
}


async function loadTasks() {
    setStatus('green', ` loading... tasks`)
    let taskFields = 'custom_fields,tags.name,tags.color,memberships.section.name,memberships.project.name,name,assignee.photo,assignee.name,assignee.email,due_on,modified_at,html_notes,notes,stories'
    await axios.get(`https://app.asana.com/api/1.0/tasks?completed_since=${new Date().toISOString()}&project=${projectId}&opt_fields=${taskFields}`).then((response) => {
        for (let task of response.data.data) {
            for (let membership of task.memberships) {
                if (membership.project.gid === projectId) {
                    let ss = getSectionAndSwimlane(membership.section)
                    if (ss) {
                        model.tasks[task.gid] = task
                        model.tasksOrder.push(task.gid)
                        model.sectionMeta[ss.sectionName].count++
                    }
                }
            }
        }
        for (let key in model.tasks) {
            let task = model.tasks[key]
            if (!task.custom_fields) {
                task.custom_fields = []
            }
            if (task.memberships.length > 1) {
                task.memberships = task.memberships.sort((a, b) => {
                    if (a.project.gid === projectId) {
                        return -1
                    } else {
                        return 1
                    }
                })
            }
            task.custom_fields = task.custom_fields.sort((a, b) => {
                if (a.gid.gid === customFieldId) {
                    return -1
                } else {
                    return 1
                }
            })
            if (task.custom_fields.length === 0 || task.custom_fields[0].gid !== customFieldId) {
                task.custom_fields.splice(0, 0, {
                    gid: customFieldId,
                    text_value: ''
                });
            }


        }
    })
}

function loadStories(taskId) {
    $('comments').innerHTML = '<div class="comment w-full bg-gray-200 mb-1 p-1 px-2 rounded-lg text-xs">loading...</div>'
    $('comments').style.display = 'block'
    let fields = `html_text,created_by.name,resource_subtype,type,created_at`
    axios.get(`https://app.asana.com/api/1.0/tasks/${taskId}/stories?opt_fields=${fields}`).then((response) => {
        let html = ''
        for (let story of response.data.data) {
            if (story['resource_subtype'] === 'comment_added') {
                html += `<div class="clear-fix"><span class="inline-block float-right p-1 px-2 text-gray-600 text-xs">${story.created_at.substring(0, 10)}</span></div>
                <div class="comment w-full bg-gray-200 mb-1 p-1 px-2 rounded-lg text-xs">
                        ${story.created_by.name} says: ${story.html_text}
                    </div>`
            }
        }
        $('comments').innerHTML = html
    })
}

function createUI() {
    createSectionUi()
    createReleaseListener()
    createAddTaskListener()
    createTaskUi()
    setupSearch()
    setupTaskTemplate()
    setupDraggable()
}

let createNew = false
function createAddTaskListener() {
    for (let el of $c('add-task')) {
        el.addEventListener('click', (e) => {
            e.preventDefault()
            let sectionId = el.getAttribute('data-section-id')
            createNew = true
            newTask = {
                memberships: [{
                    project: { gid: projectId },
                    section: model.sections[sectionId]
                }],
                assignee: null,
                html_notes: '',
                name: ''
            }
            model.tasks['new'] = newTask
            edit('new')

        })
    }
}

function createReleaseListener() {
    for (let el of $c('release')) {
        el.addEventListener('click', (e) => {
            e.preventDefault()
            let sectionName = el.getAttribute('data-section')
            let count = model.sectionMeta[sectionName].count
            let confirmed = prompt(`Release ${count} task${count > 1 ? 's' : ''} and mark as complete?\n\nEnter optional comment to be posted on each task:`)
            if (confirmed !== null) {
                for (let key in model.tasks) {
                    let task = model.tasks[key]
                    if (sectionName === getSectionAndSwimlane(task.memberships[0].section).sectionName) {
                        queue.push({
                            httpFunc: axios.put,
                            url: `https://app.asana.com/api/1.0/tasks/${key}`,
                            body: {
                                "data": {
                                    "completed": true
                                }
                            },
                            callback: (response) => {
                                console.info(response)
                            }
                        })
                        let taskEl = $(`task${key}`)
                        taskEl.parentNode.removeChild(taskEl);
                        delete model.tasks[key]
                        model.tasksOrder = model.tasksOrder.filter(e => e !== key)
                        updateColumnCount(sectionName, --model.sectionMeta[sectionName].count)
                        setStatus('yellow', `syncing ${queue.length} items`)
                        if (confirmed.trim() !== '') {
                            queue.push({
                                httpFunc: axios.post,
                                url: `https://app.asana.com/api/1.0/tasks/${task.gid}/stories`,
                                body: {
                                    'data': {
                                        'html_text': '<body>Released:\n<strong>' + confirmed + '</strong></body>'
                                    }
                                },
                                callback: (response) => {
                                    console.info(response)
                                }
                            })
                        }
                    }
                }
            }
        })
    }
}

function setupSearch() {
    $('search').addEventListener('keyup', (e) => {
        let searchValue = $('search').value.toLowerCase()
        let highlight = {}
        for (let key in model.tasks) {
            if (searchValue.trim() !== '' && model.tasks[key].name.toLowerCase().indexOf(searchValue) !== -1) {
                highlight[key] = true
            }
        }
        for (let key in model.tasks) {
            if (!highlight[key]) {
                $(`task${key}`).classList.remove('highlight')
            }
        }
        for (let taskId in highlight) {
            $(`task${taskId}`).classList.add('highlight')
        }
    })
}
function setupDraggable() {
    let drags = []
    for (let sectionId of sectionIds) {
        drags.push($(`section${sectionId}`))
    }
    dragula(drags).on('drop', function (el, target, source, sibling) {
        emitMovementEvent(el, target, source, sibling)
    });
}

function emitMovementEvent(el, target, source, sibling) {
    let taskId = el.getAttribute('id').substring(4)
    let siblingTaskId = sibling === null ? null : sibling.getAttribute('id').substring(4)
    let targetSectionId = target.getAttribute('id').substring(7)
    let sourceSectionId = source.getAttribute('id').substring(7)
    let sourceSection = model.sections[sourceSectionId]
    let sourceSectionName = getSectionAndSwimlane(sourceSection).sectionName
    model.sectionMeta[sourceSectionName].count--
    let targetSection = model.sections[targetSectionId]
    let targetSectionName = getSectionAndSwimlane(targetSection).sectionName
    model.sectionMeta[targetSectionName].count++
    let task = model.tasks[taskId]
    task.memberships[0].section = targetSection
    updateColumnCount(sourceSectionName, model.sectionMeta[sourceSectionName].count)
    updateColumnCount(targetSectionName, model.sectionMeta[targetSectionName].count)
    emitAsanaMovementSync(targetSectionId, taskId, siblingTaskId)
}
function emitAsanaMovementSync(sectionId, taskId, siblingTaskId) {
    queue.push({
        httpFunc: axios.post,
        url: `https://app.asana.com/api/1.0/sections/${sectionId}/addTask`,
        body: {
            "data": {
                "task": taskId,
                "insert_before": siblingTaskId,
            }
        },
        callback: (response) => {
            console.info(response)
        }
    })
    let customFieldBody = {
        'data': {
            "custom_fields": {

            },
        }
    }
    customFieldBody.data.custom_fields[`${customFieldId}`] = new Date().toISOString()
    model.tasks[taskId].custom_fields[0].text_value = new Date().toISOString()
    setTaskColor(model.tasks[taskId])
    queue.push({
        httpFunc: axios.put,
        url: `https://app.asana.com/api/1.0/tasks/${taskId}`,
        body: customFieldBody,
        callback: (response) => {
            console.info(response)
        }
    })
    setStatus('yellow', `syncing ${queue.length} items`)
}

function updateColumnCount(sourceSectionName, sourceCount) {
    for (let el of $c(`count${sourceSectionName}`)) {
        el.innerHTML = sourceCount
    }

    for (let el of $c(`class${sourceSectionName}`)) {
        setColumnColor(el.getAttribute('id').substring(7))
    }

}
function createSectionUi() {
    let htmlSwimlanes = {}
    let row = 0
    let newRow = false;
    for (let sectionId of model.sectionsOrder) {
        let section = model.sections[sectionId]

        let ss = getSectionAndSwimlane(section)
        if (ss) {
            if (!htmlSwimlanes[ss.swimlaneName]) {
                htmlSwimlanes[ss.swimlaneName] = ''
                row++
                newRow = true
            }
            htmlSwimlanes[ss.swimlaneName] += createColumn(ss.sectionNameDisplay, ss.sectionName, section.gid, model.sectionMeta[ss.sectionName].maximum, model.sectionMeta[ss.sectionName].count)
            sectionIds.push(section.gid)
            newRow = false
        }
    }
    let html = ''
    for (let key in htmlSwimlanes) {
        html += `<div class="flex mb-1">
            <h2 style="writing-mode: vertical-rl" class="bg-gray-600 text-white text-bold text-center p-1">${key}</h2>
            <div class="flex-1 flex">
                ${htmlSwimlanes[key]}
            </div>
        </div>`
    }
    $('wrapper').innerHTML = html
    for (let sectionId of sectionIds) {
        setColumnColor(sectionId)
    }
}

function setColumnColor(sectionId) {
    let section = model.sections[sectionId]
    let sectionName = getSectionAndSwimlane(section).sectionName
    let count = model.sectionMeta[sectionName].count
    let maximum = model.sectionMeta[sectionName].maximum
    let columnColor = count > maximum ? 'bg-red-400' : 'bg-gray-300'
    let el = $(`section${sectionId}`)
    if (columnColor === 'bg-red-400') {
        el.classList.add('bg-red-400')
        el.classList.remove('bg-gray-300')
    } else {
        el.classList.add('bg-gray-300')
        el.classList.remove('bg-red-400')
    }
}

function getSectionAndSwimlane(section) {
    let name = section.name
    let colonIndex = name.indexOf(':')
    if (colonIndex === -1) {
        return null
    }

    let barIndex = name.indexOf('|')
    let maximum = 1000
    if (barIndex !== -1) {
        try {
            maximum = parseInt(name.substring(barIndex + 1))
            name = name.substring(0, barIndex)
        } catch (e) {
            console.warn(e)
        }
    }
    return {
        sectionName: name.substring(colonIndex + 1).toLowerCase().replace(/ /g, ''),
        swimlaneName: name.substring(0, colonIndex).toLowerCase().replace(/ /g, ''),
        sectionNameDisplay: name.substring(colonIndex + 1),
        swimlaneNameDisplay: name.substring(0, colonIndex),
        maximum: maximum
    }
}

function createColumn(displayName, name, id, maximum, count) {
    let collapsed = ''
    if (Cookies.get(`collapsed-${name}`) === 'true') {
        collapsed = 'collapsed'
    }
    let html = `<div class="flex-1 ml-1 ${name} ${collapsed}">
        <a href="javascript:toggleSection('${name}')" class="bg-gray-600 text-white text-bold p-1 text-center block">
            <span data-section-id="${id}" class="add-task text-gray-400 hover:underline hover:text-white float-left inline-block ml-1 pt-1 text-xs">add task</span>
            ${displayName} 
            <span class="ml-4 text-xs"><span class="count${name}">${count}</span> of ${maximum === 1000 ? '∞' : maximum}</span>`
    if (name === 'done' || name.startsWith('complete') || name.startsWith('finish')) {
        html += `<span data-section="${name}" class="release text-gray-400 hover:underline hover:text-white inline-block mr-1 pt-1 float-right text-xs">release</span>`
    }
    html +=
        `</a>
        <div style="min-height:50px;" class="flex flex-wrap class${name}" id="section${id}"></div>
    </div>`
    return html
}

function toggleSection(sectionClass) {
    let sectionEls = $c(sectionClass)
    for (let sectionEl of sectionEls) {
        if (sectionEl.classList.contains('collapsed')) {
            sectionEl.classList.remove('collapsed')
            Cookies.set(`collapsed-${sectionClass}`, 'false', { expires: 9999, path: '' })
        } else {
            sectionEl.classList.add('collapsed')
            Cookies.set(`collapsed-${sectionClass}`, 'true', { expires: 9999, path: '' })
        }
    }
}

function createTaskUi() {
    for (let taskId of model.tasksOrder) {
        let task = model.tasks[taskId]
        addTaskToUi(task)
    }
}

function addTaskToUi(task, toTop) {
    let hasImage = task.assignee && task.assignee.photo
    let el = $(`section${task.memberships[0].section.gid}`)
    let html = `<div onclick="edit('${task.gid}')" id="task${task.gid}" class="w-2/4 border-1">
        <div id="taskBox${task.gid}" class="hover:shadow border rounded m-1 bg-white mb-1 p-1 cursor-pointer text-center text-xs">
            <img id="photo${task.gid}" class="${hasImage ? '' : 'hidden'} h-6 w-6 rounded-full inline-block mr-2" src="${hasImage ? task.assignee.photo['image_60x60'] : 'images/blank.png'}"/>
            <span id="taskName${task.gid}">${task.name}</span>
            <div id="taskDate${task.gid}"></div>
            </div>
    </div>`

    el.innerHTML = toTop ? html + el.innerHTML : el.innerHTML + html
    setTaskColor(task)
}

function setTaskColor(task) {
    let taskBoxEl = $(`taskBox${task.gid}`)
    let taskDateEl = $(`taskDate${task.gid}`)
    taskBoxEl.classList.remove('bg-red-600', 'text-white', 'bg-purple-600', 'text-black')
    let lastMod = getCustomFieldDate(task)
    let daysSinceMove = dateFns.differenceInDays(new Date(), lastMod)
    if (daysSinceMove > 30) {
        daysSinceMove = 30
    }
    taskBoxEl.style.opacity = (100 - (daysSinceMove * 2.3)) / 100
    if (task.due_on) {
        let border = 'border-purple-500'
        if (dateFns.differenceInDays(dateFns.parse(task.due_on), new Date()) < 5) {
            taskBoxEl.classList.add('bg-red-600', 'text-white')
            border = 'border-red-500'
        } else {
            taskBoxEl.classList.add('bg-purple-600', 'text-white')
        }
        taskDateEl.innerHTML = `<div style="font-size:8px" class="text-left mt-1 border-t ${border}">Due Date<span class="float-right">${task.due_on}</span></div>`
    }
}

function getCustomFieldDate(task) {
    for (let customField of task.custom_fields) {
        if (customField.gid = customFieldId) {
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
    return new Date()
}

let currentlyEditingTask = null
let currentlyEditingQueue = []
function edit(taskId) {
    currentlyEditingTask = createNew ? model.tasks[taskId] : JSON.parse(JSON.stringify(model.tasks[taskId]))
    currentlyEditingQueue = []
    $('name').value = currentlyEditingTask.name
    $('users').value = currentlyEditingTask.assignee ? currentlyEditingTask.assignee.gid : 'no value'
    if (currentlyEditingTask.due_on) {
        $('date').value = currentlyEditingTask.due_on
    }
    if (!createNew) {
        loadStories(taskId)
        $('newCommentHolder').style.display = 'block'
    } else {
        $('comments').style.display = 'none'
        $('newCommentHolder').style.display = 'none'
    }
    quillDescription.root.innerHTML = currentlyEditingTask['html_notes'] ? currentlyEditingTask['html_notes'] : ''
    quillComment.root.innerHTML = ''
    setUserPhoto(currentlyEditingTask.assignee)
    $('overlay').classList.remove('hidden')
    $('taskTemplate').classList.remove('hidden')
    $('name').focus()
}

function changeUser() {
    let newUserId = $('users').value
    let newUser = model.users[newUserId]
    setUserPhoto(newUser)
    currentlyEditingTask.assignee = newUser
}
function setUserPhoto(user) {
    let photoUrl = user && user.photo ? user.photo['image_60x60'] : 'head.png'
    $('userImage').src = photoUrl
}
function cancel() {
    $('overlay').classList.add('hidden')
    $('taskTemplate').classList.add('hidden')
    currentlyEditingQueue = []
    currentlyEditingTask = null
}
function save() {
    $('overlay').classList.add('hidden')
    $('taskTemplate').classList.add('hidden')
    currentlyEditingTask.html_notes = '<body>' + convertToAsana(quillDescription.root.innerHTML) + '</body>'
    currentlyEditingTask.name = $('name').value
    currentlyEditingTask.due_on = $('date').value

    let newAssignee = currentlyEditingTask.assignee ? `${currentlyEditingTask.assignee.gid}` : null

    if (!createNew) {
        queue.push({
            httpFunc: axios.put,
            url: `https://app.asana.com/api/1.0/tasks/${currentlyEditingTask.gid}`,
            body: {
                'data': {
                    'assignee': newAssignee,
                    'name': currentlyEditingTask.name,
                    'html_notes': currentlyEditingTask.html_notes
                }
            },
            callback: (response) => {
                console.info(response)
            }
        })
        let hasPhoto = currentlyEditingTask.assignee && currentlyEditingTask.assignee.photo
        let photoEl = $(`photo${currentlyEditingTask.gid}`)
        if (!hasPhoto) {
            photoEl.classList.add('hidden')
            photoEl.src = 'blank.png'
        } else {
            photoEl.classList.remove('hidden')
            photoEl.src = currentlyEditingTask.assignee.photo['image_60x60']
        }
        setTaskColor(currentlyEditingTask)
        $(`taskName${currentlyEditingTask.gid}`).innerHTML = currentlyEditingTask.name
        let rawComment = convertToAsana(quillComment.root.innerHTML)
        if (rawComment.replace(/<br>/g, '').trim() !== '') {
            queue.push({
                httpFunc: axios.post,
                url: `https://app.asana.com/api/1.0/tasks/${currentlyEditingTask.gid}/stories`,
                body: {
                    'data': {
                        "html_text": '<body>' + rawComment + '</body>'
                    }
                },
                callback: (response) => {
                    console.info(response)
                }
            })
        }
        model.tasks[currentlyEditingTask.gid] = currentlyEditingTask
    } else {
        createNew = false
        let newTask = model.tasks['new']
        delete model.tasks['new']
        queue.push({
            httpFunc: axios.post,
            url: `https://app.asana.com/api/1.0/tasks`,
            body: {
                'data': {
                    'assignee': newAssignee,
                    'name': currentlyEditingTask.name,
                    'html_notes': currentlyEditingTask.html_notes,
                    'due_on': currentlyEditingTask.due_on,
                    'projects': [`${projectId}`]
                }
            },
            callback: (response) => {
                let rt = response.data.data
                rt.memberships = newTask.memberships
                rt.html_notes = newTask.html_notes
                rt.assignee = newTask.assignee
                let sectionId = rt.memberships[0].section.gid
                let taskId = rt.gid
                let ss = getSectionAndSwimlane(rt.memberships[0].section)
                model.tasks[rt.gid] = rt
                model.tasksOrder.push(rt.gid)
                updateColumnCount(ss.sectionName, ++model.sectionMeta[ss.sectionName].count)
                addTaskToUi(rt, true)
                queue.push({
                    httpFunc: axios.post,
                    url: `https://app.asana.com/api/1.0/sections/${sectionId}/addTask`,
                    body: {
                        "data": {
                            "task": taskId
                        }
                    },
                    callback: (response) => {
                        console.info(response)

                    }
                })
            }
        })
    }


    currentlyEditingQueue = []
    currentlyEditingTask = null
}

function convertToAsana(text) {
    let reg = /<span class="mention" data-index="[0-9]*" data-denotation-char="@" data-id="([0-9]+)" data-value="[^"]*">\s*<span contenteditable="false">\s*<span class="ql-mention-denotation-char">@<\/span>([^<]+)<\/span>\s*<\/span>/g
    return text.replace(reg, '<a href="https://app.asana.com/0/$1/" data-asana-dynamic="true" data-asana-gid="$1" data-asana-accessible="true" data-asana-type="user">$2</a>').replace(/<\/*span>/g, '').replace(/<br>/g, '\n')
}

document.onkeydown = function (evt) {
    evt = evt || window.event;
    var isEscape = false;
    if ("key" in evt) {
        isEscape = (evt.key === "Escape" || evt.key === "Esc");
    } else {
        isEscape = (evt.keyCode === 27);
    }
    if (isEscape) {
        cancel()
    }
};


document.onkeyup = function (evt) {
    evt = evt || window.event;
    if (evt.keyCode === 191) {
        $('search').focus()
    }
};
let quillDescription = null
let quillComment = null

function setupTaskTemplate() {
    let options = ''
    for (let user of model.usersOrder) {
        options += `<option value="${user.gid}">${user.name} ${user.email.indexOf('@searchspring') === -1 ? ('(' + user.email + ')') : ''}</option>`
    }
    let usersInTasks = {}
    for (let key in model.tasks) {
        let task = model.tasks[key]
        if (task.assignee) {
            usersInTasks[task.assignee.gid] = task.assignee
        }
    }
    if (Object.keys(usersInTasks).length > 0) {
        options = `<option disabled> ---- </option>` + options
    }
    for (let key in usersInTasks) {
        let user = usersInTasks[key]
        options = `<option value="${user.gid}">${user.name} ${user.email.indexOf('@searchspring') === -1 ? ('(' + user.email + ')') : ''}</option>` + options
    }
    $('users').innerHTML = `<option selected value="no value">please select</option>` + options

    var Block = Quill.import('blots/block');
    Block.tagName = 'SPAN';
    Quill.register(Block, true);
    let quillConfig = {
        modules: {
            toolbar: [
                ['bold', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ],
            mention: {
                allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
                mentionDenotationChars: ["@"],
                source: function (searchTerm, renderList) {
                    let values = model.atValues;
                    if (searchTerm.length === 0) {
                        renderList(values, searchTerm);
                    } else {
                        const matches = [];
                        for (let i = 0; i < values.length; i++) {
                            if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) {
                                matches.push(values[i]);
                            }
                        }
                        renderList(matches, searchTerm);
                    }
                }
            }
        },
        theme: 'snow'
    }
    quillDescription = new Quill('#description', quillConfig);
    quillComment = new Quill('#addComment', quillConfig);
}

function newPat() {
    workspaceId = $('workspaceId').value
    $('newProjects').innerHTML = '<option>loading...</option>'
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + $('pat').value
    axios.get(`https://app.asana.com/api/1.0/projects?archived=false&workspace=${workspaceId}`).then((response) => {
        $('patError').classList.add('hidden')
        response.data.data = response.data.data.sort((a, b) => {
            return a.name.localeCompare(b.name)
        })
        let html = ''
        for (let project of response.data.data) {
            html += `<option value="${project.gid}">${project.name}</option>`
        }
        $('newProjects').innerHTML = html
    }).catch((error) => {
        $('newProjects').innerHTML = ''
        $('patError').classList.remove('hidden')
        $('patError').innerHTML = JSON.stringify(error.response.data)

    })
}

async function go() {
    await axios.post(`https://app.asana.com/api/1.0/custom_fields`, {
        'data': {
            'name': 'column-change',
            'type': 'text',
            'workspace': workspaceId
        }
    }).then((response) => {
        console.info(response)
    }).catch((error) => {
        if (error.response.status === 403) {
            // do nothing.
        } else {
            console.error(error)
        }
    })

    customFieldId = await axios.get(`https://app.asana.com/api/1.0/workspaces/${workspaceId}/custom_fields`).then((response) => {
        for (let cf of response.data.data) {
            if (cf.name === 'column-change') {
                return cf.gid
            }
        }
    }).catch((error) => {
        console.error(error)
        return -1
    })

    projectId = $('newProjects').value
    ensureCustomField()
    $('starting').classList.add('hidden')
    $('startingOverlay').classList.add('hidden')
    Cookies.set('projectId', projectId, { expires: 9999, path: '' })
    Cookies.set('customFieldId', customFieldId, { expires: 9999, path: '' })
    Cookies.set('workspaceId', workspaceId, { expires: 9999, path: '' })
    Cookies.set('pat', $('pat').value, { expires: 9999, path: '' })
    start()
}
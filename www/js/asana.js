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

async function loadUsers(bustCache) {
    setStatus('green', `loading... users`)
    let cachedUsers = localStorage.getItem('users')
    if (cachedUsers && !bustCache) {
        processUsers(JSON.parse(cachedUsers))
    } else {
        await axios.get(`https://app.asana.com/api/1.0/users?opt_fields=name,photo.image_60x60,resource_type,email`).then((response) => {
            localStorage.setItem('users', JSON.stringify(response.data.data))
            processUsers(response.data.data)
        })
    }
}

async function loadTags(bustCache) {
    setStatus('green', `loading... tags`)
    let cachedTags = localStorage.getItem('tags')
    if (cachedTags && !bustCache) {
        processTags(JSON.parse(cachedTags))
    } else {
        await axios.get(`https://app.asana.com/api/1.0/tags?workspace=${workspaceId}&opt_fields=color,name`).then((response) => {
            localStorage.setItem('tags', JSON.stringify(response.data.data))
            processTags(response.data.data)
        })
    }
}

let tagify;
function processTags(data) {
    let whitelist = []
    for (let tag of data) {
        whitelist.push({ value: tag.name, color: tag.color, gid: tag.gid })
    }
    whitelist = whitelist.sort((a, b) => {
        return a.value.localeCompare(b.value)
    })
    tagify = new Tagify($('tags'), {
        whitelist: whitelist,
        dropdown: {
            enabled: 0,
            closeOnSelect: true,
            maxItems: 200
        },
        enforceWhitelist: true,
        editTags: null
    })
    tagify.on('add', (e) => {
        createTagTask(`addTag`, e.detail.data)
    }).on('remove', (e) => {
        createTagTask(`removeTag`, e.detail.data)
    })
}

function createTagTask(method, tag) {
    tagsQueue.push({
        httpFunc: axios.post,
        url: `https://app.asana.com/api/1.0/tasks/${currentlyEditingTask.gid}/` + method,
        body: {
            'data': {
                'tag': `${tag.gid}`
            }
        },
        message: `${method} ${tag.value}`,
        callback: (response) => {
            console.info(response)
        }
    })
}

function processUsers(data) {
    let users = {}
    let userWithSearchspring = {}
    for (let user of data) {
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
    model.users = {}
    model.usersOrder = []
    model.atValues = []
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

function convertToAsana(text) {
    let reg = /<span class="mention" data-index="[0-9]*" data-denotation-char="@" data-id="([0-9]+)" data-value="[^"]*">\s*<span contenteditable="false">\s*<span class="ql-mention-denotation-char">@<\/span>([^<]+)<\/span>\s*<\/span>/g
    return text.replace(reg, '<a href="https://app.asana.com/0/$1/" data-asana-dynamic="true" data-asana-gid="$1" data-asana-accessible="true" data-asana-type="user">$2</a>').replace(/<\/*span>/g, '').replace(/<br>/g, '\n')
}

function startSyncLoop() {
    self.setTimeout(syncLoop, 1000)
    self.setInterval(async () => {
        if (!currentlyEditingTask) {
            await loadUsers(true)
            setupTaskTemplateUsers()
        }
    }, 3600000)
}
async function syncLoop() {
    let didSomeSyncing = false
    while (queue.length > 0) {
        let queueItem = queue[0]
        let message = ''
        if (queueItem.message) {
            message = `<span style="font-size:7px" class="ml-4 opacity-50">${queueItem.message}<span>`
        }
        setStatus('yellow', `syncing ${queue.length} items${message}`)
        await queueItem.httpFunc(queueItem.url, queueItem.body).then(queueItem.callback)
        queue.shift()
        didSomeSyncing = true
    }
    if (didSomeSyncing) {
        setStatus('green', `sync'd`)
    }
    self.setTimeout(syncLoop, 500)
}
const m = require('mithril')
const Status = require('../components/Status')
const jsonstore = require('../utils/jsonstore')
const x = require('../utils/xhr-with-auth')(m)

const Asana = {
    workspaceId: '',
    pat: '',
    projects: [],
    customFieldId: '',
    projectId: '',
    sectionMeta: {},
    sections: {},
    sectionsOrder: [],
    swimlanes: [],
    swimlanesDisplay: [],
    swimlaneColumns: {},
    tasks: {},
    tasksOrder: [],
    columnTasks: {},
    projectTags: {},
    queue: [],
    users: {},
    usersOrder: [],
    usersInTasks: [],
    atValues: [],
    tags: [],
    createNew: false,
    testing: false,
    initFromStorage() {
        if (jsonstore.has('workspaceId')) {
            this.workspaceId = jsonstore.get('workspaceId')
        }
        if (jsonstore.has('pat')) {
            this.pat = jsonstore.get('pat')
        }
        if (jsonstore.has('customFieldId')) {
            this.customFieldId = jsonstore.get('customFieldId')
        }
        if (jsonstore.has('projectId')) {
            this.projectId = jsonstore.get('projectId')
        }
    },
    isSetup() {
        return jsonstore.has('pat') &&
            jsonstore.has('workspaceId') &&
            jsonstore.has('projectId') &&
            jsonstore.has('customFieldId')
    },
    async loadAllProjects(offset) {

        if (this.testing && jsonstore.has('projects')) {
            this.projects = jsonstore.get('projects')
            return
        }
        if (!offset) {
            offset = ''
        } else {
            offset = '&offset=' + offset
        }
        await x.request({ background: true, url: `https://app.asana.com/api/1.0/projects?limit=100${offset}&archived=false&workspace=${this.workspaceId}` }).then(async (response) => {
            this.projects.push(...response.data)
            if (response.next_page) {
                await this.loadAllProjects(response.next_page.offset)
            }
        })
        this.projects = this.projects.sort((a, b) => {
            return a.name.localeCompare(b.name)
        })
        this.projects.unshift({ name: 'Please select', gid: '-1' })

        if (this.testing) {
            jsonstore.set('projects', this.projects)
        }
        m.redraw(true)
    },
    setWorkspaceId(workspaceId) {
        this.workspaceId = workspaceId
        jsonstore.set('workspaceId', workspaceId)
    },
    setPat(pat) {
        this.pat = pat
        jsonstore.set('pat', pat)
    },
    setProjectId(projectId) {
        this.projectId = projectId
        jsonstore.set('projectId', projectId)
    },
    setCustomFieldId(customFieldId) {
        this.customFieldId = customFieldId
        jsonstore.set('customFieldId', customFieldId)
    },
    async setupProject() {
        await x.request({
            url: `https://app.asana.com/api/1.0/custom_fields`,
            method: 'POST',
            data: {
                'data': {
                    'name': 'column-change',
                    'type': 'text',
                    'workspace': this.workspaceId
                }
            },
            background: true
        }).then((response) => {
            console.info(response)
        }).catch(() => {
            // do nothing
        })

        let customFieldId = await x.request({
            url: `https://app.asana.com/api/1.0/workspaces/${this.workspaceId}/custom_fields`,
            background: true
        }).then((response) => {
            for (let cf of response.data) {
                if (cf.name === 'column-change') {
                    return cf.gid
                }
            }
            return '-1'
        }).catch(() => {
            return '-1'
        })
        if (customFieldId === '-1') {
            await x.request({
                url: `https://app.asana.com/api/1.0/projects/${this.projectId}/addCustomFieldSetting`,
                'data': {
                    'custom_field': `${customFieldId}`
                },
                background: true
            }).then((response) => {
                console.info(response)
            }).catch(() => {
                // do nothing.
            })
        }
        this.setCustomFieldId(customFieldId)
    },
    async loadSections() {
        let response = ''
        if (this.testing && jsonstore.has('sections')) {
            response = jsonstore.get('sections')
        } else {
            response = await x.request({ url: `https://app.asana.com/api/1.0/projects/${this.projectId}/sections` }).then((response) => {
                return response;
            })
            jsonstore.set('sections', response)
        }
        for (let section of response.data) {
            if (section.name.toLowerCase() === '(no section)') {
                continue
            }
            let ss = this.getSectionAndSwimlane(section)
            if (!ss) {
                continue
            }
            if (!this.sectionMeta[ss.sectionName]) {
                this.sectionMeta[ss.sectionName] = { count: 0, maximum: ss.maximum }
            }
            if (!this.contains(this.swimlanes, ss.swimlaneName)) {
                this.swimlanes.push(ss.swimlaneName)
                this.swimlanesDisplay.push(ss.swimlaneNameDisplay)
                this.swimlaneColumns[ss.swimlaneName] = []
            }
            ss.sectionId = section.gid
            this.swimlaneColumns[ss.swimlaneName].push(ss)
            this.sections[`${section.gid}`] = section
            this.sectionsOrder.push(section.gid)
        }
    },
    contains(haystack, needle) {
        for (const n of haystack) {
            if (n === needle) {
                return true
            }
        }
        return false
    },
    getSectionAndSwimlane(section) {
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
            maximum: maximum,
            count: 0
        }
    },
    async loadTasks() {
        let taskFields = 'custom_fields,tags.name,tags.color,memberships.section.name,memberships.project.name,name,assignee.photo,assignee.name,assignee.email,due_on,modified_at,html_notes,notes,stories'
        let response = await x.request({ url: `https://app.asana.com/api/1.0/tasks?completed_since=${new Date().toISOString()}&project=${this.projectId}&opt_fields=${taskFields}` }).then((response) => {
            return response
        })
        for (let task of response.data) {
            for (let membership of task.memberships) {
                if (membership.project.gid === this.projectId) {
                    let ss = this.getSectionAndSwimlane(membership.section)
                    if (ss) {
                        this.tasks[task.gid] = task
                        if (!this.columnTasks[membership.section.gid]) {
                            this.columnTasks[membership.section.gid] = []
                        }
                        this.columnTasks[membership.section.gid].push(task)
                        this.tasksOrder.push(task.gid)
                        this.sectionMeta[ss.sectionName].count++
                    }
                }
            }
        }
        for (let key in this.tasks) {
            let task = this.tasks[key]
            if (!task.custom_fields) {
                task.custom_fields = []
            }
            if (task.memberships.length > 1) {
                task.memberships = task.memberships.sort((a, b) => {
                    if (a.project.gid === this.projectId) {
                        return -1
                    } else {
                        return 1
                    }
                })
            }
            task.custom_fields = task.custom_fields.sort((a, b) => {
                if (a.gid.gid === this.customFieldId) {
                    return -1
                } else {
                    return 1
                }
            })
            if (task.custom_fields.length === 0 || task.custom_fields[0].gid !== this.customFieldId) {
                task.custom_fields.splice(0, 0, {
                    gid: this.customFieldId,
                    text_value: ''
                });
            }
            if (task.tags) {
                for (let tag of task.tags) {
                    this.addProjectTag(tag)
                }
            }
        }
    },
    addProjectTag(tag) {
        let color = this.convertTagColor(tag.color)
        this.projectTags[tag.gid] = {
            name: tag.name,
            color: color,
            id: tag.gid
        }
    },
    search(searchValue) {
        searchValue = searchValue.toLowerCase()
        let emptySearch = searchValue.trim() === ''
        for (let key in Asana.sections) {
            Asana.sections[key].highlight = false
        }
        for (let key in Asana.tasks) {
            let task = Asana.tasks[key]
            let text = task.name.toLowerCase()
            for (let tag of task.tags) {
                if (tag.name) {
                    text += ' ' + tag.name.toLowerCase()
                }
            }
            if (task.assignee) {
                text += ' ' + task.assignee.name.toLowerCase()
            }
            task.hidden = false
            if (!emptySearch) {
                if (text.indexOf(searchValue) === -1) {
                    task.hidden = true
                } else {
                    Asana.sections[task.memberships[0].section.gid].highlight = true
                }
            }
        }
    },

    async loadTags(bustCache) {
        if (jsonstore.has('tags') && !bustCache) {
            this.tags = jsonstore.get('tags')
        } else {
            await x.request({ url: `https://app.asana.com/api/1.0/tags?workspace=${this.workspaceId}&opt_fields=color,name` }).then((response) => {
                jsonstore.set('tags', response.data)
                this.tags = response.data
            })
        }
    },
    convertTagColor(c) {
        if (!c) {
            return 'background-color:gray;'
        }
        if (c.indexOf('light-') !== -1) {
            return c.replace(/light-(.*)/g, 'filter: brightness(120%); background-color:$1;')
        } else if (c.indexOf('dark-') !== -1) {
            return c.replace(/dark-(.*)/g, 'filter: brightness(80%); background-color:$1;color:white;')
        } else {
            return 'background-color:' + c
        }
    },
    taskMoved(sectionId, taskId, siblingTaskId) {
        this.queue.push({
            method: 'POST',
            url: `https://app.asana.com/api/1.0/sections/${sectionId}/addTask`,
            body: {
                "data": {
                    "task": taskId,
                    "insert_before": siblingTaskId,
                }
            },
            message: `moving ${taskId}`,
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
        if (this.customFieldId !== '-1') {
            customFieldBody.data.custom_fields[`${this.customFieldId}`] = new Date().toISOString()
            this.tasks[taskId].custom_fields[0].text_value = new Date().toISOString()
            this.queue.push({
                method: 'PUT',
                url: `https://app.asana.com/api/1.0/tasks/${taskId}`,
                body: customFieldBody,
                message: `updating last modified ${taskId}`,
                callback: (response) => {
                    console.info(response)
                }
            })
        }
        Status.set('yellow', `syncing ${this.queue.length} items`)
    },
    startSyncLoops() {
        self.setTimeout(Asana.syncLoop, 1000)
        // self.setInterval(async () => {
        //     if (!currentlyEditingTask) {
        //         await loadUsers(true)
        //         setupTaskTemplateUsers()
        //     }
        // }, 3600000)
    },
    async syncLoop() {
        let didSomeSyncing = false
        let errorFree = true
        while (Asana.queue.length > 0 && errorFree) {
            let queueItem = Asana.queue[0]
            let message = ''
            if (queueItem.message) {
                message = `<span style="font-size:7px" class="ml-4 opacity-50">${queueItem.message}<span>`
            }
            Status.set('yellow', `syncing ${Asana.queue.length} items${message}`)

            await x.request({ url: queueItem.url, data: queueItem.body, method: queueItem.method }).then(queueItem.callback).catch((error) => {
                console.log(error)
                let message = error.message
                if (error.response && error.response.data && error.response.data.errors) {
                    message = error.response.data.errors[0].message
                }
                Status.set('red', message)
                errorFree = false
            })
            Asana.queue.shift()
            didSomeSyncing = true
        }
        if (didSomeSyncing && errorFree) {
            Status.set('green', `sync'd`)
        }
        if (errorFree) {
            self.setTimeout(Asana.syncLoop, 500)
        }
    },
    release(sectionName) {
        let count = this.sectionMeta[sectionName].count
        let confirmed = confirm(`Release ${count} task${count > 1 ? 's' : ''} and mark as complete?`)
        if (confirmed) {
            for (let key in this.tasks) {
                let task = this.tasks[key]
                if (sectionName === this.getSectionAndSwimlane(task.memberships[0].section).sectionName) {
                    this.queue.push({
                        method: 'PUT',
                        url: `https://app.asana.com/api/1.0/tasks/${key}`,
                        body: {
                            "data": {
                                "completed": true
                            }
                        },
                        message: `releasing ${key}`,
                        callback: (response) => {
                            console.info(response)
                        }
                    })
                    let taskEl = document.getElementById(`task${key}`)
                    taskEl.parentNode.removeChild(taskEl)
                    delete this.tasks[key]
                    this.tasksOrder = this.tasksOrder.filter(e => e !== key)
                    this.sectionMeta[sectionName].count--
                    Status.set('yellow', `syncing ${this.queue.length} items`)
                }
            }
        }
    },
    async loadUsers(bustCache) {
        if (jsonstore.has('users') && !bustCache) {
            this.processUsers(jsonstore.get('users'))
            m.redraw()
        } else {
            await x.request({ url: `https://app.asana.com/api/1.0/users?opt_fields=name,photo.image_60x60,resource_type,email` }).then((response) => {
                jsonstore.set('users', response)
                this.processUsers(response)
            })
        }
    },
    processUsers(data) {
        let users = {}
        let userWithSearchspring = {}
        for (let user of data.data) {
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
        this.users = {}
        this.usersOrder = []
        this.atValues = []
        for (let user of dedupedUsers) {
            this.users[user.gid] = user
            this.usersOrder.push(user)
        }
        this.usersOrder.sort((a, b) => {
            return a.name.localeCompare(b.name)
        })
        for (let user of this.usersOrder) {
            this.atValues.push({ id: user.gid, value: user.name + (user.email.indexOf('@searchspring') === -1 ? (' (' + user.email + ')') : '') })
        }

        this.usersInTasks = []
        for (let user of this.usersOrder) {
            this.usersInTasks.push(user)
        }
        let usersInTasks = {}
        for (let key in this.tasks) {
            let task = this.tasks[key]
            if (task.assignee) {
                usersInTasks[task.assignee.gid] = task.assignee
            }
        }
        if (Object.keys(usersInTasks).length > 0) {
            this.usersInTasks.unshift({ name: '----' })
        }
        for (let key in usersInTasks) {
            this.usersInTasks.unshift(usersInTasks[key])
        }
    }
}

module.exports = Asana
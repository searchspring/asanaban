const m = require('mithril')
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
            }
        }).then((response) => {
            console.info(response)
        }).catch((error) => {
            console.log(JSON.stringify(error));
            if (error.errors[0].error === 'custom_field_duplicate_name') {
                // do nothing.
            } else {
                console.error(error)
                return
            }
        })

        let customFieldId = await x.request({ url: `https://app.asana.com/api/1.0/workspaces/${this.workspaceId}/custom_fields` }).then((response) => {
            for (let cf of response.data) {
                if (cf.name === 'column-change') {
                    return cf.gid
                }
            }
            return '-1'
        }).catch((error) => {
            console.error(error)
            return
        })
        if (customFieldId === '-1') {
            Asanaban.setStatus('green', `ensuring custom field`)
            await x.request({
                url: `https://app.asana.com/api/1.0/projects/${this.projectId}/addCustomFieldSetting`,
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
                    // continue as custom field is not critical, supports the transparancy.
                }
            })
        }

        this.setCustomFieldId(customFieldId)
    },
    async loadSections() {
        await x.request({ url: `https://app.asana.com/api/1.0/projects/${this.projectId}/sections` }).then((response) => {
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
            console.log(this.swimlanes);
        })
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
        await x.request({ url: `https://app.asana.com/api/1.0/tasks?completed_since=${new Date().toISOString()}&project=${this.projectId}&opt_fields=${taskFields}` }).then((response) => {
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


            }
        })
    },
    search(searchValue) {
        searchValue = searchValue.toLowerCase()
        let emptySearch = searchValue.trim() === ''
        for (let key in Asana.sections) {
            Asana.sections[key].highlight = false
        }
        for (let key in Asana.tasks) {
            let task = Asana.tasks[key]
            console.log(task)
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
                    console.log(task);
                } else {
                    Asana.sections[task.memberships[0].section.gid].highlight = true
                }
            }
        }
    }

}

module.exports = Asana
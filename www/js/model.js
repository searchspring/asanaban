let projectId = null
let workspaceId = null
let customFieldId = null
let sectionIds = []
let queue = []

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
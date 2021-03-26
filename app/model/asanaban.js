const m = require('mithril')
const jsonstore = require('../utils/jsonstore')
const Asana = require('./asana')
const dragula = require('dragula')

const Asanaban = {
    backgroundImage: '',
    initFromStorage() {
        if (jsonstore.has('backgroundImage')) {
            this.setBackgroundImage(jsonstore.get('backgroundImage'))
        }
    },
    async setBackgroundImage(backgroundImage) {
        jsonstore.set('backgroundImage', backgroundImage)
        this.backgroundImage = backgroundImage
        document.body.style.backgroundImage = `url('${this.backgroundImage}')`
        document.body.style.backgroundSize = 'cover'
        document.body.style.backgroundAttachment = 'fixed'
    },
    toggleColumn(columnName) {
        let key = `collapsed-${columnName}`
        if (jsonstore.has(key)) {
            jsonstore.set(key, !jsonstore.get(key))
        } else {
            jsonstore.set(key, true)
        }
    },
    doSearch(search) {
        this.search = search
        jsonstore.set('search', this.search)
        Asana.search(this.search)
        m.redraw()
    },
    setupDragula() {
        let drags = []
        console.log("Sections: ", Asana.sections)
        for (let sectionId in Asana.sections) {
            drags.push(document.getElementById(`section${sectionId}`))
            console.log("Number of elements with id: ", document.querySelectorAll(`#section${sectionId}`).length)
        }
        dragula(drags).on('drop', (el, target, source, sibling) => {
            console.log("being dropped")
            let taskId = el.getAttribute('id').substring(4)
            let siblingTaskId = sibling === null ? null : sibling.getAttribute('id').substring(4)
            let targetSectionId = target.getAttribute('id').substring(7)
            let sourceSectionId = source.getAttribute('id').substring(7)
            let sourceSection = Asana.sections[sourceSectionId]
            let sourceSectionName = Asana.getSectionAndSwimlane(sourceSection).sectionName
            Asana.sectionMeta[sourceSectionName].count--
            let targetSection = Asana.sections[targetSectionId]
            let targetSectionName = Asana.getSectionAndSwimlane(targetSection).sectionName
            Asana.sectionMeta[targetSectionName].count++
            let task = Asana.tasks[taskId]
            task.memberships[0].section = targetSection
            Asana.taskMoved(sourceSectionId, targetSectionId, taskId, siblingTaskId)
            //console.log("SectionMeta: ", Asana.sectionMeta)
            console.log("TargetSection: ", targetSectionName)
            console.log("SourceSection: ", sourceSectionName)

            console.log("TaskID: ", taskId)
            console.log("SiblingTaskId: ", siblingTaskId)

            //console.log("Tasks: ", Asana.tasks)
            m.redraw()
        });
    }
}

module.exports = Asanaban
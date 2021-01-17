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
        for (let sectionId of Asana.sectionsOrder) {
            drags.push(document.getElementById(`section${sectionId}`))
        }
        dragula(drags).on('drop', function (el, target, source, sibling) {
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
            Asana.taskMoved(targetSectionId, taskId, siblingTaskId)
            m.redraw()
        });
    }

}

module.exports = Asanaban
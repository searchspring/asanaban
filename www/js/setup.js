function setup(){
    $('startingOverlay').classList.remove('hidden')
    $('starting').classList.remove('hidden')
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
    localStorage.setItem('projectId', projectId)
    localStorage.setItem('customFieldId', customFieldId)
    localStorage.setItem('workspaceId', workspaceId)
    localStorage.setItem('pat', $('pat').value)
    start()
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
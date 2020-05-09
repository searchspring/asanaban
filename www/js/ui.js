function setStatus(color, text, append) {
    let el = $('status')
    el.classList.remove('text-yellow-900', 'text-green-900', 'text-red-900', 'hidden', 'bg-yellow-300', 'bg-green-300', 'bg-red-300')
    el.classList.add(`text-${color}-900`, `bg-${color}-300`)
    el.innerHTML = append ? el.innerHTML + text : text
    disolveStatus(3000)
}
let statusTimeout;
function disolveStatus(timeout) {
    if (statusTimeout) {
        clearTimeout(statusTimeout)
    }
    if ($('status').classList.contains('text-green-900')) {
        statusTimeout = self.setTimeout(() => {
            $('status').classList.add('hidden')
        }, timeout ? timeout : 1000)
    }
}

function image() {
    let newImage = $('backgroundImages').value
    document.body.style.backgroundImage = `url('${newImage}')`
    document.body.style.backgroundSize = 'cover'
    localStorage.setItem(`backgroundImage`, newImage)
}




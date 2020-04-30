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
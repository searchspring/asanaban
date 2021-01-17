const Status = {
    statusTimeout: null,
    set(color, text, append) {
        let el = document.getElementById('status')
        el.classList.remove('text-yellow-900', 'text-green-900', 'text-red-900', 'hidden', 'bg-yellow-300', 'bg-green-300', 'bg-red-300')
        el.classList.add(`text-${color}-900`, `bg-${color}-300`)
        el.innerHTML = append ? el.innerHTML + text : text
        this.disolve(3000)
    },
    disolve(timeout) {
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout)
        }
        if (document.getElementById('status').classList.contains('text-green-900')) {
            this.statusTimeout = self.setTimeout(() => {
                document.getElementById('status').classList.add('hidden')
            }, timeout ? timeout : 1000)
        }
    }
}

module.exports = Status
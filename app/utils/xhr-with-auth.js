const jsonstore = require('./jsonstore')

module.exports = (m) => {
    return {
        request(args) {
            if (jsonstore.has('pat')) {
                let pat = jsonstore.get('pat')
                if (!args.headers) {
                    args.headers = {
                        'Authorization': 'Bearer ' + pat
                    }
                }
            }
            return m.request(args)
        }
    }
}
const jsonstore = require('./jsonstore')

module.exports = (m) => {
    return {
        request(args) {
            if (jsonstore.has('googleUser')) {
                let user = jsonstore.get('googleUser')
                if (!args.headers) {
                    args.headers = {
                        'Authorization': user.access_token
                    }
                }
            }
            return m.request(args)
        }
    }
}
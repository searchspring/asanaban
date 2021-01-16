require("@babel/polyfill")
const m = require('mithril')
const jsonstore = require("./utils/jsonstore")

const Home = require('./views/Home')
const Setup = require('./views/Setup')

const Auth = function (view) {
  return {
    onmatch: function () {
      if (!jsonstore.has('pat') || !jsonstore.has('workspaceId')) {
        m.route.set('/setup')
      }
      else {
        return view
      }
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  m.route(document.body, '/', {
    '/': Auth(Home),
    '/setup': Setup
  })
});


require("@babel/polyfill")
const m = require('mithril')
const jsonstore = require("./utils/jsonstore")

const Kanban = require('./views/Kanban')
const Setup = require('./views/Setup')
const Asana = require('./model/asana')

const Auth = function (view) {
  return {
    onmatch: function () {
      if (!Asana.isSetup()) {
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
    '/': Auth(Kanban),
    '/setup': Setup
  })
});


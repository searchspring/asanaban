require("@babel/polyfill")
const m = require('mithril')
const jsonstore = require("./utils/jsonstore")

const Home = require('./views/Home')
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
    '/': Auth(Home),
    '/setup': Setup
  })
});


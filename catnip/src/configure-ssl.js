const fs = require('fs')
const path = require('path')

module.exports = (app) => {
  var server

   var https = require('https')
   var privateKey = fs.readFileSync(path.join(__dirname, '/certs/key.pem'), 'utf8')
   var certificate = fs.readFileSync(path.join(__dirname, '/certs/certificate.pem'), 'utf8')
   var credentials = {key: privateKey, cert: certificate}
   server = https.createServer(credentials, app)

  return server
}

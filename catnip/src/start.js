const configureSSL = require('./configure-ssl.js')
const fs = require('fs')
const express = require('express')
const app = express()
const path = require('path')

 var server = configureSSL(app)
 // crear un servidor en puerto 8000
server.listen(8000, function () {
  // imprimir la direccion ip en la consola
  // console.log('servidor disponible en https://'+myip.getLocalIP4()+':8000')
  console.log('server available at https://localhost:8000')
})

/app.use(express.static(path.join(__dirname, '../')))
//app.use(express.static(path))
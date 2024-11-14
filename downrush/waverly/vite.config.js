import { defineConfig } from 'vite'
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig({
		server: {
	  port: 8000,
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/certificate.pem'),
    },
  },
  	preview: {
	  port: 8000,
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/certificate.pem'),
    },
  },
  assetsInclude: ['**/*.handlebars'],
})

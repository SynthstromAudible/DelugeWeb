import { defineConfig } from 'vite'
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig({
	/* uncomment this block to enable https. You may need to change some settings so this will actually work in Chrome.
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
 */
  assetsInclude: ['**/*.handlebars'],
})

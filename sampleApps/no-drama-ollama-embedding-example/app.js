(async () => {
  const roosevelt = require('roosevelt')({
    onBeforeMiddleware: async app => {
      global.noDramaOllamaProtocol = 'https'
      global.noDramaOllamaHost = 'localhost'
      global.noDramaOllamaPort = 8484

      const fs = require('fs')
      const path = require('path')
      const { spawnSync, spawn } = require('child_process')

      // bootstrap no-drama-ollama if needed
      if (!fs.existsSync('node_modules/no-drama-ollama/secrets') || !fs.existsSync('node_modules/no-drama-ollama/secrets/cert.pem')) { // skip this if it was already done
        spawnSync('npm', ['run', 'generate-secrets'], {
          cwd: 'node_modules/no-drama-ollama',
          shell: false,
          stdio: [0, 1, 2] // display output
        })
      }

      // create proxy for no-drama-ollama
      const httpProxy = require('http-proxy')
      const https = require('https')
      const proxy = httpProxy.createProxyServer({
        target: `${global.noDramaOllamaProtocol}://${global.noDramaOllamaHost}${global.noDramaOllamaPort ? `:${global.noDramaOllamaPort}` : ''}`,
        agent: new https.Agent({ // create HTTPS agent
          rejectUnauthorized: false // that ignores self-signed certs
        }),
        changeOrigin: true
      })

      // proxy no-drama-ollama requests to the child app
      const whitelistedPaths = ['/chat', '/css/no-drama-ollama.css', '/js/no-drama-ollama.js']
      app.use((req, res, next) => {
        if (whitelistedPaths.some(path => req.url.startsWith(path))) {
          proxy.web(req, res, (err) => {
            if (err) next(err)
          })
        } else next()
      })

      // start child app
      const childApp = spawn('node', ['no-drama-ollama.js'], {
        cwd: 'node_modules/no-drama-ollama',
        env: {
          ...process.env,
          NO_DRAMA_OLLAMA_CONTEXT_FOLDER: path.resolve('llm-context'),
          HTTPS_PORT: global.noDramaOllamaPort
        },
        shell: false
      })

      // wait for it to start, then proceed with other init
      await new Promise((resolve, reject) => {
        childApp.stdout.on('data', async (data) => {
          const output = data.toString()
          // print relevant lines from its starting console output
          if (output.includes('no-drama-ollama Ollama context directory set to')) {
            const matchedLine = output.split('\n').find(line => line.includes('no-drama-ollama Ollama context directory set to'))
            app.get('logger').log(matchedLine)
          }
          if (output.includes('no-drama-ollama HTTPS server listening')) {
            const matchedLine = output.split('\n').find(line => line.includes('no-drama-ollama HTTPS server listening'))
            app.get('logger').log(matchedLine)
            resolve()
          }
        })
        childApp.stderr.on('data', (data) => reject(new Error(data.toString())))
        process.on('exit', () => childApp.kill())
      })
    }
  })

  await roosevelt.startServer()
})()

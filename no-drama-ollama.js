(async () => {
  const fs = require('fs')
  const path = require('path')

  let contextFolder = 'default-llm-context'

  if (process.env.NO_DRAMA_OLLAMA_CONTEXT_FOLDER) {
    if (!fs.existsSync(process.env.NO_DRAMA_OLLAMA_CONTEXT_FOLDER)) console.error('`NO_DRAMA_OLLAMA_CONTEXT_FOLDER` is set to a path that does not exist.')
    else if (!fs.statSync(process.env.NO_DRAMA_OLLAMA_CONTEXT_FOLDER).isDirectory()) console.error('`NO_DRAMA_OLLAMA_CONTEXT_FOLDER` is set to a path that is not a directory.')
    else contextFolder = process.env.NO_DRAMA_OLLAMA_CONTEXT_FOLDER
  }

  function getMarkdownContents (dir) {
    let result = ''

    function recurse (currentDir) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name)
        if (entry.isDirectory()) {
          recurse(fullPath)
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = fs.readFileSync(fullPath, 'utf8')
          result += `<file>${entry.name}</file>\n\n${content}\n\n`
        }
      }
    }

    recurse(dir)
    return result
  }

  const context = `<context>
Below is a list of markdown files to use as context for this prompt where each file's contents begins with <file>name_of_file.md</file>

${getMarkdownContents(contextFolder)}
</context>

`

  try {
    // get list of installed models
    // TODO: option to restrict which models are allowed to be used via env var
    const response = await fetch('http://localhost:11434/api/tags')
    if (!response.ok) throw new Error(`Ollama returned ${response.status}\n\nError fetching models from Ollama. Is Ollama running?`)
    const responseData = await response.json()
    const models = []
    for (const model in responseData.models) models.push(responseData.models[model].name)
    global.models = models

    // start web server
    await require('roosevelt')({
      onServerInit: app => {
        const logger = app.get('logger')
        app.set('ollama-context', context)
        logger.log('📂', `${app.get('appName')} Ollama context directory set to ${contextFolder}`.bold)
      }
    }).startServer()
  } catch (error) {
    console.error(error)
    console.error('\nError connecting to Ollama. Is Ollama running?')
  }
})()

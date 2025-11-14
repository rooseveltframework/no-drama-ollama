const WebSocket = require('ws')
const markdownToHTML = require('models/markdownToHTML')

module.exports = (router, app) => {
  async function landingPage (req, res) {
    const model = await require('models/global')(req, res)
    model.content.pageTitle = 'AI chat'
    if (req?.session?.chatHistory) model.chatHistory = req.session.chatHistory
    res.render('chat', model)
  }

  router.route('/').get(landingPage)
  router.route('/chat').get(landingPage)

  // TODO: add support for multiple chat histories

  router.route('/chat').post(async (req, res) => {
    const model = await require('models/global')(req, res)

    if (req.body.clearChatHistory === 'true') {
      req.session.chatHistory = []
      req.session.save()
    } else if (req.body.send === 'true') {
      // non-js support
      if (!req?.session?.chatHistory) req.session.chatHistory = []

      req.body.context = app.get('ollama-context')
      const rawPrompt = req.body.prompt
      const options = preprocessPrompt(req.body, req.session.chatHistory)

      const response = await require('models/promptOllama')(options)
      // TODO: make option to display thinking (response.message.thinking) in the gui

      options.rawPrompt = rawPrompt
      options.response = markdownToHTML(response.message.content)
      req.session.chatHistory.push(options)
      req.session.save()
    }

    model.content.pageTitle = 'AI chat'
    model.chatHistory = req.session.chatHistory
    res.render('chat', model)
  })

  // spin up web socket server for js-enabled streaming responses to chat prompts
  new WebSocket.Server({ server: app.get('httpsServer') }).on('connection', (ws, req) => {
    // new client connected
    app.get('expressSession')(req, {}, () => {
      if (!req?.session?.chatHistory) req.session.chatHistory = []

      // message received from client
      ws.on('message', async (message) => {
        message = JSON.parse(message)
        message.context = app.get('ollama-context')

        const rawPrompt = message.prompt
        const options = preprocessPrompt(message, req.session.chatHistory)
        options.stream = true

        const response = await require('models/promptOllama')(options)
        // TODO: make option to display thinking in the gui
        let fullThinking = ''
        let fullResponse = ''
        for await (const part of response) {
          if (part.message.thinking) {
            fullThinking += part.message.thinking
          }
          if (part.message.content) {
            fullResponse += part.message.content
            ws.send(JSON.stringify({ chunk: part.message.content }))
          }
        }
        ws.send(JSON.stringify({ done: true }))

        options.rawPrompt = rawPrompt
        options.response = fullResponse
        req.session.chatHistory.push(options)
        req.session.save()
      })
    })
  })
}

function preprocessPrompt (options, sessionChatHistory) {
  // TODO: handle files
  if (options.files) options.prompt = `<additional-context-files>\nBelow is a list of files to use as context for this prompt where each file's contents begins with <file>name_of_file</file>\n\n${options.files}\n</additional-context-files>\n\n<prompt>\n${options.prompt}\n</prompt>`
  else options.prompt = `<prompt>\n${options.prompt}\n</prompt>`
  const chatHistory = []
  if (sessionChatHistory) {
    for (const historyItem of sessionChatHistory) {
      chatHistory.push({
        role: 'user',
        content: historyItem.prompt
      })
      chatHistory.push({
        role: 'assistant',
        content: historyItem.response
      })
    }
  }
  return {
    think: options.thinking,
    model: options.model,
    context: options.context,
    messages: chatHistory,
    prompt: options.prompt
  }
}

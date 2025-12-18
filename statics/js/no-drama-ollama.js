// this will stop the JS from executing if CSS is disabled or a CSS file fails to load; it will also remove any existing CSS from the DOM
require('check-if-css-is-disabled')()
window.addEventListener('cssDisabled', (event) => {
  // undo any DOM manipulations and then stop any further JS from executing
  document.body.classList.replace('js', 'no-js')
  throw new Error('A CSS file failed to load at some point during the app\'s usage. It is unsafe to execute any further JavaScript if the CSS has not loaded properly.')
})

// replace no-js class with js class which allows us to write css that targets non-js or js enabled users separately
document.body.classList.replace('no-js', 'js')

// semantic forms ui library js support https://github.com/kethinov/semanticforms
require('semantic-forms')()

document.getElementById('prompt').focus()

// start web socket server for llm response streaming
const socketClient = new window.WebSocket(window.location.href.replace('https://', 'wss://').replace('ws://', 'ws://'))

// submit upon hitting enter
const textarea = document.getElementById('prompt')
if (textarea) {
  textarea.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      if (!event.shiftKey) { // shift+enter allows newlines
        event.preventDefault()
        sendPrompt()
      }
    }
  })
}

// intercept form submit to stream in a response from the llm
document.querySelector('form').addEventListener('submit', sendPrompt)

// send prompt to llm over the web socket
async function sendPrompt (event) {
  if (!event || !event.submitter.id === 'clearChatHistory') {
    event?.preventDefault()
    document.getElementById('prompt').disabled = true

    // create new chat entry
    document.getElementById('chatHistory').insertAdjacentHTML('beforeend', `<article class="prompt">${document.getElementById('prompt').value}</article>`)
    document.getElementById('chatHistory').insertAdjacentHTML('beforeend', '<article class="response"></article>')

    // send to web socket server
    messageSoFar = ''
    const formData = Object.fromEntries(new FormData(document.querySelector('form')).entries())
    // TODO: convert `files` into a string-based data structure somehow
    formData.prompt = document.getElementById('prompt').value || ''
    socketClient.send(JSON.stringify(formData))

    // clear the prompt
    document.getElementById('prompt').value = ''

    // display loading bar
    document.getElementById('chatHistory').insertAdjacentHTML('beforeend', '<progress></progress>')

    // TODO: display a cancel response button; requires backend support for canceling an in-progress response
  }
}

// handle streaming response from llm
const markdownToHTML = require('models/markdownToHTML')
let messageSoFar
socketClient.onmessage = (event) => {
  const response = JSON.parse(event.data)

  if (response.chunk) {
    document.getElementsByTagName('progress')[0]?.remove()
    messageSoFar += response.chunk
    document.querySelector('#chatHistory .response:last-of-type').innerHTML = markdownToHTML(messageSoFar)
  } else if (response.done) {
    document.getElementById('prompt').disabled = false
    document.getElementById('prompt')
  }
}

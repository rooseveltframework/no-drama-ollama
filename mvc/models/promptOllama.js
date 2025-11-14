module.exports = async (options) => {
  const ollamaModule = await import('ollama')
  const ollama = ollamaModule.default

  const model = options.model || 'gpt-oss:20b'

  const messages = []
  if (options.messages) for (const message of options.messages) messages.push(message)
  messages.push({ role: 'user', content: `${options.context || ''}${options.prompt}` })
  const stream = !!options.stream

  try {
    const response = await ollama.chat({
      model,
      stream,
      system: options.context,
      messages
    })
    return response
  } catch (error) {
    if (error.message === 'fetch failed') {
      return 'Ollama timed out on your chat prompt. This can happen on slower hardware. Consider increasing the timeout by setting the `OLLAMA_LOAD_TIMEOUT` environment variable to something long, e.g. 30m'
    } else {
      console.error(error)
      return 'Unknown Ollama error'
    }
  }
}

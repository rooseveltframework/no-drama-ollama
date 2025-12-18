module.exports = async (req, res) => {
  const model = await require('models/global')(req, res)
  return model
}

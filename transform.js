const duplexify = require('duplexify')
const rdf = require('rdf-ext')
const { PassThrough } = require('readable-stream')
const Client = require('./lib/Client.js')

function transform ({ mapping, serviceUrl }) {
  const client = new Client(serviceUrl)
  const source = new PassThrough()
  const stream = duplexify(source, null, { readableObjectMode: true })

  Promise.resolve().then(async () => {
    try {
      const quadStream = await client.map(await rdf.dataset().import(mapping), source)

      stream.setReadable(quadStream)
    } catch (err) {
      stream.destroy(err)
    }
  })

  return stream
}

module.exports = transform

const duplexify = require('duplexify')
const rdf = require('rdf-ext')
const { PassThrough } = require('readable-stream')
const Client = require('./lib/Client.js')

function transform ({ mapping, mappingRaw, serviceUrl }) {
  if (mapping && mappingRaw) {
    throw new Error('mapping and mappingRaw given, but only one argument allowed')
  }

  const client = new Client(serviceUrl)
  const source = new PassThrough()
  const stream = duplexify(source, null, { readableObjectMode: true })

  Promise.resolve().then(async () => {
    try {
      const quadStream = await client.map({
        mapping: mappingRaw ? null : await rdf.dataset().import(mapping),
        mappingRaw,
        source
      })

      stream.setReadable(quadStream)
    } catch (err) {
      stream.destroy(err)
    }
  })

  return stream
}

module.exports = transform

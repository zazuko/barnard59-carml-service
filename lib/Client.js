const N3Parser = require('@rdfjs/parser-n3')
const FormData = require('form-data')
const fetch = require('nodeify-fetch')
const rdf = require('rdf-ext')

class Client {
  constructor (serviceUrl) {
    if (!serviceUrl) {
      throw new Error('no carml mapping service URL given')
    }

    this.serviceUrl = serviceUrl
  }

  async map (mapping, source) {
    const form = new FormData()

    form.append('mapping', mapping.toString(), { contentType: 'text/turtle', filename: 'mapping.nt' })
    form.append('source', source, { contentType: 'application/xml', filename: 'source.xml' })

    const res = await fetch(this.serviceUrl, {
      method: 'POST',
      headers: form.getHeaders(),
      body: form
    })

    if (!res.ok) {
      throw new Error(`server error: [${res.status}] ${res.statusText} (${await res.text()})`)
    }

    const parser = new N3Parser({ factory: rdf })
    const quadStream = parser.import(res.body)

    return quadStream
  }
}

module.exports = Client

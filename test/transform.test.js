const { rejects, strictEqual, throws } = require('assert')
const { createReadStream } = require('fs')
const { join } = require('path')
const getStream = require('get-stream')
const { isReadable, isWritable } = require('isstream')
const { describe, it } = require('mocha')
const rdf = require('rdf-ext')
const fromFile = require('rdf-utils-fs/fromFile.js')
const { Readable } = require('readable-stream')
const transform = require('../transform.js')
const ns = require('./support/namespaces.js')

const serviceUrl = 'http://localhost:8080/'
const simpleXmlFile = join(__dirname, 'support/simple.xml')
const simpleMappingFile = join(__dirname, 'support/simple.carml.ttl')

function readMapping () {
  return fromFile(simpleMappingFile)
}

describe('transform', () => {
  it('should be a factory', () => {
    strictEqual(typeof transform, 'function')
  })

  it('should throw an error if no service URL is given', () => {
    throws(() => {
      transform({})
    })
  })

  it('should return a duplex stream', async () => {
    const stream = transform({ mapping: readMapping(), serviceUrl })

    strictEqual(isReadable(stream), true)
    strictEqual(isWritable(stream), true)

    stream.end()

    try {
      await getStream(stream)
    } catch (err) {}
  })

  it('should transform the given XML stream to a QuadStream', async () => {
    const input = createReadStream(simpleXmlFile)
    const stream = transform({ mapping: readMapping(), serviceUrl })

    input.pipe(stream)
    const result = await getStream.array(stream)

    strictEqual(result.length > 0, true)
    strictEqual(result[0].termType, 'Quad')
  })

  it('should transform the given XML stream according to the given mapping stream', async () => {
    const input = createReadStream(simpleXmlFile)
    const stream = transform({ mapping: readMapping(), serviceUrl })

    input.pipe(stream)
    const result = await getStream.array(stream)

    strictEqual(result.length, 1)
    strictEqual(result[0].equals(rdf.quad(ns.ex('subject/1234'), ns.ex.value, rdf.literal('1234'))), true)
  })

  it('should transform the given XML stream according to the given raw mapping stream', async () => {
    const input = createReadStream(simpleXmlFile)
    const stream = transform({ mappingRaw: createReadStream(simpleMappingFile), serviceUrl })

    input.pipe(stream)
    const result = await getStream.array(stream)

    strictEqual(result.length, 1)
    strictEqual(result[0].equals(rdf.quad(ns.ex('subject/1234'), ns.ex.value, rdf.literal('1234'))), true)
  })

  it('should throw an error if mapping and raw mapping is given', async () => {
    throws(() => {
      transform({ mapping: readMapping(), mappingRaw: createReadStream(simpleMappingFile), serviceUrl })
    })
  })

  it('should handle transform errors', async () => {
    const input = createReadStream(simpleXmlFile)
    const mapping = Readable.from([
      rdf.quad(rdf.namedNode(''), rdf.namedNode(''), rdf.namedNode(''))
    ])
    const stream = transform({ mapping, serviceUrl })

    input.pipe(stream)

    await rejects(async () => {
      await getStream.array(stream)
    }, err => {
      strictEqual(err.message.includes('400'), true)

      return true
    })
  })
})

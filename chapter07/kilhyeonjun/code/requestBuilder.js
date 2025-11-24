import http from 'http'

export class RequestBuilder {
  constructor () {
    this.options = {}
  }

  setMethod (method) {
    this.options.method = method
    return this
  }

  setUrl (url) {
    this.url = new URL(url)
    this.options.hostname = this.url.hostname
    this.options.port = this.url.port
    this.options.path = this.url.pathname + this.url.search
    return this
  }

  setHeader (name, value) {
    if (!this.options.headers) {
      this.options.headers = {}
    }
    this.options.headers[name] = value
    return this
  }

  setBody (body) {
    this.body = body
    return this
  }

  invoke () {
    return new Promise((resolve, reject) => {
      const req = http.request(this.options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          resolve(data)
        })
      })

      req.on('error', (err) => {
        reject(err)
      })

      if (this.body) {
        req.write(this.body)
      }
      req.end()
    })
  }
}

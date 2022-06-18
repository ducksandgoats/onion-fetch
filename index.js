const router = require('tor-request')
const makeFetch = require('make-fetch')
// const fs = require('fs')
// const path = require('path')

module.exports = function makeGunFetch (opts = {}) {
  const DEFAULT_OPTS = { timeout: 30000 }
  const finalOpts = { ...DEFAULT_OPTS, ...opts }
  const SUPPORTED_METHODS = ['HEAD', 'GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
//   const hostType = '_'
  
  const useTimeOut = finalOpts.timeout

//   if (fileLocation && (!fs.existsSync(fileLocation))) {
//     fs.mkdirSync(fileLocation)
//   }

  const fetch = makeFetch(async (request) => {

    const { url, method, headers, body } = request

    try {

      const { hostname, pathname, protocol, search, searchParams } = new URL(url)

      if ((protocol !== 'tor:' && protocol !== 'tors:') || !method || !SUPPORTED_METHODS.includes(method)) {
        throw new Error(`request is not correct, protocol must be tor:// or tors://, method must be one of the following ${SUPPORTED_METHODS}`)
      }

      const mainProtocol = protocol.includes('s') ? 'https://' : 'http://'

      const opts = {url: mainProtocol + hostname + pathname, headers, qs: search, timeout: (headers['x-timer'] && headers['x-timer'] !== '0') || (searchParams.has('x-timer') && searchParams.get('x-timer') !== '0') ? Number(headers['x-timer'] || searchParams.get('x-timer')) * 1000 : useTimeOut}

      if(method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE'){
        opts.body = body
      }

      const res = await new Promise((resolve, reject) => {
        if(hostname.endsWith('.onion')){
            router.torRequest(opts, (error, response) => {
                if(error){
                    reject(error)
                } else {
                    resolve(response)
                }
            })
        } else {
            router.request(opts, (error, response) => {
                if(error){
                    reject(error)
                } else {
                    resolve(response)
                }
            })
        }
    })
    return {statusCode: res.statusCode, headers: res.headers, data: [res.body]}
    } catch (e) {
      return { statusCode: 500, headers: {}, data: [JSON.stringify(e)]}
    }
  })

  return fetch
}

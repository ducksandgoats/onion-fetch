// const router = require('tor-request')
const makeFetch = require('make-fetch')
const torAxios = require('tor-axios')
// const fs = require('fs')
// const path = require('path')

module.exports = function makeGunFetch (opts = {}) {
  const DEFAULT_OPTS = { timeout: 30000 }
  const finalOpts = { ...DEFAULT_OPTS, ...opts }
  // const SUPPORTED_METHODS = ['HEAD', 'GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
//   const hostType = '_'
  const tor = torAxios.torSetup({
    ip: 'localhost',
    port: 9050
  })
  
  const useTimeOut = finalOpts.timeout

//   if (fileLocation && (!fs.existsSync(fileLocation))) {
//     fs.mkdirSync(fileLocation)
//   }

  const fetch = makeFetch(async (request) => {

    // const { url, method, headers, body } = request

    try {

      const mainURL = new URL(request.url)

      if ((mainURL.protocol !== 'tor:' && mainURL.protocol !== 'tors:') || !request.method) {
        throw new Error(`request is not correct, protocol must be tor:// or tors://, or requires a method`)
      }

      const mainProtocol = protocol.includes('s') ? 'https:' : 'http:'

      request.url = request.url.replace(mainURL.protocol, mainProtocol)

      request.timeout = (request.headers['x-timer'] && request.headers['x-timer'] !== '0') || (request.searchParams.has('x-timer') && request.searchParams.get('x-timer') !== '0') ? Number(request.headers['x-timer'] || request.searchParams.get('x-timer')) * 1000 : useTimeOut

      if(request.method === 'POST' || request.method === 'PATCH' || request.method === 'PUT' || request.method === 'DELETE'){
        const getTheBody = request.body
        request.data = getTheBody
        delete request.body
      }
      request.transformResponse = []

    //   const res = await new Promise((resolve, reject) => {
    //     if(hostname.endsWith('.onion')){
    //         router.torRequest(opts, (error, response) => {
    //             if(error){
    //                 reject(error)
    //             } else {
    //                 resolve(response)
    //             }
    //         })
    //     } else {
    //         router.request(opts, (error, response) => {
    //             if(error){
    //                 reject(error)
    //             } else {
    //                 resolve(response)
    //             }
    //         })
    //     }
    // })
    const res = await tor.request(request)
    return {statusCode: res.status, headers: res.headers, data: [res.data]}
    } catch (e) {
      return { statusCode: 500, headers: {}, data: [JSON.stringify(e)]}
    }
  })

  return fetch
}

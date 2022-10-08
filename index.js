const makeFetch = require('make-fetch')

module.exports = function makeOnionFetch (opts = {}) {
  const DEFAULT_OPTS = { timeout: 30000 }
  const finalOpts = { ...DEFAULT_OPTS, ...opts }
  const tor = require('tor-request')
  
  const useTimeOut = finalOpts.timeout

  const fetch = makeFetch(async (request) => {

    // const { url, method, headers, body } = request

    try {

      const mainURL = new URL(request.url)

      if ((mainURL.protocol !== 'tor:' && mainURL.protocol !== 'tors:') || !request.method) {
        throw new Error(`request is not correct, protocol must be tor:// or tors://, or requires a method`)
      }

      const mainProtocol = mainURL.protocol.includes('s') ? 'https:' : 'http:'

      request.url = request.url.replace(mainURL.protocol, mainProtocol)

      request.timeout = (request.headers['x-timer'] && request.headers['x-timer'] !== '0') || (mainURL.searchParams.has('x-timer') && mainURL.searchParams.get('x-timer') !== '0') ? Number(request.headers['x-timer'] || mainURL.searchParams.get('x-timer')) * 1000 : useTimeOut

      // request.transformResponse = x => x

      // if(request.method === 'POST' || request.method === 'PATCH' || request.method === 'PUT' || request.method === 'DELETE'){
      //   const getTheBody = request.body
      //   request.data = getTheBody
      //   delete request.body
      // }

      const res = await new Promise((resolve, reject) => {
        tor.request(request.url, request, (error, response, body) => {
          if(error){
              reject(error)
          } else {
              resolve({statusCode: response.statusCode, headers: response.headers, data: body})
          }
      })
    })
    // await tor.request(request)
    return {statusCode: res.status, headers: res.headers, data: [res.body]}
    } catch (e) {
      return { statusCode: 500, headers: {}, data: [JSON.stringify(e)]}
    }
  })

  return fetch
}
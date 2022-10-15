const makeFetch = require('make-fetch')
const torAxios = require('tor-axios')

module.exports = function makeGunFetch (opts = {}) {
  const DEFAULT_OPTS = { timeout: 30000 }
  const finalOpts = { ...DEFAULT_OPTS, ...opts }
  const tor = torAxios.torSetup({
    ip: 'localhost',
    port: 9050
  })
  const useTimeOut = finalOpts.timeout

  function takeCareOfIt(data){
    console.log(data)
    throw new Error('aborted')
  }

  const fetch = makeFetch(async (request) => {

    if(request.signal){
      request.signal.addEventListener('abort', takeCareOfIt)
    }

    try {

      const mainURL = new URL(request.url)

      if ((mainURL.protocol !== 'tor:' && mainURL.protocol !== 'tors:') || !request.method) {
        throw new Error(`request is not correct, protocol must be tor:// or tors://, or requires a method`)
      }

      const mainProtocol = mainURL.protocol.includes('s') ? 'https:' : 'http:'

      request.url = request.url.replace(mainURL.protocol, mainProtocol)

      request.timeout = (request.headers['x-timer'] && request.headers['x-timer'] !== '0') || (mainURL.searchParams.has('x-timer') && mainURL.searchParams.get('x-timer') !== '0') ? Number(request.headers['x-timer'] || mainURL.searchParams.get('x-timer')) * 1000 : useTimeOut

      request.transformResponse = x => x

      if(request.method === 'POST' || request.method === 'PATCH' || request.method === 'PUT' || request.method === 'DELETE'){
        const getTheBody = request.body
        request.data = getTheBody
        delete request.body
      }

    const res = await tor.request(request)
    if(request.signal){
      request.signal.removeEventListener('abort', takeCareOfIt)
    }
    return {statusCode: res.status, headers: res.headers, data: [res.data]}
    } catch (e) {
      if(request.signal){
        request.signal.removeEventListener('abort', takeCareOfIt)
      }
      return { statusCode: 500, headers: {}, data: [e.name]}
    }
  })

  return fetch
}
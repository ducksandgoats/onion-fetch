const makeFetch = require('make-fetch')
const torAxios = require('tor-axios')
const detect = require('detect-port')

module.exports = function makeGunFetch (opts = {}) {
  const DEFAULT_OPTS = { timeout: 30000 }
  const finalOpts = { ...DEFAULT_OPTS, ...opts }
  const tor = torAxios.torSetup({
    ip: 'localhost',
    port: 9050
  })
  const checkPort = 9050
  const useTimeOut = finalOpts.timeout

  function takeCareOfIt(data){
    console.log(data)
    throw new Error('aborted')
  }

  function sendTheData(theSignal, theData){
    if(theSignal){
      theSignal.removeEventListener('abort', takeCareOfIt)
    }
    return theData
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

      if(mainURL.hostname === '_'){
        const mainReq = !request.accept || !request.accept.includes('application/json')
        const mainRes = mainReq ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8'
        const detectedPort = await detect(checkPort)
        const isItRunning = checkPort !== detectedPort
        return sendTheData(request.signal, {statusCode: 200, headers: {'Content-Type': mainRes}, data: mainReq ? [`<html><head><title>${mainURL.toString()}</title></head><body><p>${isItRunning}</p></body></html>`] : [JSON.stringify(isItRunning)]})
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
    return sendTheData(request.signal, {statusCode: res.status, headers: res.headers, data: [res.data]})
    } catch(e){
      return sendTheData(request.signal, {statusCode: 500, headers: {}, data: [e.name]})
    }
  })

  return fetch
}
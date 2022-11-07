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
        const detectedPort = await detect(checkPort)
        const isItRunning = checkPort !== detectedPort
        return sendTheData(request.signal, {statusCode: 200, headers: {'Content-Type': 'text/plain; charset=utf-8'}, data: [String(isItRunning)]})
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
      const {mainHead, mainData} = (() => {
        if(request.headers.accept){
          if(request.headers.accept.includes('text/html')){
            return {mainHead: 'text/html; charset=utf-8', mainData: [`<html><head><title>${request.url.toString()}</title></head><body><p>${e.name}</p></body></html>`]}
          } else if(request.headers.accept.includes('application/json')){
            return {mainHead: 'application/json; charset=utf-8', mainData: [JSON.stringify(e.name)]}
          } else if(request.headers.accept.includes('text/plain')){
            return {mainHead: 'text/plain; charset=utf-8', mainData: [e.name]}
          } else {
            return {mainHead: 'text/plain; charset=utf-8', mainData: [e.name]}
          }
        } else {
          return {mainHead: 'text/plain; charset=utf-8', mainData: [e.name]}
        }
      })()
      return sendTheData(request.signal, {statusCode: 500, headers: {'X-Error': e.name, 'Content-Type': mainHead}, data: mainData})
    }
  })

  return fetch
}
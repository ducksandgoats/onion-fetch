module.exports = async function makeOnionFetch (opts = {}) {
  const {makeFetch} = await import('make-fetch')
  const {got} = await import('got')
  const detect = require('detect-port')
  const SocksProxyAgent = require('socks-proxy-agent').SocksProxyAgent
  const finalOpts = { timeout: 30000, ...opts }
  const mainData = {ip: 'localhost', port: 9050}
  const useTimeOut = finalOpts.timeout

  const fetch = makeFetch(async (request) => {
    
    try {

      if ((!request.url.startsWith('tor:') && !request.url.startsWith('tors:')) || !request.method) {
        throw new Error(`request is not correct, protocol must be tor:// or tors://, or requires a method`)
      }

      if(mainURL.hostname === '_'){
        const detectedPort = await detect(mainData.port)
        const isItRunning = mainData.port !== detectedPort
        return {statusCode: 200, headers: {'Content-Type': 'text/plain; charset=utf-8'}, data: [String(isItRunning)]}
      }

      request.url = request.url.replace('tor', 'http')

      request.timeout = {request: (request.headers['x-timer'] && request.headers['x-timer'] !== '0') || (mainURL.searchParams.has('x-timer') && mainURL.searchParams.get('x-timer') !== '0') ? Number(request.headers['x-timer'] || mainURL.searchParams.get('x-timer')) * 1000 : useTimeOut}
      request.agent = { 'http': new SocksProxyAgent(`socks5h://${mainData.ip}:${mainData.port}`), 'https': new SocksProxyAgent(`socks5h://${mainData.ip}:${mainData.port}`) }

      delete request.referrer
      if(request.method === 'CONNECT' || request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS' || request.method === 'TRACE'){
        delete request.body
      }
      if(!request.signal){
        delete request.signal
      }

      const res = await got(request)
      return {statusCode: res.statusCode, headers: res.headers, data: [res.body]}
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
      return {statusCode: 500, headers: {'X-Error': e.name, 'Content-Type': mainHead}, data: mainData}
    }
  })

  return fetch
}
module.exports = async function makeOnionFetch (opts = {}) {
  const { makeRoutedFetch } = await import('make-fetch')
  const {fetch, router} = makeRoutedFetch()
  const {got} = await import('got')
  const detect = require('detect-port')
  const SocksProxyAgent = require('socks-proxy-agent').SocksProxyAgent
  const finalOpts = { timeout: 30000, ...opts }
  const mainData = {ip: 'localhost', port: 9050}
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

  async function handleTor(request) {
    const { url, method, headers: reqHeaders, body, signal, referrer } = request

    if(signal){
      signal.addEventListener('abort', takeCareOfIt)
    }
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
      return sendTheData(signal, {statusCode: res.statusCode, headers: res.headers, data: [res.body]})
  }

  async function handleTors(request) {
    const { url, method, headers: reqHeaders, body, signal, referrer } = request

    if(signal){
      signal.addEventListener('abort', takeCareOfIt)
    }
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
    return sendTheData(signal, {statusCode: res.statusCode, headers: res.headers, data: [res.body]})
  }
  
  router.any('tor://*/**', handleTor)
  router.any('tors://*/**', handleTors)

  return fetch
}
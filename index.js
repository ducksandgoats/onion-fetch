module.exports = async function makeOnionFetch (opts = {}) {
  const { makeRoutedFetch } = await import('make-fetch')
  const {fetch, router} = makeRoutedFetch()
  const { default: nodeFetch } = await import('node-fetch')
  const detect = require('detect-port')
  const SocksProxyAgent = require('socks-proxy-agent').SocksProxyAgent
  const finalOpts = { timeout: 30000, ...opts }
  const mainData = {ip: '127.0.0.1', port: 9050}
  const useTimeOut = finalOpts.timeout
  const mainAgents = { 'http': new SocksProxyAgent(`socks5h://${mainData.ip}:${mainData.port}`), 'https': new SocksProxyAgent(`socks5h://${mainData.ip}:${mainData.port}`) }

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

function useAgent(_parsedURL) {
		if (_parsedURL.protocol === 'http:') {
			return mainAgents.http;
		} else if(_parsedURL.protocol === 'https:'){
			return mainAgents.https;
    } else {
      throw new Error('protocol is not valid')
    }
	}

  async function handleTor(request) {
    const { url, method, headers: reqHeaders, body, signal, referrer } = request

    if(signal){
      signal.addEventListener('abort', takeCareOfIt)
    }

    const mainURL = new URL(url)

      if(mainURL.hostname === '_'){
        const detectedPort = await detect(mainData.port)
        const isItRunning = mainData.port !== detectedPort
        return {status: 200, headers: {'Content-Type': 'text/plain; charset=utf-8'}, body: [String(isItRunning)]}
    }

    request.agent = useAgent
    const useLink = request.url.replace('tor', 'http')
    delete request.url
    const mainTimeout = (request.headers['x-timer'] && request.headers['x-timer'] !== '0') || (mainURL.searchParams.has('x-timer') && mainURL.searchParams.get('x-timer') !== '0') ? Number(request.headers['x-timer'] || mainURL.searchParams.get('x-timer')) * 1000 : useTimeOut

    const res = await Promise.race([
      nodeFetch(useLink, request),
      new Promise((resolve) => setTimeout(resolve, mainTimeout))
    ])
      return sendTheData(signal, {status: res.status, headers: res.headers, body: [res.body]})
  }

  async function handleTors(request) {
    const { url, method, headers: reqHeaders, body, signal, referrer } = request

    if(signal){
      signal.addEventListener('abort', takeCareOfIt)
    }

    const mainURL = new URL(url)

      if(mainURL.hostname === '_'){
        const detectedPort = await detect(mainData.port)
        const isItRunning = mainData.port !== detectedPort
        return {status: 200, headers: {'Content-Type': 'text/plain; charset=utf-8'}, body: [String(isItRunning)]}
      }

    request.agent = useAgent
    const useLink = request.url.replace('tor', 'http')
    delete request.url
    const mainTimeout = (request.headers['x-timer'] && request.headers['x-timer'] !== '0') || (mainURL.searchParams.has('x-timer') && mainURL.searchParams.get('x-timer') !== '0') ? Number(request.headers['x-timer'] || mainURL.searchParams.get('x-timer')) * 1000 : useTimeOut

    const res = await Promise.race([
      nodeFetch(useLink, request),
      new Promise((resolve) => setTimeout(resolve, mainTimeout))
    ])
    return sendTheData(signal, {status: res.status, headers: res.headers, body: [res.body]})
  }
  
  router.any('tor://*/**', handleTor)
  router.any('tors://*/**', handleTors)

  return fetch
}
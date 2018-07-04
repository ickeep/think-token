'use strict'

const JWT = require('jsonwebtoken')

module.exports = (app) => {
  function getConf(opts) {
    const dfOpts = {
      name: 'token',
      key: 'id',
      checkField: 'password',
      secret: 'fullBase',
      cachePrefix: 'token-full',
      setCookie: false
    }
    const dfConfig = think.config('token')
    return Object.assign(dfOpts, dfConfig, opts)
  }

  function getToken(opts) {
    const config = getConf(opts)
    const tokenName = config.name
    const isSetCookie = config.setCookie
    let tokenValue = ''
    if (isSetCookie) {
      tokenValue = this.cookie(tokenName) || this.header(tokenName)
    } else {
      tokenValue = this.header(tokenName) || this.cookie(tokenName)
    }
    if (!tokenValue) {
      app.think.logger.error(`${tokenName} 的值不能为空，请在 header or post or cookie 传值`)
      return null
    }
    return tokenValue
  }

  function setToken(opts) {
    const config = getConf(opts)
    const secret = config.secret
    const tokenName = config.name
    const uuid = app.think.uuid('v1')
    const isSetCookie = config.setCookie
    const time = new Date().getTime()
    const sign = JWT.sign({ uuid, time }, secret)
    if (isSetCookie) {
      this.setCookie(tokenName, sign)
    } else {
      this.header(tokenName, sign)
    }

    return { sign, uuid, time }
  }

  async function vToken(value, secret) {
    return new Promise((resolve) => { // 返回对像，不抛错误
      JWT.verify(value, secret, (err, decoded) => {
          if (err) {
            app.think.logger.error(`${err.name} - ${err.message}`)
          }
          resolve(err || decoded)
        }
      )
    })
  }

  async function getValue(name, opts) {
    const config = getConf(opts)
    const tokenValue = getToken.call(this, opts)
    if (!tokenValue) {
      return null
    }
    const key = config.key
    const checkField = config.checkField
    const secret = config.secret
    const decoded = await vToken(tokenValue, secret)
    const uuid = decoded.uuid
    if (!uuid) {
      return null
    }
    const tmpCacheKey = `${config.cachePrefix}-${uuid}-${name}`
    const tmpValue = await app.think.cache(tmpCacheKey)
    if (typeof tmpValue === 'undefined') {
      return null
    }

    // 校验的值 通常是用户密码 存在则需要校验 用于用户修改密码，让其他 Token 失效
    const checkValue = tmpValue[checkField]
    // 不需要校验
    if (!(tmpValue[key] && checkValue)) {
      return tmpValue
    }

    const cacheKey = `${config.cachePrefix}-${name}-${tmpValue[key]}`
    const value = await app.think.cache(cacheKey)
    if (typeof value === 'undefined') {
      return null
    }
    if (checkValue !== value[checkField]) {
      return null
    }
    return value
  }

  async function setValue(name, value, opts) {
    const config = getConf(opts)
    const key = config.key
    const secret = config.secret
    const cachePrefix = config.cachePrefix
    const checkField = config.checkField
    let uuid = ''
    let time = ''
    let tokenValue = getToken.call(this, opts)
    if (tokenValue) {
      const decoded = await vToken(tokenValue, secret)
      uuid = decoded.uuid
      time = decoded.time
    }
    if (!uuid) {
      if (value === null) {
        return ''
      }
      const tokenObj = setToken.call(this, opts)
      uuid = tokenObj.uuid
      tokenValue = tokenObj.sign
      time = tokenObj.time
    }
    const tmpCacheKey = `${cachePrefix}-${uuid}-${name}`

    // 需要二次缓存 做校验
    if (value && value[key] && value[checkField]) {
      const tmpObj = {}
      tmpObj[key] = value[key]
      tmpObj[checkField] = value[checkField]
      app.think.cache(tmpCacheKey, tmpObj)
      const cacheKey = `${cachePrefix}-${name}-${value[key]}`
      app.think.cache(cacheKey, value)
    } else {
      app.think.cache(tmpCacheKey, value)
    }

    return { token: tokenValue, uuid, time }
  }

  async function token(name, value, opts = {}) {
    if (!think.isString(name)) {
      app.think.loader.error('参数name必须为字符串')
      return null
    }
    // 取值
    if (!(value || value === 0 || value === null || value === '')) {
      return getValue.call(this, name, opts)
    }
    return setValue.call(this, name, value, opts)
  }

  async function clearToken(name, id) {
    const config = getConf(opts)
    const cachePrefix = config.cachePrefix
    const cacheKey = `${cachePrefix}-${name}-${id}`
    return this.cache(cacheKey, null);
  }

  return {
    context: {
      token,
      clearToken
    },
    controller: {
      token,
      clearToken
    },
    service: {
      token,
      clearToken
    }
  }
}


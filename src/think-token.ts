import { Application } from 'thinkjs'
import JWT from 'jsonwebtoken'

export interface IConf {
  name?: string,
  key?: string,
  checkField?: string,
  secret?: string,
  cachePrefix?: string,
  setCookie?: boolean
}

export default (app: Application) => {
  const think: any = app.think

  function getConf(opts: IConf = {}) {
    const dfOpts = {
      name: 'authorization',
      key: 'id',
      checkField: 'password',
      secret: 'fullBase',
      cachePrefix: 'fn-token-',
      setCookie: false
    }
    const dfConfig = think.config('token')
    return Object.assign(dfOpts, dfConfig, opts)
  }

  function getToken(opts: IConf = {}) {
    const config = getConf(opts)
    const tokenName = config.name
    const isSetCookie = config.setCookie
    let tokenValue = ''
    if (isSetCookie) {
      // @ts-ignore
      tokenValue = this.cookie(tokenName) || this.header(tokenName)
    } else {
      // @ts-ignore
      tokenValue = this.header(tokenName) || this.cookie(tokenName)
    }
    if (!tokenValue) {
      // app.think.logger.error(`${tokenName} 的值不能为空，请在 header or post or cookie 传值`)
      return null
    }
    return tokenValue.replace(/^Bearer\s/, '')
  }

  function setToken(opts: IConf, value: any = {}): { [key: string]: any } {
    const config = getConf(opts)
    const secret = config.secret
    const tokenName = config.name
    const { key, checkField } = config
    const keyVal = value[key]
    const checkVal = value[checkField]
    const jwtOpt: { [key: string]: any } = { time: new Date().getTime() }
    // 二次检验
    if (value && keyVal && checkVal) {
      jwtOpt[key] = keyVal
      jwtOpt[checkField] = checkVal
    } else {
      // @ts-ignore
      jwtOpt.uuid = app.think.uuid('v1')
    }
    const isSetCookie = config.setCookie
    const sign = JWT.sign(jwtOpt, secret)
    if (isSetCookie) {
      // @ts-ignore
      this.setCookie(tokenName, sign)
    } else {
      // @ts-ignore
      this.header(tokenName, sign)
    }

    return { sign, ...jwtOpt }
  }

  async function vToken(value: string, secret: string) {
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

  async function getValue(name: string, opts: IConf) {
    const config = getConf(opts)
    // @ts-ignore
    const tokenValue = getToken.call(this, opts)
    if (!tokenValue) {
      return null
    }
    const { key, checkField, secret, cachePrefix } = config
    const decoded: any = await vToken(tokenValue, secret)

    const keyVal = decoded[key]
    const checkVal = decoded[checkField]
    // 二次检验
    if (decoded && keyVal && checkVal) {
      const value = await think.cache(`${cachePrefix}-${keyVal}-${name}`)
      return value[checkField] === checkVal ? value : null
    } else {
      const uuid = decoded.uuid
      if (!uuid) {
        return null
      }
      const cacheKey = `${cachePrefix}-${uuid}-${name}`
      return think.cache(cacheKey)
    }
  }

  async function setValue(name: string, value: any, opts: IConf) {
    const config = getConf(opts)
    const { key, secret, cachePrefix, checkField } = config
    let uuid = ''
    let time = 0
    const keyVal = value[key]
    const checkVal = value[checkField]
    if (value && keyVal && checkVal) { // 二次校验直接更新 token
      // @ts-ignore
      const tokenObj = setToken.call(this, opts, value)
      const cacheKey = `${cachePrefix}-${value[key]}-${name}`
      think.cache(cacheKey, value)
      return { time: tokenObj.time, token: tokenObj.sign }
    } else {
      // @ts-ignore
      let tokenValue = getToken.call(this, opts)
      if (tokenValue) { // 不需要更新 token
        const decoded: any = await vToken(tokenValue, secret)
        uuid = decoded.uuid
        time = decoded.time
      }
      if (!uuid) {
        if (value === null) {
          return ''
        }
        // @ts-ignore
        const tokenObj = setToken.call(this, opts)
        uuid = tokenObj.uuid
        tokenValue = tokenObj.sign
        time = tokenObj.time
      }
      const tmpCacheKey = `${cachePrefix}-${uuid}-${name}`
      think.cache(tmpCacheKey, value)
      return { token: tokenValue, uuid, time }
    }
  }

  async function token(name: string, value?: any, opts: IConf = {}) {
    if (!think.isString(name)) {
      think.loader.error('参数name必须为字符串')
      return null
    }
    // 取值
    if (!(value || value === 0 || value === null || value === '')) {
      // @ts-ignore
      return getValue.call(this, name, opts)
    }
    // @ts-ignore
    return setValue.call(this, name, value, opts)
  }

  async function clearToken(name: string, id: string | number, opts: IConf) {
    const config = getConf(opts)
    const cachePrefix = config.cachePrefix
    const cacheKey = `${cachePrefix}-${name}-${id}`
    return think.cache(cacheKey, null)
  }

  async function manageToken(name: string, id: string | number, newVal: any, opts: IConf) {
    const config = getConf(opts)
    const cachePrefix = config.cachePrefix
    const cacheKey = `${cachePrefix}-${name}-${id}`
    if (typeof newVal === 'object') {
      const oldVal = await think.cache(cacheKey)
      if (typeof oldVal === 'object') {
        return think.cache(cacheKey, Object.assign(oldVal, newVal))
      }
      return think.cache(cacheKey, newVal)
    }
    return think.cache(cacheKey, newVal)
  }

  return {
    context: {
      token,
      clearToken,
      manageToken
    },
    controller: {
      token,
      clearToken,
      manageToken
    },
    service: {
      token,
      clearToken,
      manageToken
    }
  }
}

export interface Token {
  token: (name: string, value?: any, opts?: IConf) => Promise<any>,
  clearToken: (name: string, id: string | number, opts?: IConf) => Promise<null>,
  manageToken: (name: string, id: string | number, newVal: any, opts?: IConf) => Promise<any>
}

declare module 'thinkjs' {
  interface Context extends Token {
  }

  interface Controller extends Token {
  }
}

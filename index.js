const JWT = require('jsonwebtoken')

async function vToken(value, secret) {
  return new Promise((resolve) => { // 返回对像，不抛错误
    JWT.verify(value, secret, (err, decoded) => {
        if (err) {
          console.error(`${err.name} - ${err.message}`)
        }
        resolve(err || decoded)
      }
    )
  })
}

async function token(name, value, opts = {}) {
  if (!think.isString(name)) {
    console.error('参数name必须为字符串')
    return null
  }

  const dfConfig = think.config('token')
  const config = Object.assign(dfConfig, opts)
  const key = config.key || 'id'
  const tokenName = config.name || 'token'
  const secret = config.secret || 'token_secret_asdfasdfasf'
  const timeout = config.timeout || 7 * 24 * 60 * 60 * 1000
  const isSetCookie = config.setcookie || false
  const cacheKey = `token-${name}-${key}`

  // 取值
  if (!value) {
    let tokenValue = ''
    if (isSetCookie) {
      tokenValue = this.cookie(tokenName) || this.header(tokenName)
    } else {
      tokenValue = this.header(tokenName) || this.cookie(tokenName)
    }
    if (!token) {
      console.error(`${tokenName} 的值不能为空，请在 header or post or cookie 传值`)
      return null
    }
    const decoded = await vToken(tokenValue, secret)
    if (decoded[key]) {
      console.log(decoded)
      return think.cache(cacheKey)
    }
    return null
  }

  // 设值
  if (!think.isObject(value)) {
    console.error('参数value必须为一个对象')
    return null
  }

  if (!value[key]) {
    console.error(`value的键${key}必须有值，建议为用户id`)
    return null
  }

  const tmpObj = {}
  tmpObj[key] = value[key]

  const sign = JWT.sign(tmpObj, secret, { expiresIn: timeout / 1000 })
  if (isSetCookie) {
    this.setCookie(tokenName, sign, { timeout })
  } else {
    this.header(tokenName, sign)
  }
  think.cache(cacheKey, value, { timeout })
  return sign
}

module.exports = {
  context: {
    token
  },
  controller: {
    token
  }
}

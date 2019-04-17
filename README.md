# think-token
利用 JWT 和 think.cache 实现用户认证

用法与 this.session() 相似

### 配置
``` js
token: {
    key: 'id', // 设置用户信息对象的唯一key 建议为用户id
    checkField: 'password', // 校验的字段 通常是用户密码 存在则需要校验 用于用户修改密码，让其他 Token 失效
    cachePrefix: 'token-full', // 缓存前缀 防止缓存冲突
    secret: 'jwt secret', // jwt secret 必填 并且需保密好 不能泄露
    name: 'token', //  读取 token 的字段，默认为 'token'
    setCookie: false  // 是否设置 cookie 默认不设置，从 header 头读取，如果设置，当读配置中 cookie 等于配置字段中 name 的值
}
``` 

### 使用
设置

opts 允许设置配置信息
``` js
const token = await this.token('userInfo', { id: 1, name: '用户', mail: 'ickeep', password: '123456' }, opts)
``` 
读取

``` js
const userInfo = await this.token('userInfo')
```

清除
用于 管理员 冻结用户
``` js
const userInfo = await this.clearToken('userInfo', 1, opts)
```
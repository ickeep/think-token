declare module 'thinkjs' {
  interface Context extends ThinkToken.TokenExtend {
  }

  interface Controller extends ThinkToken.TokenExtend {
  }
}
type IName = string
type IValue = string | { [key: string]: any }
type IOpt = {
  name?: string,
  key?: string,
  checkField?: string,
  secret?: string,
  cachePrefix?: string,
  setCookie?: false
}
type IR = Promise<string | { [key: string]: any }>

declare namespace ThinkToken {
  interface TokenExtend {
    /**
     * get token
     * @memberOf TokenExtend
     */
    token(name: IName): IR;

    /**
     * set token
     * @memberOf TokenExtend
     */
    token(name: IName, value: IValue): IR;

    /**
     * delete the whole token
     * @memberOf TokenExtend
     */
    token(name: null): IR;

    clearToken(name: IName, id: string, opts?: IOpt): void;

    manageToken(name: IName, id: string, newVal: any, opts?: IOpt): void
  }
}

export = ThinkToken;

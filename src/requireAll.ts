import RequireContext = __WebpackModuleApi.RequireContext

export default function requireAll (r: RequireContext) {
  const o: {[key: string]: any} = {}
  for (let fileName of r.keys()) {
    o[fileName] = r(fileName)
  }
  return o
}

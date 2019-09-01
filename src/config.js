export const bareConfig = { url: '', paths: [] }

export const addPath = (config, path) => {
  const nextConfig = JSON.parse(JSON.stringify(config))
  nextConfig.paths.push({ path })
  return nextConfig
}

export const removePath = (config, path) => {
  const nextConfig = JSON.parse(JSON.stringify(config))
  nextConfig.paths = nextConfig.paths.filter(p => p.path !== path)
  return nextConfig
}

export const raisePath = (config, path) => {
  const nextConfig = JSON.parse(JSON.stringify(config))
  const index = nextConfig.paths.findIndex(p => p.path === path)
  const current = nextConfig.paths[index]
  nextConfig.paths[index] = nextConfig.paths[index - 1]
  nextConfig.paths[index - 1] = current
  return nextConfig
}

export const lowerPath = (config, path) => {
  const nextConfig = JSON.parse(JSON.stringify(config))
  const index = nextConfig.paths.findIndex(p => p.path === path)
  const current = nextConfig.paths[index]
  nextConfig.paths[index] = nextConfig.paths[index + 1]
  nextConfig.paths[index + 1] = current
  return nextConfig
}

export const setValues = (config, path, values) => {
  const nextConfig = JSON.parse(JSON.stringify(config))
  nextConfig.paths.find(p => p.path === path).values = values
  return nextConfig
}

export const setPathSearch = (config, path, search) => {
  const nextConfig = JSON.parse(JSON.stringify(config))
  nextConfig.paths.find(p => p.path === path).search = search
  return nextConfig
}
import React from 'react'
import { Box, Button,  RadioButton, Select, Text, TextInput } from 'grommet'
import { Add, Close, Down, Up, } from 'grommet-icons'
import {
  addPath, removePath, raisePath, lowerPath, setPathSearch, setValues,
} from './config'

const Build = ({ config, setConfig, dataProps }) => {
  const [search, setSearch] = React.useState('')

  const searchExp = search ? new RegExp(search, 'i') : undefined

  return (
    <Box
      flex={false}
      overflow="auto"
      background="dark-1"
      pad="medium"
      gap="medium"
    >
      <Box flex={false}>
        <TextInput
          placeholder="search property names"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Box>

      <Box flex={false}>
        {config.paths
        // omit object properties which aren't columns
        .filter(({ path }) =>
          !dataProps.some(p => p.property === path && p.dataProps))
        .filter(({ path }) => !search || searchExp.test(path))
        .map(({ path, search, values }) => {
          const dataProp = dataProps.find(p => p.property === path)
          return (
            <Box
              key={path}
              direction="row"
              align="center"
              justify="between"
            >
              <Text margin={{ horizontal: 'small' }}>
                {path}
              </Text>
              <Box flex={false} direction="row" align="center">
                <RadioButton
                  name="primaryKey"
                  checked={config.primaryKey === path}
                  onChange={() => {
                    const nextConfig = JSON.parse(JSON.stringify(config))
                    nextConfig.primaryKey = path
                    setConfig(nextConfig)
                  }}
                />
                <Box flex={false} width="small">
                  {dataProp.options ? (
                    <Select
                      multiple
                      options={dataProp.options}
                      value={values || []}
                      onChange={(event) =>
                        setConfig(setValues(config, path, event.value))}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <TextInput
                      placeholder="search"
                      value={search || ''}
                      onChange={(event) =>
                        setConfig(setPathSearch(config, path, event.target.value))}
                      style={{ width: '100%' }}
                    />
                  )}
                </Box>
                <Box flex={false} direction="row">
                  <Button
                    icon={<Up />}
                    hoverIndicator
                    disabled={!config.paths.findIndex(p => p.path === path)}
                    onClick={() => setConfig(raisePath(config, path))}
                  />
                  <Button
                    icon={<Down />}
                    hoverIndicator
                    disabled={config.paths
                      .findIndex(p => p.path === path) >= config.paths.length - 1}
                    onClick={() => setConfig(lowerPath(config, path))}
                  />
                  <Button
                    icon={<Close />}
                    hoverIndicator
                    onClick={() => setConfig(removePath(config, path))}
                  />
                </Box>
              </Box>
            </Box>
          )
        })}
      </Box>

      <Box flex={false} margin={{ top: 'small' }} border="top" pad={{ top: 'small' }}>
        {dataProps
        .filter(p =>
          !config.paths.some(({ path }) => (path === p.property && !p.dataProps)))
        .filter(p => !search || searchExp.test(p.property))
        .map(property => (
          <Box key={property.property}>
            <Box direction="row" align="center" justify="between">
              <Text margin={{ horizontal: 'small' }}>
                {property.property}
              </Text>
              <Box flex="shrink" direction="row" align="center" justify="end">
                <Box width="small" flex="shrink">
                  <Text color="light-4" truncate>
                    {property.example}
                  </Text>
                </Box>
                <Button
                  icon={<Add color="dark-4" />}
                  hoverIndicator
                  onClick={() =>
                    setConfig(addPath(config, property.property))}
                />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default Build;

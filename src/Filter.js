import React from 'react'
import { Box, DropButton, Select, Text, TextInput } from 'grommet'
import { Filter as FilterIcon } from 'grommet-icons'
import { setPathSearch, setValues } from './config'

const Filter = ({ config, setConfig, dataProps }) => {
  return (
    <DropButton
      icon={<FilterIcon />}
      hoverIndicator
      dropAlign={{ top: 'bottom', right: 'right' }}
      dropContent={(
        <Box pad="medium" gap="small">
          {config.paths.map(({ path, search, values }) => {
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
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
    />
  );
}

export default Filter;

import React from 'react'
import {
  Box, Button, DataTable, Form, FormField, Heading, Grommet, Image, Layer,
  Paragraph, RadioButton, Select, Text, TextArea, TextInput,
  grommet,
} from 'grommet'
import {
  Add, Checkmark, Close, Down, Next, Previous, Unlink, Up,
} from 'grommet-icons'
import {
  bareConfig, addPath, removePath, raisePath, lowerPath, setPathSearch, setValues,
} from './config'

// const url = 'https://api.spacexdata.com/v3/launches/past?order=desc';
// const primaryKey = 'flight_number';

const datumValue = (datum, property) => {
  const parts = property.split('.');
  if (parts.length === 1) {
    return datum[property];
  }
  if (!datum[parts[0]]) {
    return undefined;
  }
  return datumValue(datum[parts[0]], parts.slice(1).join('.'));
}

const buildProps = (data, pathPrefix = []) => {
  let result = []
  const firstObj = pathPrefix.length
    ? datumValue(data[0], pathPrefix.join('.')) : data[0]
  const lastObj = pathPrefix.length
    ? datumValue(data[data.length-1], pathPrefix.join('.')) : data[data.length-1]
  const obj = firstObj || lastObj;
  Object.keys(obj).forEach((key) => {
    const path = [...pathPrefix, key].join('.')
    const value = (firstObj && firstObj[key]) || lastObj[key]
    if (typeof value === 'string') {
      // build options
      const options = {}
      data.forEach(datum => {
        const value = datumValue(datum, path)
        options[value] = true
      })
      const isImage = (value && value.endsWith('.png'))
      result.push({
        property: path,
        align: isImage ? 'center' : 'start',
        header: path,
        example: value,
        options: Object.keys(options).length < 10
          ? Object.keys(options) : undefined,
        render: isImage
          ? value => (
            <Box height="xxsmall" width="xxsmall">
              <Image fit="contain" src={datumValue(value, path)} />
            </Box>
          ) : undefined,
      })
    } else if (typeof value === 'number') {
      result.push({
        property: path,
        align: 'end',
        header: path,
        example: value,
      })
    } else if (typeof value === 'boolean') {
      result.push({
        property: path,
        align: 'center',
        header: path,
        example: value,
        render: value => (datumValue(value, path) ? <Checkmark /> : null),
        options: [true, false],
      })
    } else if (Array.isArray(value)) {
      // TODO
    } else if (value && typeof value === 'object') {
      result = result.concat(buildProps(data, path.split('.')))
    }
  })
  return result
}

const App = () => {
  // config e.g. { url: '', primaryKey: '', paths: { path: '', values: [], search: '' }}
  const [config, setConfig] = React.useState()
  const [recents, setRecents] = React.useState([])
  const [fullData, setFullData] = React.useState([])
  const [data, setData] = React.useState([])
  const [dataProps, setDataProps] = React.useState([])
  const [columns, setColumns] = React.useState([])
  const [edit, setEdit] = React.useState(true)
  const [datum, setDatum] = React.useState()
  const [search, setSearch] = React.useState('')

  // load from local storage
  React.useEffect(() => {
    let stored = localStorage.getItem('dataSources')
    if (stored) {
      const nextRecents = JSON.parse(stored)
      setRecents(nextRecents)
      stored = nextRecents[0] && localStorage.getItem(nextRecents[0])
      if (stored) {
        setConfig(JSON.parse(stored))
      } else {
        setConfig(bareConfig)
      }
    } else {
      setConfig(bareConfig)
    }
  }, [])

  // save config to local storage when it changes
  React.useEffect(() => {
    if (config && config.url) {
      localStorage.setItem(config.url, JSON.stringify(config))
    }
  }, [config])

  // save recents to local storage when it changes
  React.useEffect(() => {
    localStorage.setItem('dataSources', JSON.stringify(recents))
  }, [recents])

  // set columns when config or dataProps change 
  React.useEffect(() => {
    if (config && config.paths.length > 0 && dataProps.length > 0) {
      const nextColumns = config.paths
        .map(({ path }) => dataProps.find(p => p.property === path))
      setColumns(nextColumns)
    }
  }, [config, dataProps])

  // load api data
  React.useEffect(() => {
    if (config && config.url) {
      fetch(config.url)
      .then(response => response.json())
      .then(nextFullData => {
        const nextDataProps = buildProps(nextFullData)
        setDataProps(nextDataProps)
        setFullData(nextFullData)
        setData(nextFullData)
      })
    }
  }, [config])

  React.useEffect(() => {
    if (config) {
      const nextData = fullData.filter((datum) =>
        // check if any property has a filter that doesn't match
        !config.paths.some(({ path, search, values }) => {
          if (search) {
            const value = datumValue(datum, path)
            return !(new RegExp(search, 'i').test(value))
          }
          if (values && values.length > 0) {
            const value = datumValue(datum, path)
            return !values.some(v => v === value)
          }
          return false
        })
      )
      setData(nextData)
    }
  }, [fullData, dataProps, config])

  const searchExp = search ? new RegExp(search, 'i') : undefined

  return (
    <Grommet full theme={grommet}>
      {!config ? (
        <Box fill align="center" justify="center">
          <Box animation="pulse">
            <Unlink size="large" />
          </Box>
        </Box>
      )
      : (!config.url ? (
        <Box pad="xlarge">
          <Heading>data explorer</Heading>
          <Paragraph>
            Enter the URL of a JSON REST API endpoint and see what it has to offer
          </Paragraph>
          <Form
            value={bareConfig}
            onSubmit={({ value: nextConfig }) => {
              const index = recents.indexOf(nextConfig.api)
              let nextRecents = [...recents]
              if (index !== -1) nextRecents.splice(index, 1)
              nextRecents.unshift(nextConfig.url)
              setRecents(nextRecents)
              setConfig(nextConfig)
            }}
          >
            <Box direction="row" align="center" gap="medium">
              <Box flex>
                <FormField label="URL" name="url" required />
              </Box>
              <Button type="submit" icon={<Next />} hoverIndicator />
            </Box>
          </Form>
          {recents.length > 0 && (
            <Heading level={2} size="small">Recent</Heading>
          )}
          {recents.filter(r => r).map((recent, index) => (
            <Button
              hoverIndicator
              onClick={() => {
                let nextRecents = recents.filter(r => r && r !== recent)
                nextRecents.unshift(recent)
                setRecents(nextRecents)
                const stored = localStorage.getItem(recent)
                if (stored) setConfig(JSON.parse(stored))
              }}
            >
              <Box pad={{ horizontal: 'medium', vertical: 'small' }}>
                <Text>{recent}</Text>
              </Box>
            </Button>
          ))}
        </Box>
      ) : (
        <Box fill direction="row">
          <Box flex={true} align="center">
            <Box
              alignSelf="stretch"
              flex={false}
              direction="row"
              align="center"
              justify="between"
              gap="medium"
            >
              <Button
                icon={<Unlink />}
                hoverIndicator
                onClick={() => {
                  const nextRecents = ['', ...recents]
                  setRecents(nextRecents)
                  setConfig(bareConfig)
                }}
              />
              <Text>{config.url}</Text>
              <Button
                icon={edit ? <Next /> : <Previous />}
                hoverIndicator
                onClick={() => setEdit(!edit)}
              />
            </Box>

            <Box flex={true} overflow="auto">
              <DataTable
                columns={columns}
                primaryKey={config.primaryKey}
                data={data}
                onClickRow={({ datum }) => setDatum(datum)}
              />
            </Box>
          </Box>

          {datum && (
            <Layer
              full
              margin="large"
              onEsc={() => setDatum(undefined)}
              onClickOutside={() => setDatum(undefined)}
            >
              <Box flex={false} direction="row" justify="end">
                <Button
                  icon={<Close />}
                  hoverIndicator
                  onClick={() => setDatum(undefined)}
                />
              </Box>
              <TextArea fill value={JSON.stringify(datum, null, 4)} />
            </Layer>
          )}

          {edit && dataProps.length > 0 && (
            <Box flex={false} overflow="auto" background="dark-1" pad="small">
              <Box flex={false}>
                <TextInput
                  placeholder="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
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

                <Box margin={{ top: 'small' }} border="top" pad={{ top: 'small' }}>
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
                            icon={<Add />}
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
            </Box>
          )}
        </Box>
      ))}
    </Grommet>
  );
}

export default App;

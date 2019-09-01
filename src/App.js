import React from 'react'
import {
  Box, Button, DataTable, Form, FormField, Grommet, Image, Layer,
  RadioButton, Select, Text, TextArea, TextInput,
  grommet,
} from 'grommet'
import {
  Add, Checkmark, Close, Down, Next, Previous, Unlink, Up,
} from 'grommet-icons'

// const url = 'https://api.spacexdata.com/v3/launches?order=desc';
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
      result.push({
        property: path,
        align: 'start',
        header: path,
        example: value,
        options: Object.keys(options).length < 10
          ? Object.keys(options) : undefined,
        render: (value && value.endsWith('.png'))
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
  const [apiUrl, setApiUrl] = React.useState()
  const [primaryKey, setPrimaryKey] = React.useState()
  const [fullData, setFullData] = React.useState([])
  const [data, setData] = React.useState([])
  const [dataProps, setDataProps] = React.useState([])
  const [config, setConfig] = React.useState([])
  const [columns, setColumns] = React.useState([])
  const [edit, setEdit] = React.useState(true)
  const [datum, setDatum] = React.useState()
  const [search, setSearch] = React.useState('')

  // load from local storage
  React.useEffect(() => {
    let stored = localStorage.getItem('config')
    if (stored) {
      setConfig(JSON.parse(stored))
    }
    stored = localStorage.getItem('apiUrl')
    if (stored) {
      setApiUrl(stored)
    }
  }, [])

  // save apiUrl to local storage when it changes
  React.useEffect(() => localStorage.setItem('apiUrl', apiUrl), [apiUrl])

  // set columns when config or dataProps change 
  React.useEffect(() => {
    if (config.length > 0 && dataProps.length > 0) {
      localStorage.setItem('config', JSON.stringify(config))
      const nextColumns = config
        .map((path) => dataProps.find(p => p.property === path))
      setColumns(nextColumns)
    }
  }, [config, dataProps])

  // load api data
  React.useEffect(() => {
    if (apiUrl) {
      fetch(apiUrl)
      .then(response => response.json())
      .then(nextFullData => {
        const nextDataProps = buildProps(nextFullData)
        setDataProps(nextDataProps)
        setFullData(nextFullData)
        setData(nextFullData)
      })
    }
  }, [apiUrl])

  React.useEffect(() => {
    const nextData = fullData.filter((datum) =>
      // check if any property has a filter that doesn't match
      !dataProps.some(dataProp => {
        if (dataProp.searchText) {
          const value = datumValue(datum, dataProp.property)
          return !(new RegExp(dataProp.searchText, 'i').test(value))
        }
        if (dataProp.values && dataProp.values.length > 0) {
          const value = datumValue(datum, dataProp.property)
          return !dataProp.values.some(v => v === value)
        }
        return false
      })
    )
    setData(nextData)
  }, [fullData, dataProps])

  const searchExp = search ? new RegExp(search, 'i') : undefined

  return (
    <Grommet full theme={grommet}>
      {!apiUrl ? (
        <Box>
          <Form
            value={{ apiUrl }}
            onSubmit={({ value: { apiUrl }}) => setApiUrl(apiUrl)}
          >
            <FormField label="URL" name="apiUrl" />
          </Form>
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
                onClick={() => setApiUrl(undefined)}
              />
              <Text>{apiUrl}</Text>
              <Button
                icon={edit ? <Next /> : <Previous />}
                hoverIndicator
                onClick={() => setEdit(!edit)}
              />
            </Box>

            <Box flex={true} overflow="auto">
              <DataTable
                columns={columns}
                primaryKey={primaryKey}
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
                {config
                // omit object properties which aren't columns
                .filter(path =>
                  !dataProps.some(p => p.property === path && p.dataProps))
                .filter(path => !search || searchExp.test(path))
                .map(path => {
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
                          checked={primaryKey === path}
                          onChange={() => setPrimaryKey(path)}
                        />
                        <Box flex={false} width="small">
                          {dataProp.options ? (
                            <Select
                              multiple
                              options={dataProp.options}
                              value={dataProp.values || []}
                              onChange={(event) => {
                                const nextDataProps =
                                  JSON.parse(JSON.stringify(dataProps))
                                nextDataProps.find(p => p.property === path)
                                  .values = event.value
                                setDataProps(nextDataProps)
                              }}
                              style={{ width: '100%' }}
                            />
                          ) : (
                            <TextInput
                              placeholder="search"
                              value={dataProp.searchText || ''}
                              onChange={(event) => {
                                const nextDataProps =
                                  JSON.parse(JSON.stringify(dataProps))
                                nextDataProps.find(p => p.property === path)
                                  .searchText = event.target.value
                                setDataProps(nextDataProps)
                              }}
                              style={{ width: '100%' }}
                            />
                          )}
                        </Box>
                        <Box flex={false} direction="row">
                          <Button
                            icon={<Up />}
                            hoverIndicator
                            disabled={!config.indexOf(path)}
                            onClick={() => {
                              const index = config.indexOf(path)
                              const nextConfig = [...config]
                              nextConfig[index] = nextConfig[index - 1]
                              nextConfig[index - 1] = path
                              setConfig(nextConfig)
                            }}
                          />
                          <Button
                            icon={<Down />}
                            hoverIndicator
                            disabled={config.indexOf(path) >= config.length - 1}
                            onClick={() => {
                              const index = config.indexOf(path)
                              const nextConfig = [...config]
                              nextConfig[index] = nextConfig[index + 1]
                              nextConfig[index + 1] = path
                              setConfig(nextConfig)
                            }}
                          />
                          <Button
                            icon={<Close />}
                            hoverIndicator
                            onClick={() => setConfig(config.filter(c => c !== path))}
                          />
                        </Box>
                      </Box>
                    </Box>
                  )
                })}

                <Box margin={{ top: 'small' }} border="top" pad={{ top: 'small' }}>
                  {dataProps
                  .filter(p =>
                    !config.some(path => (path === p.property && !p.dataProps)))
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
                            onClick={() => setConfig([...config, property.property])}
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
      )}
    </Grommet>
  );
}

export default App;

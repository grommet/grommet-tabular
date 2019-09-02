import React from 'react'
import {
  Box, Button, DataTable, Grommet, Layer,
  Paragraph, Text, TextArea,
  grommet,
} from 'grommet'
import { Close, Next, Previous, Unlink } from 'grommet-icons'
import { bareConfig } from './config'
import { datumValue, buildProps } from './data'
import Loading from './Loading'
import Start from './Start'
import Build from './Build'

const App = () => {
  // config e.g. { url: '', primaryKey: '', paths: { path: '', values: [], search: '' }}
  const [config, setConfig] = React.useState()
  const [fullData, setFullData] = React.useState([])
  const [data, setData] = React.useState([])
  const [dataProps, setDataProps] = React.useState([])
  const [columns, setColumns] = React.useState([])
  const [edit, setEdit] = React.useState(true)
  const [datum, setDatum] = React.useState()

  // load first data source from local storage
  React.useEffect(() => {
    let stored = localStorage.getItem('dataSources')
    if (stored) {
      const dataSources = JSON.parse(stored)
      stored = dataSources[0] && localStorage.getItem(dataSources[0])
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

  return (
    <Grommet full theme={grommet}>
      {!config ? <Loading />
      : (!config.url ? <Start setConfig={setConfig} />
      : (
        <Box fill direction="row">
          <Box flex={true} align="center">
            <Box
              alignSelf="stretch"
              flex={false}
              direction="row"
              align="center"
              justify="between"
              gap="medium"
              background="light-1"
            >
              <Button
                icon={<Unlink />}
                hoverIndicator
                onClick={() => setConfig(bareConfig)}
              />
              <Text>{config.url}</Text>
              <Button
                icon={edit ? <Next /> : <Previous />}
                hoverIndicator
                onClick={() => setEdit(!edit)}
              />
            </Box>

            <Box flex={true} overflow="auto">
              {columns.length === 0 && (
                <Box pad="xlarge" align="center" justify="center">
                  <Paragraph textAlign="center" size="large">
                    Add some columns to build a table
                  </Paragraph>
                </Box>
              )}
              <Box>
                <DataTable
                  columns={columns}
                  primaryKey={config.primaryKey}
                  data={data}
                  onClickRow={({ datum }) => setDatum(datum)}
                />
              </Box>
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
            <Build config={config} setConfig={setConfig} dataProps={dataProps} />
          )}
        </Box>
      ))}
    </Grommet>
  );
}

export default App;

import React from 'react'
import {
  Anchor, Box, Button, DataTable, Grommet, Paragraph, Text, TextInput, grommet,
} from 'grommet'
import { Next, Previous, Unlink } from 'grommet-icons'
import { bareConfig, clearFilters } from './config'
import { datumValue, buildProps } from './data'
import Loading from './Loading'
import Start from './Start'
import Build from './Build'
import Filter from './Filter'
import Detail from './Detail'
import Aggregate from './Aggregate'

const selectedRowStyle = { background: 'brand' }

const App = () => {
  // config e.g. { url: '', primaryKey: '', paths: { path: '', values: [], search: '' }}
  const [config, setConfig] = React.useState()
  const [fullData, setFullData] = React.useState()
  const [data, setData] = React.useState([])
  const [dataProps, setDataProps] = React.useState([])
  const [columns, setColumns] = React.useState([])
  const [edit, setEdit] = React.useState(false)
  const [datum, setDatum] = React.useState()
  const [search, setSearch] = React.useState('')
  const [select, setSelect] = React.useState(false)
  const [selected, setSelected] = React.useState({})
  const [filterSelected, setFilterSelected] = React.useState(false)
  const [aggregate, setAggregate] = React.useState(false)

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
      .then(responseData => {
        let nextFullData;
        if (Array.isArray(responseData)) nextFullData = responseData
        else if (typeof responseData === 'object') {
          // look for first array value
          Object.keys(responseData).some((key) => {
            if (Array.isArray(responseData[key])) nextFullData = responseData[key]
            return nextFullData
          })
        }
        const nextDataProps = buildProps(nextFullData)
        setColumns([])
        setDataProps(nextDataProps)
        setFullData(nextFullData)
        setData(nextFullData)
      })
    }
  }, [config])

  // set data when props, config, or search change
  React.useEffect(() => {
    if (config && fullData) {
      const searchExp = search ? new RegExp(search, 'i') : undefined

      const nextData = fullData.filter((datum) =>
        // if filtering on selected, ignore other filtering
        (filterSelected && selected[datumValue(datum, config.primaryKey)])
        || (!filterSelected
        // check if any property has a filter that doesn't match
        && !config.paths.some(({ path, search, values }) => {
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
        // or if there is a search but no values match
        && (!searchExp || config.paths.some(({ path }) => {
          const value = datumValue(datum, path)
          return searchExp.test(value)
        })))
      )
      setData(nextData)
    }
  }, [config, dataProps, filterSelected, fullData, search, selected])

  return (
    <Grommet full theme={grommet}>
      {!config ? <Loading />
      : (!config.url ? <Start setConfig={setConfig} />
      : (
        <Box fill direction="row">
          <Box flex={true} align="center" gap="medium">

            {/* app header */}
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

            {!fullData ? <Loading /> : (
              <Box flex={true} gap="medium" pad="xsmall">

                {/* when there are no columns yet */}
                {columns.length === 0 && (
                  <Box pad="xlarge" align="center" justify="center">
                    <Paragraph textAlign="center" size="large">
                      Add some columns to build a table
                    </Paragraph>
                  </Box>
                )}

                {/* data header */}
                <Box flex={false} direction="row" align="center" gap="small">
                  <TextInput
                    placeholder="Search ..."
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                  />
                  <Filter config={config} setConfig={setConfig} dataProps={dataProps} />
                  <Box basis="xsmall" flex={false} align="end">
                    <Anchor
                      margin="small"
                      label={select ? 'done' : 'select'}
                      onClick={() => {
                        setFilterSelected(false)
                        setSelected({})
                        setSelect(!select)
                      }}
                    />
                  </Box>
                </Box>

                {/* select state */}
                {select && (
                  <Box
                    flex={false}
                    direction="row"
                    align="center"
                    justify="between"
                    gap="medium"
                    background="light-2"
                    round="small"
                    pad="medium"
                  >
                    <Box direction="row">
                      <Anchor
                        margin="small"
                        label="select all"
                        onClick={() => {
                          const nextSelected = {}
                          data.forEach(datum => {
                            const value = datumValue(datum, config.primaryKey)
                            nextSelected[value] = selectedRowStyle
                          })
                          setSelected(nextSelected)
                        }}
                      />
                      {Object.keys(selected).length > 0 && (
                        <Anchor
                          margin="small"
                          label="clear selection"
                          onClick={() => {
                            setSelected({})
                            setFilterSelected(false)
                          }}
                        />
                      )}
                    </Box>
                    <Box direction="row">
                      <Anchor
                        margin="small"
                        label={`${Object.keys(selected).length} selected`}
                        disabled={Object.keys(selected).length === 0}
                        onClick={() => {
                          setFilterSelected(true)
                          setSearch('')
                          setConfig(clearFilters(config))
                        }}
                      />
                      <Button
                        label="Aggregate"
                        disabled={Object.keys(selected).length === 0}
                        onClick={() => setAggregate(true)}
                      />
                    </Box>
                    {aggregate && (
                      <Aggregate
                        config={config}
                        data={data.filter(datum =>
                          selected[datumValue(datum, config.primaryKey)])}
                        dataProps={dataProps}
                        onClose={() => setAggregate(false)}
                      />
                    )}
                  </Box>
                )}

                {/* table proper */}
                <Box flex="shrink" overflow="auto">
                  <DataTable
                    columns={columns}
                    primaryKey={config.primaryKey}
                    data={data}
                    rowProps={select ? selected : undefined}
                    onClickRow={({ datum }) => {
                      if (select) {
                        const nextSelected = JSON.parse(JSON.stringify(selected))
                        const value = datumValue(datum, config.primaryKey)
                        if (nextSelected[value]) {
                          delete nextSelected[value]
                        } else {
                          nextSelected[value] = selectedRowStyle
                        }
                        setSelected(nextSelected)
                      } else {
                        setDatum(datum)
                      }
                    }}
                  />
                </Box>

              </Box>
            )}
          </Box>

          {datum && <Detail datum={datum} setDatum={setDatum} />}

          {edit && dataProps.length > 0 && (
            <Build config={config} setConfig={setConfig} dataProps={dataProps} />
          )}
        </Box>
      ))}
    </Grommet>
  )
}

export default App

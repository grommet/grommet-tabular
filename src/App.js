import React from 'react';
import {
  Box, Button, CheckBox, DataTable, Form, FormField, Grommet, Layer, Text,
  grommet,
} from 'grommet';
import { Configure, Unlink } from 'grommet-icons';

// const url = 'https://api.spacexdata.com/v3/launches?order=desc';
const primaryKey = 'flight_number';

const buildProps = (obj, dataProps, prefix='') => {
  Object.keys(obj).forEach((propertyName) => {
    const property = `${prefix}${propertyName}`
    if (typeof obj[propertyName] === 'string') {
      dataProps.push({
        property,
        align: 'start',
        header: property,
      })
    } else if (typeof obj[propertyName] === 'number') {
      dataProps.push({
        property,
        align: 'end',
        header: property,
      })
    } else if (typeof obj[propertyName] === 'boolean') {
      dataProps.push({
        property,
        align: 'center',
        header: property,
        render: value => (
          <Box pad="small" background={value[propertyName] ? 'brand' : 'light-4'} />
        )
      })
    } else if (Array.isArray(obj[propertyName])) {
      // TODO
    } else if (obj[propertyName] && typeof obj[propertyName] === 'object') {
      buildProps(obj[propertyName], dataProps, `${propertyName}.`)
    }
  })
}

const App = () => {
  const [apiUrl, setApiUrl] = React.useState()
  const [data, setData] = React.useState([])
  const [dataProps, setDataProps] = React.useState([])
  const [config, setConfig] = React.useState([])
  const [columns, setColumns] = React.useState([])
  const [edit, setEdit] = React.useState()

  // load from local storage
  React.useEffect(() => {
    let stored = localStorage.getItem('config')
    if (stored) {
      setConfig(JSON.parse(stored))
    } else {
      setConfig([primaryKey])
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
    if (config.length > 0 && data.length > 0) {
      localStorage.setItem('config', JSON.stringify(config))
      const nextColumns = config.map(name => dataProps.filter(p => p.property === name)[0])
      setColumns(nextColumns)
    }
  }, [config, data, dataProps])

  // load api data
  React.useEffect(() => {
    if (apiUrl) {
      fetch(apiUrl)
      .then(response => response.json())
      .then(nextData => {
        const first = nextData[0];
        const nextDataProps = [];
        buildProps(first, nextDataProps);
        console.log('!!!', first, nextDataProps);
        setDataProps(nextDataProps)
        setData(nextData)
      })
    }
  }, [apiUrl])

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
        <Box>
          <Box flex={false} direction="row" align="center" justify="between">
            <Button icon={<Unlink />} hoverIndicator onClick={() => setApiUrl(undefined)} />
            <Text>{apiUrl}</Text>
            <Button icon={<Configure />} hoverIndicator onClick={() => setEdit(!edit)} />
          </Box>
          <DataTable
            primaryKey={primaryKey}
            columns={columns}
            data={data}
          />
          {edit && (
            <Layer
              position="right"
              onEsc={() => setEdit(false)}
              onClickOutside={() => setEdit(false)}
            >
              <Box flex={false}>
                {dataProps.map(property => (
                  <Box key={property.property}>
                    <CheckBox
                      label={property.property}
                      checked={columns.some(c => c.property === property.property)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setConfig([...config, property.property]);
                        } else {
                          setConfig(config.filter(c => c !== property.property));
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Layer>
          )}
        </Box>
      )}
    </Grommet>
  );
}

export default App;

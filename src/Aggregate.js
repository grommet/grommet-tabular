import React from 'react'
import { Box, Button, Grid, Heading, Layer, Meter, Text } from 'grommet'
import { Close } from 'grommet-icons'
import { datumValue } from './data'

const colors =
  ['accent-1', 'neutral-1', 'accent-2', 'neutral-2', 'accent-3', 'neutral-3']

const Aggregate = ({ config, data, dataProps, onClose }) => {
  const meters = config.paths
  .map(c => dataProps.find(dp => dp.property === c.path))
  .filter(dataProp => dataProp.options).map((dataProp) => {
    const counts = {}
    data.forEach((datum) => {
      const value = datumValue(datum, dataProp.property)
      if (!counts[value]) counts[value] = 0
      counts[value] += 1
    })
    return (
      <Box key={dataProp.property} align="center" gap="small">
        <Text weight="bold">{dataProp.property}</Text>
        <Meter
          type="circle"
          size="small"
          values={Object.keys(counts).map((k, i) => ({
            label: k,
            color: colors[i % colors.length],
            value: (counts[k] / data.length) * 100,
          }))}
        />
        <Box gap="xsmall">
          {Object.keys(counts).map((k, i) => (
            <Box key={k} direction="row" align="center" gap="small">
              <Box pad="xsmall" background={colors[i % colors.length]} />
              <Box flex="grow">
                <Text>{k}</Text>
              </Box>
              <Text weight="bold">{counts[k]}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  })

  return (
    <Layer
      full="horizontal"
      margin="large"
      onEsc={onClose}
      onClickOutside={onClose}
    >
      <Box flex={false} direction="row" justify="between" align="start">
        <Heading level={2} margin={{ horizontal: 'large' }}>
          {data.length} selected
        </Heading>
        <Button icon={<Close />} hoverIndicator onClick={onClose} />
      </Box>
      <Box flex="shrink" overflow="auto">
        <Grid columns="small" gap="large" margin="large">
          {meters}
        </Grid>
      </Box>
    </Layer>
  )
}

export default Aggregate

import React from 'react'
import { Box, Button, Layer, TextArea } from 'grommet'
import { Close } from 'grommet-icons'

const Detail = ({ datum, setDatum }) => (
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
)

export default Detail;

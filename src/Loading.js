import React from 'react'
import { Box } from 'grommet'
import { Unlink } from 'grommet-icons'

const Loading = () => (
  <Box fill align="center" justify="center">
    <Box animation="pulse">
      <Unlink size="large" />
    </Box>
  </Box>
)

export default Loading

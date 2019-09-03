import React from 'react'
import { Box, Image } from 'grommet'
import { Checkmark } from 'grommet-icons'

export const datumValue = (datum, property) => {
  const parts = property.split('.')
  if (parts.length === 1) {
    return datum[property]
  }
  if (!datum[parts[0]]) {
    return undefined
  }
  return datumValue(datum[parts[0]], parts.slice(1).join('.'))
}

export const buildProps = (data, pathPrefix = []) => {
  let result = []
  const firstObj = pathPrefix.length
    ? datumValue(data[0], pathPrefix.join('.')) : data[0]
  const lastObj = pathPrefix.length
    ? datumValue(data[data.length-1], pathPrefix.join('.')) : data[data.length-1]
  const obj = firstObj || lastObj
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

import React from 'react'
import { Box, Button, Form, FormField, Heading, Paragraph, Text } from 'grommet'
import { Next } from 'grommet-icons'
import { bareConfig } from './config'

const examples = [
  'https://api.spacexdata.com/v3/launches/past?order=desc'
]

const Start = ({ setConfig }) => {
  const [recents, setRecents] = React.useState([])

  // load from local storage
  React.useEffect(() => {
    const stored = localStorage.getItem('dataSources')
    if (stored) setRecents(JSON.parse(stored))
  }, [])

  return (
    <Box pad="xlarge">
      <Heading>tabular</Heading>
      <Paragraph>
        Provide the URL of a JSON endpoint and see what it has to offer
      </Paragraph>
      <Form
        value={bareConfig}
        onSubmit={({ value: nextConfig }) => {
          const index = recents.indexOf(nextConfig.url)
          let nextRecents = [...recents]
          if (index !== -1) nextRecents.splice(index, 1)
          nextRecents.unshift(nextConfig.url)
          localStorage.setItem('dataSources', JSON.stringify(nextRecents))
          setConfig(nextConfig)
        }}
      >
        <Box direction="row" align="center" gap="medium">
          <Box flex>
            <FormField name="url" required placeholder="https://" />
          </Box>
          <Button type="submit" icon={<Next />} hoverIndicator />
        </Box>
      </Form>
      {recents.length > 0 && (
        <Heading level={2} size="small">Recent</Heading>
      )}
      {recents.filter(r => r).map(recent => (
        <Button
          key={recent}
          hoverIndicator
          onClick={() => {
            let nextRecents = recents.filter(r => r && r !== recent)
            nextRecents.unshift(recent)
            localStorage.setItem('dataSources', JSON.stringify(nextRecents))
            const stored = localStorage.getItem(recent)
            if (stored) setConfig(JSON.parse(stored))
          }}
        >
          <Box pad={{ horizontal: 'medium', vertical: 'small' }}>
            <Text>{recent}</Text>
          </Box>
        </Button>
      ))}
      {examples.length > 0 && (
        <Heading level={2} size="small">Examples</Heading>
      )}
      {examples.map(example => (
        <Button
          key={example}
          hoverIndicator
          onClick={() => {
            let nextRecents = recents.filter(r => r && r !== example)
            nextRecents.unshift(example)
            localStorage.setItem('dataSources', JSON.stringify(nextRecents))
            const nextConfig = { ...bareConfig, url: example }
            setConfig(nextConfig)
          }}
        >
          <Box pad={{ horizontal: 'medium', vertical: 'small' }}>
            <Text>{example}</Text>
          </Box>
        </Button>
      ))}
    </Box>
  )
}

export default Start

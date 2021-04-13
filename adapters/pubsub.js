'use strict'

const topicName = (projectId, name) =>
  `projects/${projectId}/topics/${name}`
const subscriptionName = (projectId, name) =>
  `projects/${projectId}/subscriptions/${name}`

const getTopic = async (pubsub, name) => {
  try {
    await pubsub.createTopic(name)
    return pubsub.topic(name, { enableMessageOrdering: true })
  } catch (err) {
    console.log(err)
    const topic = pubsub.topic(name, { enableMessageOrdering: true })
    //topic.
    /*
    await pubSubClient.topic(name).delete()
    while (true) {
      try {
        await pubsub.createTopic(name)
        break
      } catch (err) {
        console.log(err)
        continue
      }
    }
    */

  }
}

const serialport = ({
  credentials,
  topicName,
  connected
}) => recv => {
  const { PubSub } = require('@google-cloud/pubsub')

  // Instantiates a client
  const pubsub = new PubSub({
    projectId: credentials.project_id,
    credentials,
  })

  // Creates a new topic
  const topic = getTopic(pubsub, 'device-' + pairId)

  // Creates a subscription on that new topic
  const [subscription] = await topic.createSubscription(subscriptionName)

  // Receive callbacks for new messages on the subscription
  subscription.on('message', message => {
    console.log('Received message:', message.data.toString())
    process.exit(0)
  });

  // Receive callbacks for errors on the subscription
  subscription.on('error', error => {
    console.error('Received error:', error)
    process.exit(1)
  });

  // Send a message to the topic
  topic.publish(Buffer.from('Test message!'))






  const SerialPort = require('serialport')
  const serialport = new SerialPort(
    path,
    { baudRate, lock: false },
    () => connected(`${path}:${baudRate}`)
  )
  serialport.on('data', recv)
  const send = buff => serialport.write(buff)
  return send
}

module.exports = serialport
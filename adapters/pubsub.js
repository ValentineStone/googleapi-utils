'use strict'
const chalk = require('chalk')

const report = (who, ...args) => console.log(chalk.gray(`[${who}]:`), ...args)

const ignoreErrors = err => { }

const getTopic = async (pubsub, name) => {
  await pubsub.createTopic(name).catch(ignoreErrors)
  return pubsub.topic(name, { enableMessageOrdering: true })
}

const getSubscription = async (topic, name) => {
  report('subscriptions', 'connecting...')
  try {
    await topic.createSubscription(name, { enableMessageOrdering: true })
    report('subscriptions', 'created')
  } catch (err) {
    report('subscriptions', 'exists, clearing...')
    await topic.subscription(name).seek(new Date('3000-01-01'))
    report('subscriptions', 'cleared')
  }
  report('subscriptions', chalk.green('ready'))
  return topic.subscription(name)

}


const pubsub = ({
  credentials,
  uuid,
  mode,
  connected,
}) => async recv => {
  const { PubSub } = require('@google-cloud/pubsub')
  const device = mode === 'device'

  // Instantiates a client
  const pubsub = new PubSub({
    projectId: credentials.project_id,
    credentials,
  })

  // Creates a new topic
  report('topics', 'connecting...')
  const [
    topicToDevice,
    topicFromDevice
  ] = await Promise.all([
    getTopic(pubsub, `device-${uuid}-to`).then(topic => {
      report('topics', 'to device ready')
      return topic
    }),
    getTopic(pubsub, `device-${uuid}-from`).then(topic => {
      report('topics', 'from device ready')
      return topic
    })
  ])
  report('topics', chalk.green('ready'))

  // Creates a subscription on that new topic
  let subscription
  if (device)
    subscription = await getSubscription(topicToDevice, `device-${uuid}-to`)
  else
    subscription = await getSubscription(topicFromDevice, `device-${uuid}-from`)

  connected?.(`${uuid}@pubsub`)

  // Receive callbacks for new messages on the subscription
  subscription.on('message', message => {
    try {
      message.ack()
      recv?.(message.data)
    } catch { }
  })

  const pubTopic = device ? topicFromDevice : topicToDevice
  const send = data => pubTopic.publishMessage({ data, orderingKey: 'k' })
  return send
}

module.exports = pubsub
'use strict'
const chalk = require('chalk')

const report = (who, ...args) => console.log(chalk.gray(`[${who}]:`), ...args)

const ignoreErrors = err => { }

const getTopic = async (pubsub, name, desc) => {
  if (await pubsub.topic(name).exists().then(([exists]) => !exists))
    await pubsub.createTopic(name).catch(ignoreErrors)
  return pubsub.topic(name, { enableMessageOrdering: true })
}

const getSubscription = async (topic, name) => {
  if (await topic.subscription(name).exists().then(([exists]) => exists))
    await topic.subscription(name).seek(new Date('3000-01-01'))
  else
    await topic.createSubscription(name, { enableMessageOrdering: true })
  return topic.subscription(name)
}


const pubsub = ({
  credentials,
  uuid,
  connected,
  slave,
}) => async recv => {
  const { PubSub } = require('@google-cloud/pubsub')

  // Instantiates a client
  const pubsub = new PubSub({
    projectId: credentials.project_id,
    credentials,
  })

  // Creates a new topic
  const [
    topicToDevice,
    topicFromDevice
  ] = await Promise.all([
    getTopic(pubsub, `device-${uuid}-to`, 'to device'),
    getTopic(pubsub, `device-${uuid}-from`, 'from device'),
  ])

  // Creates a subscription on that new topic
  let subscription
  if (slave) {
    if (slave === true)
      subscription = await getSubscription(topicFromDevice, `device-${uuid}-from`)
    else
      subscription = await getSubscription(topicFromDevice, `device-${uuid}-from-to-${slave}`)
  }
  else
    subscription = await getSubscription(topicToDevice, `device-${uuid}-to`)

  connected?.(`${uuid}@pubsub`)

  // Receive callbacks for new messages on the subscription
  subscription.on('message', message => {
    try {
      message.ack()
      recv?.(message.data)
    } catch { }
  })

  const pubTopic = slave ? topicToDevice : topicFromDevice
  const send = data => pubTopic.publishMessage({ data, orderingKey: 'k' })
  return send
}

module.exports = pubsub
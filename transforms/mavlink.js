const mavlink = (systemId = 0, componentId = 0) => {
  const { MAVLink20Processor, mavlink20 } = require('../third_party/mavlink/MAVLink20')
  const processor = new MAVLink20Processor(null, systemId, componentId)
  return next => {
    processor.on('message', message => {
      if (message.id !== mavlink20.MAVLINK_MSG_ID_BAD_DATA)
      next(message.msgbuf)
    })
    return buff => processor.parseBuffer(buff)
  }
}

module.exports = mavlink
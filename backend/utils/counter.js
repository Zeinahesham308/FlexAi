const { chatbot_db } = require('../config/db');

const getNextSequence = async (sequenceName) => {
  const counters = chatbot_db.collection('counters');

  // 1. Find the document
  const counter = await counters.findOne({ _id: sequenceName });

  // 2. If it doesn't exist, insert it with seq = 1
  if (!counter) {
    await counters.insertOne({ _id: sequenceName, seq: 1 });
    return 1;
  }

  // 3. If it exists, update it
  const updated = await counters.updateOne(
    { _id: sequenceName },
    { $inc: { seq: 1 } }
  );

  // 4. Return new sequence manually (old + 1)
  return counter.seq + 1;
};

module.exports = getNextSequence;

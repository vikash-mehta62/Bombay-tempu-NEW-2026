const mongoose = require('mongoose');
require('dotenv').config();

const Client = require('./models/Client');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const clients = await Client.find({ fullName: /Rent/i });
  console.log('CLIENTS MATCHING Rent:');
  console.log(JSON.stringify(clients, null, 2));

  const allClients = await Client.find({});
  console.log('ALL CLIENTS LIST:');
  console.log(JSON.stringify(allClients.map(c => ({ _id: c._id, name: c.fullName || c.companyName, contact: c.contact, gst: c.gstNumber })), null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);

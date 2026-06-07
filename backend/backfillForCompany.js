require('dotenv').config();
const connectDB = require('./config/database');

const DEFAULT_COMPANY = 'buts';

const models = [
  require('./models/ActivityLog'),
  require('./models/AdjustmentPayment'),
  require('./models/BalanceMemo'),
  require('./models/Bill'),
  require('./models/Client'),
  require('./models/ClientExpense'),
  require('./models/ClientPayment'),
  require('./models/ClientPOD'),
  require('./models/CollectionMemo'),
  require('./models/Driver'),
  require('./models/DriverCalculation'),
  require('./models/Expense'),
  require('./models/FleetOwner'),
  require('./models/LR'),
  require('./models/Trip'),
  require('./models/TripAdvance'),
  require('./models/TripExpense'),
  require('./models/Vehicle')
];

const run = async () => {
  await connectDB();

  for (const Model of models) {
    const result = await Model.updateMany(
      { forCompany: { $exists: false } },
      { $set: { forCompany: DEFAULT_COMPANY } },
      { skipCompanyFilter: true }
    );

    console.log(`${Model.modelName}: ${result.modifiedCount || 0} records updated`);
  }

  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to backfill forCompany:', error);
  process.exit(1);
});

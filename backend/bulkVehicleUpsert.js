require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  return new Date(`${year}-${month}-${day}`);
};

const vehicleData = [
  { vehicleNumber:"MH04JU8278", fitness:"30/10/2027", tax:"30/04/2026", insurance:"05/08/2026", puc:"02/09/2026", permit:"30/08/2029", nationalPermit:"24/03/2026" },
  { vehicleNumber:"MH04JU8279", fitness:"20/10/2027", tax:"30/04/2026", insurance:"05/08/2026", puc:"20/07/2026", permit:"26/03/2029", nationalPermit:"26/03/2026" },
  { vehicleNumber:"MH04JU9287", fitness:"15/11/2027", tax:"31/03/2026", insurance:"26/10/2025", puc:"16/08/2026", permit:"26/03/2029", nationalPermit:"26/03/2026" },
  { vehicleNumber:"MH04LQ2632", fitness:"27/07/2027", tax:"30/06/2026", insurance:"02/07/2026", puc:"30/06/2026", permit:"02/08/2028", nationalPermit:"02/08/2026" },
  { vehicleNumber:"MH04LQ2633", fitness:"17/08/2027", tax:"30/06/2026", insurance:"02/07/2026", puc:"26/06/2026", permit:"02/08/2028", nationalPermit:"02/08/2026" },
  { vehicleNumber:"MH04LY2632", fitness:"07/04/2026", tax:"31/03/2026", insurance:"15/04/2026", puc:"02/11/2026", permit:"14/04/2029", nationalPermit:"14/04/2026" },
  { vehicleNumber:"MH04LY2633", fitness:"07/04/2026", tax:"31/03/2026", insurance:"15/04/2026", puc:"29/04/2026", permit:"21/04/2029", nationalPermit:"21/04/2026" },
  { vehicleNumber:"MH04LY3444", fitness:"25/04/2026", tax:"30/04/2026", insurance:"26/03/2026", puc:"11/06/2026", permit:"05/05/2029", nationalPermit:"05/05/2026" },
  { vehicleNumber:"MH04LY9767", fitness:"10/10/2026", tax:"30/09/2026", insurance:"02/10/2026", puc:"26/10/2026", permit:"15/10/2029", nationalPermit:"15/10/2026" },
  { vehicleNumber:"MH04LY9768", fitness:"10/10/2026", tax:"30/09/2026", insurance:"02/10/2026", puc:"13/10/2026", permit:"15/10/2029", nationalPermit:"15/10/2026" },
  { vehicleNumber:"MH04LY9769", fitness:"10/10/2026", tax:"30/09/2026", insurance:"02/10/2026", puc:"23/04/2026", permit:"15/10/2029", nationalPermit:"15/10/2026" },
  { vehicleNumber:"HR57AQ956", fitness:"13/04/2027", tax:"30/06/2026", insurance:"15/04/2026", puc:"16/06/2026", permit:"04/06/2028", nationalPermit:"04/06/2026" },
  { vehicleNumber:"MH04MH7519", fitness:"06/04/2027", tax:"31/03/2026", insurance:"01/04/2026", puc:"07/04/2026", permit:"08/04/2030", nationalPermit:"08/04/2026" },
  { vehicleNumber:"MH04MH7520", fitness:"06/04/2027", tax:"31/03/2026", insurance:"31/03/2026", puc:"07/04/2026", permit:"08/04/2030", nationalPermit:"08/04/2026" }
];

const runScript = async () => {
  try {
    for (let v of vehicleData) {

      const vehicleNumber = v.vehicleNumber.toUpperCase().trim();

      await Vehicle.updateOne(
        { vehicleNumber },
        {
          $set: {
            fitnessExpiryDate: parseDate(v.fitness),
            taxValidUptoDate: parseDate(v.tax),
            insuranceExpiryDate: parseDate(v.insurance),
            pucExpiryDate: parseDate(v.puc),
            permitExpiryDate: parseDate(v.permit),
            nationalPermitExpiryDate: parseDate(v.nationalPermit),
            updatedAt: new Date()
          },
          $setOnInsert: {
            vehicleNumber,
            vehicleType: "truck",
            capacityTons: 25,
            ownershipType: "self_owned",
            fuelType: "diesel",
            currentStatus: "available",
            isActive: true,
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      console.log(`Processed: ${vehicleNumber}`);
    }

    console.log("✅ All Vehicles Synced Successfully");
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runScript();
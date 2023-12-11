// server.js
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8000;


// Connect to MongoDB
mongoose.connect('mongodb+srv://dbUser:dbPassword@cluster0.xkroe0z.mongodb.net/data');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define the schema for the collection
const draftStoreSchema = new mongoose.Schema({
  ownerName: String,
  leadGeneratorPhone: String,
  leadGeneratedBy: String,
  salesStoreStatus: String,
  storeName:String,
  meta:Object,
  storeImage:String,
  gstImage:String,
  panImage: String,
  // Add other fields as needed
});

const DraftStore = mongoose.model('draftstores', draftStoreSchema);

const salesPeopleSchema = new mongoose.Schema({
  phone: Number,
  isActive: Boolean,
  isVerified: Boolean,
  name: String,
  userType: String,
  aadharNumber: String,
  assignedArea: String,
},{collection:'salespeople'});

// Create a model for the salespeople collection
const SalesPeople = mongoose.model('salespeople', salesPeopleSchema);

// Serve static files from the public directory
app.use(express.static('public'));

app.get('/api/storedetails', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 4;
    const searchQuery = req.query.search || '';
    const selectedStatus = req.query.status || '';
    const sortOrder = parseInt(req.query.sortOrder) || 1; 
    const aggregationPipeline = [
      {
        $group: {
          _id: '$storeName',
          storeName: {$first: '$storeName'},
          ownerName: {$first: '$ownerName'},
          ownerPhone: {$first: '$ownerPrimaryPhone'},
          ownerSecondaryPhone: {$first: '$ownerSecondaryPhone'},
          salesPerson: {$first: '$leadGeneratorPhone'},
          salesPersonName: { $first: '$leadGeneratedBy' },
          registrationStatus: {$first: '$registrationStatus'},
          storeStatus: {$first: '$salesStoreStatus'},
          createdDate: { $first: '$meta.cA' },
          storeImage: {$first: '$storeImage'},
          gstImage: {$first: '$gstImage'},
          panImage: {$first: '$panImage'},
        },
      },
      // { $sort: { storeName: 1 } },
      { $sort: { createdDate: sortOrder } }, // Add this line for sorting
      {
        $match: {
          $or: [
            { storeName: { $regex: searchQuery, $options: 'i' } },
            { ownerName: { $regex: searchQuery, $options: 'i' } },
          ],
          // condition to filter by selectedStatus
          ...(selectedStatus ? { storeStatus: selectedStatus } : {}),
        },
      },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ];

    const data = await DraftStore.aggregate(aggregationPipeline);

    const totalRows = await DraftStore.aggregate([
      ...aggregationPipeline.slice(0, aggregationPipeline.length - 2),
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    const total = Math.ceil(totalRows[0]?.count / pageSize) || 1;

    res.json({ data, total, currentPage: page });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/stores', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 6;
    const searchQuery = req.query.search || '';
    const selectedStatus = req.query.status || '';
    const sortOrder = parseInt(req.query.sortOrder) || 1; 
    const aggregationPipeline = [
      {
        $group: {
          _id: '$storeName',
          storeName: {$first: '$storeName'},
          salesPerson: {$first: '$leadGeneratorPhone'},
          salesPersonName: { $first: '$leadGeneratedBy' },
          registrationStatus: {$first: '$registrationStatus'},
          storeStatus: {$first: '$salesStoreStatus'},
          createdDate: { $first: '$meta.cA' },
        },
      },
      // { $sort: { storeName: 1 } },
      { $sort: { createdDate: sortOrder } }, // Add this line for sorting
      {
        $match: {
          $or: [
            { storeName: { $regex: searchQuery, $options: 'i' } },
            { salesPersonName: { $regex: searchQuery, $options: 'i' } },
          ],
          // condition to filter by selectedStatus
          ...(selectedStatus ? { storeStatus: selectedStatus } : {}),
        },
      },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ];

    const data = await DraftStore.aggregate(aggregationPipeline);

    const totalRows = await DraftStore.aggregate([
      ...aggregationPipeline.slice(0, aggregationPipeline.length - 2),
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    const total = Math.ceil(totalRows[0]?.count / pageSize) || 1;

    res.json({ data, total, currentPage: page });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/salespeople', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 6;
    const searchQuery = req.query.search || '';

    const aggregationPipeline = [
      {
        $group: {
          _id: '$leadGeneratorPhone',
          salesPerson: { $first: '$leadGeneratorPhone' },
          salesPersonName: { $first: '$leadGeneratedBy' },
          totalStoresCreated: { $sum: 1 },
          documentsPending: {
            $sum: {
              $cond: { if: { $eq: ['$salesStoreStatus', 'DOCUMENT_PENDING'] }, then: 1, else: 0 },
            },
          },
          appDownloadPending: {
            $sum: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$salesStoreStatus', 'APP_DOWNLOAD_PENDING'] },
                    { $eq: ['$salesStoreStatus', 'DOCUMENT_PENDING'] },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
          rejected: {
            $sum: {
              $cond: { if: { $eq: ['$salesStoreStatus', 'REJECTED'] }, then: 1, else: 0 },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'salespeople',
          localField: 'salesPerson',
          foreignField: 'phone',
          as: 'salespersonDetails',
        },
      },
      { $sort: { salesPerson: 1 } },
      {
        $match: {
          $or: [
            { salesPerson: { $regex: searchQuery, $options: 'i' } },
            { salesPersonName: { $regex: searchQuery, $options: 'i' } },
          ],
        },
      },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ];

    const data = await DraftStore.aggregate(aggregationPipeline);

    const salesPeoplePhones = data.map((row) => row.salesPerson);
    const salesPeopleData = await SalesPeople.find({ phone: { $in: salesPeoplePhones } });
    const totalRows = await DraftStore.aggregate([
      ...aggregationPipeline.slice(0, aggregationPipeline.length - 2),
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    const total = Math.ceil(totalRows[0]?.count / pageSize) || 1;

    res.json({ data, salesPeopleData, total, currentPage: page });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/updateAssignedArea/:id', express.json(), async (req, res) => {
  const salesPersonId = req.params.id;
  const { assignedArea } = req.body;

  try {
    const updatedSalesPerson = await SalesPeople.findByIdAndUpdate(
      salesPersonId,
      { assignedArea },
      { new: true }
    ).lean(); // Use lean() for queries that don't require Mongoose features

    res.json(updatedSalesPerson);
  } catch (error) {
    console.error('Error updating assigned area:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


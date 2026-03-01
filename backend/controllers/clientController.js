const Client = require('../models/Client');

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .select('-password');
    
    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get client by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('-password');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new client
exports.createClient = async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    
    const clientData = client.toObject();
    delete clientData.password;
    
    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: clientData
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    // Don't allow password update through this endpoint
    delete req.body.password;
    
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete client (soft delete)
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: 'inactive' },
      { new: true }
    ).select('-password');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Client deleted successfully',
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get client statistics
exports.getClientStats = async (req, res) => {
  try {
    const stats = await Client.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await Client.countDocuments({ isActive: true });
    const totalOutstanding = await Client.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: '$outstandingBalance' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        byStatus: stats,
        totalOutstanding: totalOutstanding[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get client payment statement with all transactions
exports.getClientStatement = async (req, res) => {
  try {
    const clientId = req.params.id;
    const Trip = require('../models/Trip');
    const ClientPayment = require('../models/ClientPayment');
    const ClientExpense = require('../models/ClientExpense');
    
    // Get client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Get all active trips for this client
    const trips = await Trip.find({
      'clients.clientId': clientId,
      isActive: true
    }).sort({ loadDate: -1 });
    
    // Prepare statement entries
    const statementEntries = [];
    let totalCredit = 0; // Payments (advances)
    let totalDebit = 0;  // Expenses
    
    // Process each trip for statement
    for (const trip of trips) {
      const clientData = trip.clients.find(c => c.clientId.toString() === clientId);
      if (!clientData) continue;
      
      // Get payments (advances) for this trip - CREDIT
      const payments = await ClientPayment.find({
        tripId: trip._id,
        clientId: clientId
      }).sort({ paymentDate: -1 });
      
      payments.forEach(payment => {
        const amount = payment.amount || 0;
        statementEntries.push({
          id: payment._id.toString(),
          tripNumber: trip.tripNumber,
          tripId: trip._id,
          date: payment.paymentDate || payment.createdAt,
          reason: payment.remarks || 'Payment Received',
          type: 'advance',
          debit: 0,
          credit: amount,
          details: `${payment.paymentMode || 'Cash'} - ${payment.remarks || 'Payment received'}`,
          status: 'completed'
        });
        totalCredit += amount;
      });
      
      // Get expenses for this trip - DEBIT
      const expenses = await ClientExpense.find({
        tripId: trip._id,
        clientId: clientId
      }).sort({ expenseDate: -1 });
      
      expenses.forEach(expense => {
        const amount = expense.amount || 0;
        statementEntries.push({
          id: expense._id.toString(),
          tripNumber: trip.tripNumber,
          tripId: trip._id,
          date: expense.expenseDate || expense.createdAt,
          reason: expense.expenseType || 'Client Expense',
          type: 'expense',
          debit: amount,
          credit: 0,
          details: `${expense.expenseType || 'Other'} - ${expense.description || expense.remarks || 'Expense added'}`,
          description: expense.description || expense.remarks || '',
          status: 'completed'
        });
        totalDebit += amount;
      });
    }
    
    // Sort statement by date (newest first)
    statementEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Closing Balance = Credit - Debit
    const closingBalance = totalCredit - totalDebit;
    
    // Calculate trip summaries
    let overallBalance = 0;
    let totalBelowAdvance = 0;
    let totalBelowSeventyPercentValue = 0;
    
    const tripSummaries = await Promise.all(trips.map(async (trip) => {
      const clientData = trip.clients.find(c => c.clientId.toString() === clientId);
      if (!clientData) return null;
      
      const totalRate = clientData.clientRate || 0;
      const adjustment = clientData.adjustment || 0;
      const finalTotal = totalRate - adjustment;
      
      // Get payments
      const payments = await ClientPayment.find({
        tripId: trip._id,
        clientId: clientId
      });
      const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Get expenses
      const expenses = await ClientExpense.find({
        tripId: trip._id,
        clientId: clientId
      });
      const expenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      
      // Calculate balance
      const balance = finalTotal - paidAmount + expenseAmount;
      overallBalance += balance;
      
      // Calculate percentages
      const percentagePaid = finalTotal > 0 ? (paidAmount / finalTotal) * 100 : 0;
      const seventyPercentOfTotal = (finalTotal * 70) / 100;
      const remainingToReach70 = Math.max(seventyPercentOfTotal - paidAmount, 0);
      const remainingAfterSeventy = Math.max(finalTotal - paidAmount + expenseAmount, 0);
      
      // Track below 70% totals
      if (percentagePaid < 70) {
        totalBelowAdvance += paidAmount;
        totalBelowSeventyPercentValue += seventyPercentOfTotal;
      }
      
      return {
        tripId: trip._id,
        tripNumber: trip.tripNumber,
        tripStatus: trip.status,
        loadDate: trip.loadDate,
        from: trip.from,
        to: trip.to,
        clientRate: totalRate,
        adjustment: adjustment,
        total: finalTotal,
        paid: paidAmount,
        expenses: expenseAmount,
        balance: balance,
        percentagePaid: Number(percentagePaid.toFixed(2)),
        seventyPercentOfTotal: Number(seventyPercentOfTotal.toFixed(2)),
        remainingToReach70Percent: Number(remainingToReach70.toFixed(2)),
        remainingAfterSeventy: Number(remainingAfterSeventy.toFixed(2)),
        paymentStatus: percentagePaid >= 70 ? 'paid' : percentagePaid > 0 ? 'partial' : 'pending'
      };
    }));
    
    // Filter out null values
    const validTripSummaries = tripSummaries.filter(t => t !== null);
    
    // Categorize trips
    const seventyOrAbove = validTripSummaries.filter(trip => trip.percentagePaid >= 70);
    const belowSeventy = validTripSummaries.filter(trip => trip.percentagePaid < 70);
    
    // Calculate pending advance to reach 70%
    const pendingBelowAdvance = totalBelowSeventyPercentValue - totalBelowAdvance;
    
    // Calculate overall stats
    const totalAmount = validTripSummaries.reduce((sum, t) => sum + t.total, 0);
    const totalPaid = validTripSummaries.reduce((sum, t) => sum + t.paid, 0);
    const totalExpenses = validTripSummaries.reduce((sum, t) => sum + t.expenses, 0);
    const seventyPercentRequired = (totalAmount * 70) / 100;
    
    res.json({
      success: true,
      data: {
        client: {
          _id: client._id,
          fullName: client.fullName,
          companyName: client.companyName,
          contact: client.contact,
          email: client.email
        },
        totalBalance: overallBalance,
        statement: {
          totalDebit,
          totalCredit,
          closingBalance,
          entries: statementEntries
        },
        stats: {
          totalTrips: validTripSummaries.length,
          totalAmount,
          totalPaid,
          totalExpenses,
          seventyPercentRequired: Number(seventyPercentRequired.toFixed(2)),
          pendingToReach70: Number(pendingBelowAdvance.toFixed(2)),
          overallBalance
        },
        summaryByPercentage: {
          seventyOrAbove: {
            totalTrips: seventyOrAbove.length,
            totalPaid: seventyOrAbove.reduce((sum, t) => sum + t.paid, 0),
            totalAmount: seventyOrAbove.reduce((sum, t) => sum + t.total, 0),
            trips: seventyOrAbove
          },
          belowSeventy: {
            totalTrips: belowSeventy.length,
            totalAdvance: Number(totalBelowAdvance.toFixed(2)),
            seventyPercentTotal: Number(totalBelowSeventyPercentValue.toFixed(2)),
            pendingAdvanceToReach70Percent: Number(pendingBelowAdvance.toFixed(2)),
            trips: belowSeventy
          }
        },
        trips: validTripSummaries
      }
    });
  } catch (error) {
    console.error('Error getting client statement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

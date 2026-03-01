import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

/**
 * Generate and download client receipt for a trip
 * @param {Object} trip - Trip data with all details
 * @param {Object} client - Client data
 * @param {Array} clientPayments - Array of client payments
 * @param {Function} formatCurrency - Currency formatting function
 */
export const generateClientReceipt = async (trip, client, clientPayments = [], formatCurrency = (val) => `₹${val}`) => {
  try {
    // Create a hidden div for the receipt
    const receiptDiv = document.createElement('div');
    receiptDiv.style.position = 'absolute';
    receiptDiv.style.left = '-9999px';
    receiptDiv.style.width = '800px';
    receiptDiv.style.backgroundColor = 'white';
    receiptDiv.style.padding = '40px';
    receiptDiv.style.fontFamily = 'Arial, sans-serif';
    
    // Calculate values
    const totalFright = trip.clientRate || trip.total || 0;
    const advancePaid = trip.paid || 0;
    const simpleBalance = totalFright - advancePaid;
    const expenses = trip.expenses || 0;
    const totalBalance = trip.balance || (simpleBalance + expenses);
    
    // Build the receipt HTML matching Excel format
    receiptDiv.innerHTML = `
      <div style="width: 100%; background: white;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="font-size: 12px; margin-bottom: 5px;">श्री गणेशाय नमः</div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 16px; font-weight: bold;">Mohit Choudhary</div>
          <div style="font-size: 12px;">MOB : 6375916182</div>
        </div>
        
        <div style="text-align: center; margin-bottom: 5px;">
          <div style="font-size: 22px; font-weight: bold; border-bottom: 2px solid black; padding-bottom: 5px;">
            Bombay Uttranchal Tempo Service
          </div>
        </div>
        
        <div style="text-align: center; font-size: 11px; margin-bottom: 3px;">
          Building No.C13, Gala No.01, Parasnath Complex,
        </div>
        <div style="text-align: center; font-size: 11px; margin-bottom: 20px;">
          Dapoda, Bhiwandi, Dist. Thane 421302 (MH)
        </div>
        
        <!-- Receipt Title -->
        <div style="background: #3f51b5; color: white; text-align: center; padding: 8px; font-weight: bold; font-size: 13px; margin-bottom: 15px;">
          Receipt Client Pending Amount
        </div>
        
        <!-- Client Information -->
        <div style="background: #e0e0e0; padding: 5px; text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 10px;">
          CLIENT INFORMATION
        </div>
        
        <div style="font-size: 12px; margin-bottom: 20px; padding-left: 10px;">
          Name : ${client.fullName || client.companyName || client.clientId?.fullName || client.clientId?.companyName || 'N/A'}
        </div>
        
        <!-- Trip Details -->
        <div style="background: #e0e0e0; padding: 5px; text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 10px;">
          Trip Datile
        </div>
        
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px;">
          <div style="flex: 1;">Date : ${new Date(trip.loadDate).toLocaleDateString('en-GB')}</div>
          <div style="flex: 1; text-align: right;">FROM  ${trip.originCity?.cityName || client.originCity?.cityName || 'N/A'}</div>
        </div>
        
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px;">
          <div style="flex: 1;">Vehicle No : ${trip.vehicleNumber || trip.vehicleId?.vehicleNumber || 'N/A'}</div>
          <div style="flex: 1; text-align: right;">To      ${trip.destinationCity?.cityName || client.destinationCity?.cityName || 'N/A'}</div>
        </div>
        
        <div style="font-size: 11px; margin-bottom: 5px;">Trip No : ${trip.tripNumber || ''}</div>
        <div style="font-size: 11px; margin-bottom: 5px;">Quintity : 302</div>
        <div style="font-size: 11px; margin-bottom: 20px;">Packing : ${trip.packagingType || client.packagingType || 'Paillet'}</div>
        
        <!-- Financial Details -->
        <div style="background: #3f51b5; height: 8px; margin-bottom: 15px;"></div>
        
        <div style="font-size: 12px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; padding: 0 20px;">
            <span>Total Fright</span>
            <span style="text-align: right; min-width: 80px;">${totalFright}</span>
          </div>
        </div>
        
        <div style="font-size: 12px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; padding: 0 20px;">
            <span>Advance Paid</span>
            <span style="text-align: right; min-width: 80px;">${advancePaid}</span>
          </div>
        </div>
        
        <div style="font-size: 12px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; padding: 0 20px;">
            <span>Blance</span>
            <span style="text-align: right; min-width: 80px;">${simpleBalance}</span>
          </div>
        </div>
        
        <div style="font-size: 12px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; padding: 0 20px;">
            <span>EXPANCES ADD</span>
            <span style="text-align: right; min-width: 80px;">${expenses}</span>
          </div>
        </div>
        
        <!-- Total Balance -->
        <div style="background: #d0d0d0; padding: 8px 20px; font-size: 13px; font-weight: bold; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between;">
            <span>TOTAL Blance</span>
            <span style="margin: 0 20px;">.</span>
            <span style="text-align: right; min-width: 80px;">${totalBalance}</span>
          </div>
        </div>
        
        <!-- Trip Client Advance Details -->
        <div style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 15px;">
          Trip Client Advance Details
        </div>
        
        ${clientPayments && clientPayments.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #3f51b5; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Sr.</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Date</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Amount</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Mode</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${clientPayments.map((payment, index) => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${index + 1}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${new Date(payment.paymentDate).toLocaleDateString('en-GB')}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${payment.amount}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${payment.paymentMethod || 'Cash'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${payment.notes || payment.purpose || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div style="text-align: center; padding: 20px; color: #666;">
            No advance payments recorded
          </div>
        `}
      </div>
    `;
    
    document.body.appendChild(receiptDiv);
    
    // Generate canvas from HTML
    const canvas = await html2canvas(receiptDiv, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });
    
    // Remove the temporary div
    document.body.removeChild(receiptDiv);
    
    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    const clientName = client.fullName || client.companyName || client.clientId?.fullName || client.clientId?.companyName || 'Client';
    pdf.save(`Receipt_${trip.tripNumber}_${clientName}.pdf`);
    
    toast.success('Receipt downloaded successfully');
    return true;
    
  } catch (error) {
    console.error('Error generating receipt:', error);
    toast.error('Failed to generate receipt');
    return false;
  }
};

/**
 * Generate and download client balance statement (all trips summary)
 * @param {Object} client - Client data
 * @param {Array} trips - Array of all trips for this client
 * @param {Object} transactions - Transaction data with payments and expenses
 * @param {Function} formatCurrency - Currency formatting function
 */
export const generateClientBalanceStatement = async (client, trips = [], transactions = [], formatCurrency = (val) => `₹${val}`) => {
  try {
    // Calculate totals from trips data
    const totalTrips = trips.length;
    const totalFrightAmount = trips.reduce((sum, trip) => sum + (trip.clientRate || trip.total || 0), 0);
    const totalPaid = trips.reduce((sum, trip) => sum + (trip.paid || 0), 0);
    const totalExpenses = trips.reduce((sum, trip) => sum + (trip.expenses || 0), 0);
    
    // Total Balance = Total Fright - Total Paid + Total Expenses
    const totalBalance = totalFrightAmount - totalPaid + totalExpenses;
    
    // Create a hidden div for the statement
    const statementDiv = document.createElement('div');
    statementDiv.style.position = 'absolute';
    statementDiv.style.left = '-9999px';
    statementDiv.style.width = '900px';
    statementDiv.style.backgroundColor = 'white';
    statementDiv.style.padding = '40px';
    statementDiv.style.fontFamily = 'Arial, sans-serif';
    
    // Build the statement HTML
    statementDiv.innerHTML = `
      <div style="width: 100%; background: white;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="font-size: 12px; margin-bottom: 5px;">श्री गणेशाय नमः</div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 16px; font-weight: bold;">Mohit Choudhary</div>
          <div style="font-size: 12px;">MOB : 6375916182</div>
        </div>
        
        <div style="text-align: center; margin-bottom: 5px;">
          <div style="font-size: 22px; font-weight: bold; border-bottom: 2px solid black; padding-bottom: 5px;">
            Bombay Uttranchal Tempo Service
          </div>
        </div>
        
        <div style="text-align: center; font-size: 11px; margin-bottom: 3px;">
          Building No.C13, Gala No.01, Parasnath Complex,
        </div>
        <div style="text-align: center; font-size: 11px; margin-bottom: 20px;">
          Dapoda, Bhiwandi, Dist. Thane 421302 (MH)
        </div>
        
        <!-- Statement Title -->
        <div style="background: #3f51b5; color: white; text-align: center; padding: 8px; font-weight: bold; font-size: 13px; margin-bottom: 15px;">
          Receipt Client Pending Amount
        </div>
        
        <!-- Client Information -->
        <div style="background: #e0e0e0; padding: 5px; text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 10px;">
          CLIENT INFORMATION
        </div>
        
        <div style="font-size: 12px; margin-bottom: 20px; padding-left: 10px;">
          Name : ${client.fullName || client.companyName || 'N/A'}
        </div>
        
        <!-- Statement Summary -->
        <div style="background: #e0e0e0; padding: 5px; text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 10px;">
          STATEMENT SUMMARY
        </div>
        
        <div style="font-size: 11px; margin-bottom: 20px; padding: 0 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Total</span>
            <span style="text-align: right; min-width: 100px;">${totalTrips < 10 ? '0' + totalTrips : totalTrips}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Total Fright Amount</span>
            <span style="text-align: right; min-width: 100px;">${totalFrightAmount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Total Credit</span>
            <span style="text-align: right; min-width: 100px;">${totalPaid}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Total Blance</span>
            <span style="text-align: right; min-width: 100px;">${totalBalance}</span>
          </div>
        </div>
        
        <!-- Transaction Details -->
        <div style="background: #e0e0e0; padding: 5px; text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 10px;">
          TRANSACTION DETAILS
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #e0e0e0;">
              <th style="border: 1px solid #999; padding: 6px; text-align: center; font-weight: bold;">Trip No.</th>
              <th style="border: 1px solid #999; padding: 6px; text-align: center; font-weight: bold;">Date</th>
              <th style="border: 1px solid #999; padding: 6px; text-align: center; font-weight: bold;">Vehicle No</th>
              <th style="border: 1px solid #999; padding: 6px; text-align: center; font-weight: bold;">Fright</th>
              <th style="border: 1px solid #999; padding: 6px; text-align: center; font-weight: bold;">Credit Amt</th>
              <th style="border: 1px solid #999; padding: 6px; text-align: center; font-weight: bold;">Blance</th>
            </tr>
          </thead>
          <tbody>
            ${trips.map((trip, index) => {
              // Running balance calculation: Fright - Paid + Expenses (cumulative)
              const runningBalance = trips.slice(0, index + 1).reduce((sum, t) => {
                const fright = t.clientRate || t.total || 0;
                const paid = t.paid || 0;
                const expenses = t.expenses || 0;
                return sum + (fright - paid + expenses);
              }, 0);
              
              // Get vehicle number from multiple possible sources
              const vehicleNo = trip.vehicleNumber || 
                               trip.vehicleId?.vehicleNumber || 
                               trip.vehicle?.vehicleNumber ||
                               trip.vehicleNo ||
                               'N/A';
              
              return `
                <tr>
                  <td style="border: 1px solid #999; padding: 5px; text-align: center;">${trip.tripNumber || '-'}</td>
                  <td style="border: 1px solid #999; padding: 5px; text-align: center;">${new Date(trip.loadDate).toLocaleDateString('en-GB')}</td>
                  <td style="border: 1px solid #999; padding: 5px; text-align: center;">${vehicleNo}</td>
                  <td style="border: 1px solid #999; padding: 5px; text-align: center;">${trip.clientRate || trip.total || 0}</td>
                  <td style="border: 1px solid #999; padding: 5px; text-align: center;">${trip.paid || 0}</td>
                  <td style="border: 1px solid #999; padding: 5px; text-align: center;">${runningBalance}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <!-- Total Row -->
        <div style="border: 2px solid #000; padding: 10px; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold;">
            <span>TOTAL</span>
            <span style="margin-left: 200px;">${totalFrightAmount}</span>
            <span style="margin-left: 50px;">${totalPaid}</span>
            <span style="margin-left: 50px;">${totalBalance}</span>
          </div>
        </div>
        
        <!-- Signature -->
        <div style="text-align: right; margin-top: 60px;">
          <div style="display: inline-block; text-align: center;">
            <div style="font-size: 11px; margin-bottom: 40px;">Signature</div>
            <div style="border-top: 1px solid #000; width: 150px;"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(statementDiv);
    
    // Generate canvas from HTML
    const canvas = await html2canvas(statementDiv, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });
    
    // Remove the temporary div
    document.body.removeChild(statementDiv);
    
    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    const clientName = client.fullName || client.companyName || 'Client';
    pdf.save(`Client_Balance_Statement_${clientName}.pdf`);
    
    toast.success('Balance statement downloaded successfully');
    return true;
    
  } catch (error) {
    console.error('Error generating balance statement:', error);
    toast.error('Failed to generate balance statement');
    return false;
  }
};

/**
 * Generate and download client adjustment statement
 * @param {Object} client - Client data
 * @param {Array} adjustmentTrips - Array of trips with adjustments
 * @param {Object} stats - Adjustment statistics
 * @param {Function} formatCurrency - Currency formatting function
 */
export const generateClientAdjustmentStatement = async (client, adjustmentTrips = [], stats = {}, formatCurrency = (val) => `₹${val}`) => {
  try {
    // Create a hidden div for the statement
    const statementDiv = document.createElement('div');
    statementDiv.style.position = 'absolute';
    statementDiv.style.left = '-9999px';
    statementDiv.style.width = '900px';
    statementDiv.style.backgroundColor = 'white';
    statementDiv.style.padding = '40px';
    statementDiv.style.fontFamily = 'Arial, sans-serif';
    
    // Build the statement HTML
    statementDiv.innerHTML = `
      <div style="width: 100%; background: white;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="font-size: 12px; margin-bottom: 5px;">श्री गणेशाय नमः</div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 16px; font-weight: bold;">Mohit Choudhary</div>
          <div style="font-size: 12px;">MOB : 6375916182</div>
        </div>
        
        <div style="text-align: center; margin-bottom: 5px;">
          <div style="font-size: 22px; font-weight: bold; border-bottom: 2px solid black; padding-bottom: 5px;">
            Bombay Uttranchal Tempo Service
          </div>
        </div>
        
        <div style="text-align: center; font-size: 11px; margin-bottom: 3px;">
          Building No.C13, Gala No.01, Parasnath Complex, Dapoda,
        </div>
        <div style="text-align: center; font-size: 11px; margin-bottom: 20px;">
          Dapoda, Bhiwandi, Dist. Thane 421302 (MH)
        </div>
        
        <!-- Client Details -->
        <div style="font-size: 12px; margin-bottom: 5px;">
          <strong>Client Name :</strong> ${client.fullName || client.companyName || 'N/A'}
        </div>
        <div style="font-size: 12px; margin-bottom: 5px;">
          <strong>Total Trip :</strong> ${stats.totalTrips < 10 ? '0' + stats.totalTrips : stats.totalTrips}
        </div>
        <div style="font-size: 12px; margin-bottom: 5px;">
          <strong>Total Adjustment :</strong> ${stats.totalAdjustment || 0}
        </div>
        <div style="font-size: 12px; margin-bottom: 5px;">
          <strong>Total Paid Adjustment :</strong> ${stats.totalPaid || 0}
        </div>
        <div style="font-size: 12px; margin-bottom: 20px;">
          <strong>Total Painding Adjustment :</strong> ${stats.totalPending || 0}
        </div>
        
        <!-- Adjustment Details -->
        <div style="background: #4472c4; color: white; text-align: center; padding: 8px; font-weight: bold; font-size: 13px; margin-bottom: 10px;">
          Adjustment Details
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #4472c4; color: white;">
              <th style="border: 1px solid #999; padding: 8px; text-align: center; font-weight: bold;">Sr.No</th>
              <th style="border: 1px solid #999; padding: 8px; text-align: center; font-weight: bold;">Date</th>
              <th style="border: 1px solid #999; padding: 8px; text-align: center; font-weight: bold;">Trip No</th>
              <th style="border: 1px solid #999; padding: 8px; text-align: center; font-weight: bold;">Vehicle No</th>
              <th style="border: 1px solid #999; padding: 8px; text-align: center; font-weight: bold;">Adjustment</th>
            </tr>
          </thead>
          <tbody>
            ${adjustmentTrips.map((trip, index) => {
              const vehicleNo = trip.vehicleNumber || 
                               trip.vehicleId?.vehicleNumber || 
                               trip.vehicle?.vehicleNumber ||
                               'N/A';
              
              return `
                <tr>
                  <td style="border: 1px solid #999; padding: 6px; text-align: center;">${index < 9 ? '0' + (index + 1) : (index + 1)}</td>
                  <td style="border: 1px solid #999; padding: 6px; text-align: center;">${new Date(trip.loadDate).toLocaleDateString('en-GB')}</td>
                  <td style="border: 1px solid #999; padding: 6px; text-align: center;">${trip.tripNumber || '-'}</td>
                  <td style="border: 1px solid #999; padding: 6px; text-align: center;">${vehicleNo}</td>
                  <td style="border: 1px solid #999; padding: 6px; text-align: center;">${trip.adjustment || 0}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <!-- Client Adjustment Title -->
        <div style="text-align: center; font-size: 18px; font-weight: bold; margin-top: 40px;">
          Client Adjustment
        </div>
      </div>
    `;
    
    document.body.appendChild(statementDiv);
    
    // Generate canvas from HTML
    const canvas = await html2canvas(statementDiv, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });
    
    // Remove the temporary div
    document.body.removeChild(statementDiv);
    
    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    const clientName = client.fullName || client.companyName || 'Client';
    pdf.save(`Client_Adjustment_Statement_${clientName}.pdf`);
    
    toast.success('Adjustment statement downloaded successfully');
    return true;
    
  } catch (error) {
    console.error('Error generating adjustment statement:', error);
    toast.error('Failed to generate adjustment statement');
    return false;
  }
};

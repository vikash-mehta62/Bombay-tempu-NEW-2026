import jsPDF from 'jspdf';

/**
 * Generate Fleet Owner Receipt PDF
 * @param {Object} trip - Trip data
 * @param {Object} fleetOwner - Fleet owner data
 * @param {Array} expenses - Trip expenses
 * @param {Array} advances - Trip advances
 */
export const generateFleetOwnerReceipt = (trip, fleetOwner, expenses, advances) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  let yPos = 20;
  const leftMargin = 15;
  const rightMargin = pageWidth - 15;
  const contentWidth = rightMargin - leftMargin;

  // Helper function to draw a line
  const drawLine = (y, thickness = 0.5) => {
    pdf.setLineWidth(thickness);
    pdf.line(leftMargin, y, rightMargin, y);
  };

  // Helper function to add text with word wrap
  const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Header - Company Name
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('श्री गणेशाय नमः', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Owner Name and Mobile
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Mohit Choudhary', leftMargin, yPos);
  pdf.text('MOB : 6375916182', rightMargin, yPos, { align: 'right' });
  yPos += 8;

  // Company Name - Large
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bombay Uttranchal Tempo Service', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Address
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const address = 'Building No.C13, Gala No.01, Parasnath Complex, Dapoda,';
  pdf.text(address, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  pdf.text('Dapoda, Bhiwandi, Dist. Thane 421302 (MH)', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Fleet Owner Section Header
  pdf.setFillColor(173, 216, 230); // Light blue
  pdf.rect(leftMargin, yPos, contentWidth, 7, 'F');
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Fleet Owner', leftMargin + 2, yPos + 5);
  yPos += 7;

  // Fleet Owner Details
  drawLine(yPos);
  yPos += 5;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const ownerName = `Owner Name : ${fleetOwner?.fullName || 'N/A'}`;
  const vehicleNo = `Vehicle No : ${trip.vehicleId?.vehicleNumber || 'N/A'}`;
  pdf.text(ownerName, leftMargin + 2, yPos);
  pdf.text(vehicleNo, rightMargin - 2, yPos, { align: 'right' });
  yPos += 5;
  
  const mobNo = `Mob No : ${fleetOwner?.contact || 'N/A'}`;
  const tripNo = `Trip No : ${trip.tripNumber || 'N/A'}`;
  pdf.text(mobNo, leftMargin + 2, yPos);
  pdf.text(tripNo, rightMargin - 2, yPos, { align: 'right' });
  yPos += 5;
  
  drawLine(yPos);
  yPos += 7;
  
  // Calculate all financial values at the beginning
  const totalFreight = trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0;
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalAdvances = advances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
  const commission = trip.commission || 0;
  const balancePOD = trip.balancePOD || 0;
  
  // Financial Summary Cards - Image wala logic
  const totalFleetOwnerPayment = totalFreight + totalExpenses; // TruckHireCost + Expenses
  const pendingBalance = totalFleetOwnerPayment - commission - balancePOD - totalAdvances; // Pending
  const finalAmount = pendingBalance; // Final Amount = Pending Balance
  
  // Draw three boxes for financial summary
  const boxWidth = (contentWidth - 4) / 3;
  const boxHeight = 18;
  
  // Box 1: Total Fleet Owner
  pdf.setFillColor(220, 252, 231); // Light green
  pdf.rect(leftMargin, yPos, boxWidth, boxHeight, 'F');
  pdf.setDrawColor(134, 239, 172); // Green border
  pdf.rect(leftMargin, yPos, boxWidth, boxHeight, 'S');
  pdf.setFontSize(8);
  pdf.setTextColor(22, 163, 74); // Green text
  pdf.text('Total Fleet Owner', leftMargin + 2, yPos + 4);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(totalFleetOwnerPayment), leftMargin + 2, yPos + 10);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Hire + Expenses', leftMargin + 2, yPos + 15);
  
  // Box 2: Pending Balance
  pdf.setFillColor(254, 243, 199); // Light orange
  pdf.rect(leftMargin + boxWidth + 2, yPos, boxWidth, boxHeight, 'F');
  pdf.setDrawColor(251, 191, 36); // Orange border
  pdf.rect(leftMargin + boxWidth + 2, yPos, boxWidth, boxHeight, 'S');
  pdf.setFontSize(8);
  pdf.setTextColor(234, 88, 12); // Orange text
  pdf.text('Pending Balance', leftMargin + boxWidth + 4, yPos + 4);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(pendingBalance), leftMargin + boxWidth + 4, yPos + 10);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('To be paid', leftMargin + boxWidth + 4, yPos + 15);
  
  // Box 3: Profit/Loss
  if (finalAmount >= 0) {
    pdf.setFillColor(219, 234, 254); // Light blue
    pdf.setDrawColor(147, 197, 253); // Blue border
  } else {
    pdf.setFillColor(254, 226, 226); // Light red
    pdf.setDrawColor(252, 165, 165); // Red border
  }
  pdf.rect(leftMargin + (boxWidth + 2) * 2, yPos, boxWidth, boxHeight, 'F');
  pdf.rect(leftMargin + (boxWidth + 2) * 2, yPos, boxWidth, boxHeight, 'S');
  pdf.setFontSize(8);
  if (finalAmount >= 0) {
    pdf.setTextColor(37, 99, 235); // Blue text
    pdf.text('Profit', leftMargin + (boxWidth + 2) * 2 + 2, yPos + 4);
  } else {
    pdf.setTextColor(220, 38, 38); // Red text
    pdf.text('Loss', leftMargin + (boxWidth + 2) * 2 + 2, yPos + 4);
  }
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(Math.abs(finalAmount)), leftMargin + (boxWidth + 2) * 2 + 2, yPos + 10);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('After deductions', leftMargin + (boxWidth + 2) * 2 + 2, yPos + 15);
  
  yPos += boxHeight + 7;
  
  // Reset colors
  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');

  // Client Details Table Header
  pdf.setFillColor(173, 216, 230);
  pdf.rect(leftMargin, yPos, contentWidth, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  
  const colWidths = {
    date: 22,
    client: 45,
    fight: 20,
    from: 40,
    to: 40
  };
  
  let xPos = leftMargin + 2;
  pdf.text('Date', xPos, yPos + 5);
  xPos += colWidths.date;
  pdf.text('Client Name', xPos, yPos + 5);
  xPos += colWidths.client;
  pdf.text('Fight', xPos, yPos + 5);
  xPos += colWidths.fight;
  pdf.text('From', xPos, yPos + 5);
  xPos += colWidths.from;
  pdf.text('To', xPos, yPos + 5);
  yPos += 7;

  // Client Details Rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  if (trip.clients && trip.clients.length > 0) {
    trip.clients.forEach((client, index) => {
      drawLine(yPos, 0.3);
      yPos += 4;
      
      xPos = leftMargin + 2;
      const startDate = trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-GB') : 'N/A';
      pdf.text(startDate, xPos, yPos);
      
      xPos += colWidths.date;
      const clientName = client.clientId?.fullName || client.clientId?.companyName || 'N/A';
      pdf.text(clientName.substring(0, 18), xPos, yPos);
      
      xPos += colWidths.client;
      pdf.text(String(client.truckHireCost || 0), xPos, yPos);
      
      xPos += colWidths.fight;
      const fromCity = client.from || '-';
      pdf.text(fromCity.substring(0, 15), xPos, yPos);
      
      xPos += colWidths.from;
      const toCity = client.to || '-';
      pdf.text(toCity.substring(0, 15), xPos, yPos);
      
      yPos += 5;
    });
  } else {
    drawLine(yPos, 0.3);
    yPos += 4;
    xPos = leftMargin + 2;
    pdf.text('N/A', xPos, yPos);
    xPos += colWidths.date;
    pdf.text('No clients', xPos, yPos);
    xPos += colWidths.client;
    pdf.text('0', xPos, yPos);
    yPos += 5;
  }
  
  drawLine(yPos, 0.3);
  yPos += 5;
  
  // Total
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total', leftMargin + colWidths.date + 2, yPos);
  pdf.text(String(totalFreight), leftMargin + colWidths.date + colWidths.client + 2, yPos);
  yPos += 7;

  // Expenses Section
  pdf.setFillColor(173, 216, 230);
  pdf.rect(leftMargin, yPos, contentWidth, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Total', leftMargin + 2, yPos + 5);
  pdf.text('Expances', leftMargin + contentWidth / 2, yPos + 5, { align: 'center' });
  yPos += 7;

  // Expense Details
  drawLine(yPos);
  yPos += 5;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const expColWidths = {
    date: 30,
    reason: 105,
    amount: 30
  };
  
  xPos = leftMargin + 2;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date', xPos, yPos);
  xPos += expColWidths.date;
  pdf.text('Expance Resions', xPos, yPos);
  xPos += expColWidths.reason;
  pdf.text('Amount', xPos, yPos);
  yPos += 5;
  
  drawLine(yPos, 0.3);
  yPos += 4;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  if (expenses && expenses.length > 0) {
    expenses.forEach((expense) => {
      xPos = leftMargin + 2;
      const expDate = expense.date ? new Date(expense.date).toLocaleDateString('en-GB') : 'N/A';
      pdf.text(expDate, xPos, yPos);
      
      xPos += expColWidths.date;
      const reason = expense.description || expense.expenseType || 'N/A';
      pdf.text(reason.substring(0, 45), xPos, yPos);
      
      xPos += expColWidths.reason;
      pdf.text(String(expense.amount || 0), xPos, yPos);
      
      yPos += 5;
    });
  } else {
    xPos = leftMargin + 2;
    pdf.text('N/A', xPos, yPos);
    xPos += expColWidths.date;
    pdf.text('No expenses', xPos, yPos);
    xPos += expColWidths.reason;
    pdf.text('0', xPos, yPos);
    yPos += 5;
  }
  
  drawLine(yPos, 0.3);
  yPos += 5;
  
  // Total Expenses
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total', leftMargin + expColWidths.date + 2, yPos);
  pdf.text(String(totalExpenses), leftMargin + expColWidths.date + expColWidths.reason + 2, yPos);
  yPos += 7;

  // Transaction Details Section
  pdf.setFillColor(173, 216, 230);
  pdf.rect(leftMargin, yPos, contentWidth, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Transaction Details', pageWidth / 2, yPos + 5, { align: 'center' });
  yPos += 7;

  // Transaction Table Header
  drawLine(yPos);
  yPos += 5;
  pdf.setFontSize(10);
  
  const transColWidths = {
    srNo: 15,
    date: 28,
    method: 30,
    reference: 50,
    amount: 30
  };
  
  xPos = leftMargin + 2;
  pdf.text('Sr.No', xPos, yPos);
  xPos += transColWidths.srNo;
  pdf.text('Date', xPos, yPos);
  xPos += transColWidths.date;
  pdf.text('Method', xPos, yPos);
  xPos += transColWidths.method;
  pdf.text('Reference', xPos, yPos);
  xPos += transColWidths.reference;
  pdf.text('Amount', xPos, yPos);
  yPos += 5;
  
  drawLine(yPos, 0.3);
  yPos += 4;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  if (advances && advances.length > 0) {
    advances.forEach((advance, index) => {
      xPos = leftMargin + 2;
      pdf.text(String(index + 1) + '.', xPos, yPos);
      
      xPos += transColWidths.srNo;
      const advDate = advance.date ? new Date(advance.date).toLocaleDateString('en-GB') : 'N/A';
      pdf.text(advDate, xPos, yPos);
      
      xPos += transColWidths.date;
      const method = advance.paymentMethod || 'Cash';
      pdf.text(method.toUpperCase(), xPos, yPos);
      
      xPos += transColWidths.method;
      const reference = advance.description || 'N/A';
      pdf.text(reference.substring(0, 22), xPos, yPos);
      
      xPos += transColWidths.reference;
      pdf.text(String(advance.amount || 0), xPos, yPos);
      
      yPos += 5;
    });
  } else {
    xPos = leftMargin + 2;
    pdf.text('1.', xPos, yPos);
    xPos += transColWidths.srNo;
    pdf.text('N/A', xPos, yPos);
    xPos += transColWidths.date;
    pdf.text('N/A', xPos, yPos);
    xPos += transColWidths.method;
    pdf.text('No advances', xPos, yPos);
    xPos += transColWidths.reference;
    pdf.text('0', xPos, yPos);
    yPos += 5;
  }
  
  drawLine(yPos, 0.3);
  yPos += 5;
  
  // Total Paid
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total', leftMargin + transColWidths.srNo + transColWidths.date + transColWidths.method + transColWidths.reference + 2, yPos);
  pdf.text(String(totalAdvances), leftMargin + transColWidths.srNo + transColWidths.date + transColWidths.method + transColWidths.reference + 2, yPos);
  yPos += 10;

  // Final Summary
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Final Summary', leftMargin + 2, yPos);
  yPos += 7;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Simple list format matching the image
  const summaryItems = [
    { label: 'Total Fright / Expance', value: totalFleetOwnerPayment },
    { label: 'Expance', value: totalExpenses },
    { label: 'Commission', value: commission },
    { label: 'Blance POD', value: balancePOD },
    { label: 'Total Paid', value: totalAdvances }
  ];
  
  summaryItems.forEach(item => {
    pdf.text(item.label, leftMargin + 2, yPos);
    pdf.text(String(item.value), leftMargin + 80, yPos);
    yPos += 6;
  });
  
  // Final Amount with line above
  drawLine(yPos - 1, 0.5);
  yPos += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Final Amount', leftMargin + 2, yPos);
  pdf.text(String(finalAmount), leftMargin + 80, yPos);
  yPos += 10;

  // Authorized Signature
  pdf.setFont('helvetica', 'bold');
  pdf.text('Authorized Signature', rightMargin - 50, yPos);

  // Save PDF
  const fileName = `Receipt_${trip.tripNumber}_${fleetOwner?.fullName || 'FleetOwner'}.pdf`;
  pdf.save(fileName);
};

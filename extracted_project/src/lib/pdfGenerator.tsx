import jsPDF from 'jspdf';
import { Order } from '@/types';
import { mockStoreSettings } from '@/data/mockData';

export const generateInvoicePDF = (order: Order): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Helper functions
  const addText = (text: string, x: number, yPos: number, options?: { fontSize?: number; fontStyle?: string; color?: string }) => {
    doc.setFontSize(options?.fontSize || 12);
    if (options?.fontStyle) {
      doc.setFont('helvetica', options.fontStyle);
    }
    if (options?.color) {
      const hex = options.color;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      doc.setTextColor(r, g, b);
    }
    doc.text(text, x, yPos);
    doc.setTextColor(0, 0, 0);
  };

  // Header
  // Logo/Store Name
  doc.setFillColor(201, 60, 58); // Primary color
  doc.rect(0, 0, pageWidth, 40, 'F');

  addText(mockStoreSettings.name, margin, 25, { fontSize: 24, fontStyle: 'bold', color: '#ffffff' });

  // Contact Info (right side)
  const contactInfo = [
    mockStoreSettings.socialLinks.whatsapp,
    mockStoreSettings.socialLinks.facebook || '',
    ' Yemen'
  ].filter(Boolean);

  addText(contactInfo.join(' | '), pageWidth - margin, 25, { fontSize: 10, color: '#ffffff' });

  y = 55;

  // Invoice Title
  addText('INVOICE', margin, y, { fontSize: 20, fontStyle: 'bold' });

  // Invoice Number & Date (right side)
  addText(`Invoice #: ${order.orderNumber}`, pageWidth - margin - 80, y, { fontSize: 12 });
  addText(`Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin - 80, y + 7, { fontSize: 10 });

  y += 20;

  // Bill To Section
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  addText('BILL TO:', margin, y, { fontSize: 12, fontStyle: 'bold' });
  y += 8;

  addText(order.customerName, margin, y, { fontSize: 11 });
  y += 6;

  if (order.address) {
    addText(order.address, margin, y, { fontSize: 10, color: '#666666' });
    y += 6;
  }

  addText(`Phone: ${order.customerPhone}`, margin, y, { fontSize: 10, color: '#666666' });
  y += 6;

  addText(order.city, margin, y, { fontSize: 10, color: '#666666' });

  y += 20;

  // Items Table Header
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');

  addText('Item', margin + 3, y + 7, { fontSize: 10, fontStyle: 'bold' });
  addText('Details', margin + 50, y + 7, { fontSize: 10, fontStyle: 'bold' });
  addText('Qty', margin + 95, y + 7, { fontSize: 10, fontStyle: 'bold' });
  addText('Price', margin + 115, y + 7, { fontSize: 10, fontStyle: 'bold' });
  addText('Total', pageWidth - margin - 3, y + 7, { fontSize: 10, fontStyle: 'bold' });

  y += 12;

  // Items
  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;

    // Alternate row colors
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 10, 'F');
    }

    addText(item.productName.substring(0, 30), margin + 3, y, { fontSize: 9 });

    const details = [
      item.size && `Size: ${item.size}`,
      item.color && `Color: ${item.color}`
    ].filter(Boolean).join(' | ');
    addText(details, margin + 50, y, { fontSize: 8, color: '#666666' });

    addText(item.quantity.toString(), margin + 97, y, { fontSize: 9 });
    addText(`${item.price.toLocaleString()}`, margin + 115, y, { fontSize: 9 });
    addText(`${itemTotal.toLocaleString()}`, pageWidth - margin - 3, y, { fontSize: 9 });

    y += 10;
  });

  y += 10;

  // Totals Section
  doc.setDrawColor(200, 200, 200);
  doc.line(margin + 100, y, pageWidth - margin, y);
  y += 10;

  const labelX = pageWidth - margin - 50;
  const valueX = pageWidth - margin - 3;

  addText('Subtotal:', labelX, y, { fontSize: 11 });
  addText(`${order.subtotal.toLocaleString()} ${mockStoreSettings.currency}`, valueX, y, { fontSize: 11 });
  y += 8;

  addText('Shipping:', labelX, y, { fontSize: 11 });
  addText(`${order.shippingCost.toLocaleString()} ${mockStoreSettings.currency}`, valueX, y, { fontSize: 11 });
  y += 10;

  // Total
  doc.setFillColor(201, 60, 58);
  doc.rect(labelX - 5, y - 5, pageWidth - margin - labelX + 10, 12, 'F');
  addText('TOTAL:', labelX, y + 2, { fontSize: 12, fontStyle: 'bold', color: '#ffffff' });
  addText(`${order.total.toLocaleString()} ${mockStoreSettings.currency}`, valueX, y + 2, { fontSize: 12, fontStyle: 'bold', color: '#ffffff' });

  y += 25;

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  addText('Thank you for your order!', pageWidth / 2, y, { fontSize: 12, fontStyle: 'bold' });
  y += 8;

  addText('For any inquiries, please contact us via WhatsApp.', pageWidth / 2, y, { fontSize: 10, color: '#666666' });

  // Add page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addText(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, doc.internal.pageSize.getHeight() - 10, { fontSize: 8, color: '#999999' });
  }

  return doc;
};

export const downloadInvoice = (order: Order) => {
  const doc = generateInvoicePDF(order);
  doc.save(`Invoice_${order.orderNumber}.pdf`);
};

export const previewInvoice = (order: Order): string => {
  const doc = generateInvoicePDF(order);
  return doc.output('datauristring');
};

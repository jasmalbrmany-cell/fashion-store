import jsPDF from 'jspdf';
import { Order, StoreSettings } from '@/types';

export const generateInvoicePDF = (order: Order, settings: StoreSettings): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;
  const currency = settings.currency || 'YER';

  // Helper functions
  const addText = (text: string, x: number, yPos: number, options?: { fontSize?: number; fontStyle?: string; color?: string; align?: 'left' | 'center' | 'right' }) => {
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
    
    if (options?.align === 'right') {
        doc.text(text, x, yPos, { align: 'right' });
    } else if (options?.align === 'center') {
        doc.text(text, x, yPos, { align: 'center' });
    } else {
        doc.text(text, x, yPos);
    }
    
    doc.setTextColor(0, 0, 0);
  };

  // Header
  // Logo/Store Name
  doc.setFillColor(0, 0, 0); // Solid black header
  doc.rect(0, 0, pageWidth, 40, 'F');

  addText(settings.name, margin, 25, { fontSize: 24, fontStyle: 'bold', color: '#ffffff' });

  // Contact Info (right side)
  const contactInfo = [
    settings.socialLinks.whatsapp,
    'Yemen'
  ].filter(Boolean).join(' | ');

  addText(contactInfo, pageWidth - margin, 25, { fontSize: 10, color: '#ffffff', align: 'right' });

  y = 55;

  // Invoice Title
  addText('INVOICE', margin, y, { fontSize: 20, fontStyle: 'bold' });

  // Invoice Number & Date (right side)
  addText(`Invoice #: ${order.orderNumber}`, pageWidth - margin, y, { fontSize: 12, align: 'right' });
  addText(`Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin, y + 7, { fontSize: 10, align: 'right' });

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
  addText('Details', margin + 55, y + 7, { fontSize: 10, fontStyle: 'bold' });
  addText('Qty', margin + 100, y + 7, { fontSize: 10, fontStyle: 'bold' });
  addText('Price', margin + 115, y + 7, { fontSize: 10, fontStyle: 'bold' });
  addText('Total', pageWidth - margin - 3, y + 7, { fontSize: 10, fontStyle: 'bold', align: 'right' });

  y += 12;

  // Items
  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;

    // Alternate row colors
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 10, 'F');
    }

    addText(item.productName.substring(0, 40), margin + 3, y, { fontSize: 9 });

    const details = [
      item.size && `Size: ${item.size}`,
      item.color && `Color: ${item.color}`
    ].filter(Boolean).join(' | ');
    addText(details, margin + 55, y, { fontSize: 8, color: '#666666' });

    addText(item.quantity.toString(), margin + 101, y, { fontSize: 9 });
    addText(`${item.price.toLocaleString()}`, margin + 115, y, { fontSize: 9 });
    addText(`${itemTotal.toLocaleString()}`, pageWidth - margin - 3, y, { fontSize: 9, align: 'right' });

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
  addText(`${order.subtotal.toLocaleString()} ${currency}`, valueX, y, { fontSize: 11, align: 'right' });
  y += 8;

  addText('Shipping:', labelX, y, { fontSize: 11 });
  addText(`${order.shippingCost.toLocaleString()} ${currency}`, valueX, y, { fontSize: 11, align: 'right' });
  y += 10;

  // Total
  doc.setFillColor(0, 0, 0);
  doc.rect(labelX - 5, y - 5, pageWidth - margin - labelX + 10, 12, 'F');
  addText('TOTAL:', labelX, y + 2, { fontSize: 12, fontStyle: 'bold', color: '#ffffff' });
  addText(`${order.total.toLocaleString()} ${currency}`, valueX, y + 2, { fontSize: 12, fontStyle: 'bold', color: '#ffffff', align: 'right' });

  y += 25;

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  addText('Thank you for your order!', pageWidth / 2, y, { fontSize: 12, fontStyle: 'bold', align: 'center' });
  y += 8;

  addText('For any inquiries, please contact us via WhatsApp.', pageWidth / 2, y, { fontSize: 10, color: '#666666', align: 'center' });

  // Add page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addText(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { fontSize: 8, color: '#999999', align: 'right' });
  }

  return doc;
};

export const downloadInvoice = (order: Order, settings: StoreSettings) => {
  const doc = generateInvoicePDF(order, settings);
  doc.save(`Invoice_${order.orderNumber}.pdf`);
};

export const previewInvoice = (order: Order, settings: StoreSettings): string => {
  const doc = generateInvoicePDF(order, settings);
  return doc.output('datauristring');
};

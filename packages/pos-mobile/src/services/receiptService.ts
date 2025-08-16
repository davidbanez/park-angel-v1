import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { ReceiptData } from '../types/pos';

export class ReceiptService {
  private static instance: ReceiptService;

  static getInstance(): ReceiptService {
    if (!ReceiptService.instance) {
      ReceiptService.instance = new ReceiptService();
    }
    return ReceiptService.instance;
  }

  async printReceipt(receiptData: ReceiptData): Promise<void> {
    try {
      const html = this.generateReceiptHTML(receiptData);
      
      if (Platform.OS === 'ios') {
        await this.printOnIOS(html);
      } else {
        await this.printOnAndroid(html);
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw new Error('Failed to print receipt');
    }
  }

  async shareReceipt(receiptData: ReceiptData): Promise<void> {
    try {
      const html = this.generateReceiptHTML(receiptData);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receipt',
        });
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      throw new Error('Failed to share receipt');
    }
  }

  private async printOnIOS(html: string): Promise<void> {
    // iOS-specific printing with AirPrint support
    await Print.printAsync({
      html,
      printerUrl: undefined, // Use default printer selection
    });
  }

  private async printOnAndroid(html: string): Promise<void> {
    // Android-specific printing with system print service
    await Print.printAsync({
      html,
      printerUrl: undefined, // Use default printer selection
    });
  }

  private generateReceiptHTML(data: ReceiptData): string {
    const formatCurrency = (amount: number) => `₱${amount.toFixed(2)}`;
    const formatDate = (date: Date) => date.toLocaleString('en-PH');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Park Angel Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 20px;
              max-width: 300px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .receipt-info {
              margin-bottom: 15px;
            }
            .receipt-info div {
              margin-bottom: 3px;
            }
            .items {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
              margin: 15px 0;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .totals {
              margin-top: 15px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .total-line.final {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px dashed #000;
              font-size: 10px;
            }
            .bir-info {
              margin-top: 10px;
              font-size: 10px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">PARK ANGEL POS</div>
            <div>Parking Management System</div>
          </div>

          <div class="receipt-info">
            <div><strong>Receipt #:</strong> ${data.receiptNumber}</div>
            <div><strong>Date:</strong> ${formatDate(data.timestamp)}</div>
            <div><strong>Operator:</strong> ${data.operatorName}</div>
            <div><strong>Location:</strong> ${data.locationName}</div>
            ${data.customerInfo ? `
              <div><strong>Vehicle:</strong> ${data.customerInfo.plateNumber}</div>
              <div><strong>Type:</strong> ${data.customerInfo.vehicleType}</div>
            ` : ''}
          </div>

          <div class="items">
            ${data.items.map(item => `
              <div class="item">
                <span>${item.description} (${item.quantity}x)</span>
                <span>${formatCurrency(item.totalPrice)}</span>
              </div>
            `).join('')}
          </div>

          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>${formatCurrency(data.subtotal)}</span>
            </div>
            
            ${data.discounts.map(discount => `
              <div class="total-line">
                <span>${discount.name} (${discount.percentage}%):</span>
                <span>-${formatCurrency(discount.amount)}</span>
              </div>
            `).join('')}
            
            ${data.vatAmount > 0 ? `
              <div class="total-line">
                <span>VAT (12%):</span>
                <span>${formatCurrency(data.vatAmount)}</span>
              </div>
            ` : ''}
            
            <div class="total-line final">
              <span>TOTAL:</span>
              <span>${formatCurrency(data.totalAmount)}</span>
            </div>
            
            <div class="total-line">
              <span>Payment (${data.paymentMethod}):</span>
              <span>${formatCurrency(data.totalAmount + (data.changeAmount || 0))}</span>
            </div>
            
            ${data.changeAmount ? `
              <div class="total-line">
                <span>Change:</span>
                <span>${formatCurrency(data.changeAmount)}</span>
              </div>
            ` : ''}
          </div>

          <div class="bir-info">
            <div>BIR Accredited POS System</div>
            <div>This receipt is machine generated</div>
            <div>and requires no signature</div>
          </div>

          <div class="footer">
            <div>Thank you for using Park Angel!</div>
            <div>Keep this receipt for your records</div>
          </div>
        </body>
      </html>
    `;
  }
}
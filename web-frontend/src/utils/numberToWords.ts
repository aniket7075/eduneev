export function numberToWordsIndian(num: number): string {
  if (isNaN(num) || num < 0) return '';
  if (num === 0) return 'Zero Rupees Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      str += single[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += double[n - 10] + ' ';
    } else if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      if (n % 10 > 0) {
        str += single[n % 10] + ' ';
      }
    } else if (n > 0) {
      str += single[n] + ' ';
    }
    return str;
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let rupeesStr = '';
  let n = integerPart;

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  if (crore > 0) {
    rupeesStr += convertLessThanThousand(crore) + 'Crore ';
  }
  if (lakh > 0) {
    rupeesStr += convertLessThanThousand(lakh) + 'Lakh ';
  }
  if (thousand > 0) {
    rupeesStr += convertLessThanThousand(thousand) + 'Thousand ';
  }
  if (n > 0) {
    rupeesStr += convertLessThanThousand(n);
  }

  rupeesStr = rupeesStr.trim() ? `${rupeesStr.trim()} Rupees` : '';

  let paiseStr = '';
  if (decimalPart > 0) {
    paiseStr = ` and ${convertLessThanThousand(decimalPart).trim()} Paise`;
  }

  return `${rupeesStr}${paiseStr} Only`.trim();
}

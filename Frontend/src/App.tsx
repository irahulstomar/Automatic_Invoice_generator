import React, { useEffect, useState } from 'react';
import { Invoice, InvoiceData } from './Invoice';

export default function App() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Expecting ?data=eyJidXllcl9uYW1lIjoiQWxpY2Ui... (base64 encoded JSON)
      const params = new URLSearchParams(window.location.search);
      const dataParam = params.get('data');

      if (dataParam) {
        // Decode base64 to JSON string, then parse
        const decodedString = decodeURIComponent(escape(atob(dataParam)));
        const data = JSON.parse(decodedString) as InvoiceData;
        setInvoiceData(data);
      } else {
        setError("No invoice data provided in URL params.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to parse invoice data from URL.");
    }
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'red' }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        Loading invoice...
      </div>
    );
  }

  return <Invoice data={invoiceData} />;
}

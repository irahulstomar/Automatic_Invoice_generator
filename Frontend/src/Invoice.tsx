import React from 'react';
import '../styles.css';

export interface InvoiceData {
    buyer_name: string;
    buyer_address?: string;
    buyer_gst_number?: string;
    buyer_state_name?: string;
    place_of_supply?: string;
    product_name: string;
    duration?: string;
    service_fee_formatted: string;
    gst_rate: number;
    gst_amount_formatted: string;
    price_formatted: string;
    total_amount_formatted: string;
    invoice_date: string;
}

interface InvoiceProps {
    data: InvoiceData;
}

export const Invoice: React.FC<InvoiceProps> = ({ data }) => {
    return (
        <div className="invoice-container">
            <header className="invoice-header">
                <div className="seller-info">
                    <h1>INVOICE</h1>
                    <p>Your Company Name, City</p>
                    <p><a href="https://www.yourwebsite.com">www.yourwebsite.com</a></p>
                    <p>GSTIN/UIN: YOUR_GSTIN_HERE</p>
                    <p>State Name : Your State, Code : 00</p>
                    <p>CIN: YOUR_CIN_HERE</p>
                </div>
                <div className="logo-container">
                    {/* Add your logo: <img src="/your-logo.png" alt="Company Logo" className="invoice-logo" /> */}
                </div>
            </header>

            <section className="info-section">
                <div className="date-block">
                    <p>Date: {data.invoice_date}</p>
                </div>
                <div className="buyer-block">
                    <p className="buyer-label"><strong>Buyer (Bill to)</strong></p>
                    <p className="buyer-name"><strong>{data.buyer_name}</strong></p>

                    {data.buyer_address && (
                        <p className="buyer-address">{data.buyer_address}</p>
                    )}

                    {data.buyer_gst_number && (
                        <p className="buyer-gst"><strong>GSTIN/UIN :</strong> {data.buyer_gst_number}</p>
                    )}

                    {(data.buyer_state_name || data.place_of_supply) && (
                        <p className="buyer-state">
                            {data.buyer_state_name && (
                                <><strong>State Name :</strong> {data.buyer_state_name}<br /></>
                            )}
                            {data.place_of_supply && (
                                <><strong>Place of Supply:</strong> {data.place_of_supply}</>
                            )}
                        </p>
                    )}
                </div>
            </section>

            <section className="table-section">
                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th className="text-left col-product">PRODUCT</th>
                            <th className="text-right col-fee">Service fee</th>
                            <th className="text-right col-gst">GST({data.gst_rate}%)</th>
                            <th className="text-left col-duration">Duration</th>
                            <th className="text-right col-price">PRICE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="text-left">1. &nbsp;&nbsp; {data.product_name}</td>
                            <td className="text-right">{data.service_fee_formatted}</td>
                            <td className="text-right">{data.gst_amount_formatted}</td>
                            <td className="text-left">{data.duration}</td>
                            <td className="text-right">{data.price_formatted}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="total-wrapper">
                    <table className="total-table">
                        <tbody>
                            <tr>
                                <td className="total-label"><strong>Total Net Paid</strong></td>
                                <td className="total-amount"><strong>{data.total_amount_formatted}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="bank-details">
                <p>Bank Details:</p>
                <br />
                <p><strong>NAME:</strong> YOUR COMPANY NAME</p>
                <p><strong>BANK NAME:</strong> YOUR BANK NAME</p>
                <p><strong>A/C NO:</strong> YOUR_ACCOUNT_NUMBER</p>
                <p><strong>BRANCH:</strong> YOUR BRANCH <strong>IFSC CODE:</strong> YOUR_IFSC_CODE</p>
                <p><strong>CITY:</strong> YOUR CITY</p>
            </section>
        </div>
    );
};

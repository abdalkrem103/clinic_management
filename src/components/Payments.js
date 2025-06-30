import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPrint, faFileInvoiceDollar, faMoneyBillWave, faCreditCard, faUniversity } from '@fortawesome/free-solid-svg-icons';
import { paymentsAPI, patientsAPI, dentalChartAPI, servicesAPI } from '../api/api';
import '../styles/Payments.css';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [availableServices, setAvailableServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]); // [{service_id, name, price, quantity, dental_chart_id}]
    const [totalAmount, setTotalAmount] = useState(0);
    const [remainingAmount, setRemainingAmount] = useState(0);
    const [newPayment, setNewPayment] = useState({
        patient_id: '',
        payment_method: 'cash',
        paid_amount: '',
        notes: '',
        payment_status: 'paid',
        transaction_id: '',
        payment_gateway: '',
        payment_url: ''
    });
    const [generalServices, setGeneralServices] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [paymentsRes, patientsRes] = await Promise.all([
                paymentsAPI.getAll(),
                patientsAPI.getAll()
            ]);
            
            if (paymentsRes.data.success) setPayments(paymentsRes.data.data);
            if (patientsRes.data.success) setPatients(patientsRes.data.data);

        } catch (err) {
            setError('حدث خطأ أثناء جلب البيانات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!newPayment.patient_id) {
            setAvailableServices([]);
            setSelectedServices([]);
            setTotalAmount(0);
            return;
        }
        const fetchPatientDentalChart = async () => {
            setLoading(true);
            try {
                const [dentalChartRes, servicesRes] = await Promise.all([
                    dentalChartAPI.getByPatient(newPayment.patient_id),
                    servicesAPI.getAll()
                ]);
                if (dentalChartRes.data.success && servicesRes.data.success) {
                    // استخراج الخدمات من dental_chart
                    const patientServices = [];
                    dentalChartRes.data.data.forEach(entry => {
                        if (entry.service_id) {
                            const service = servicesRes.data.data.find(s => s.id === Number(entry.service_id));
                            if (service) {
                                patientServices.push({
                                    service_id: service.id,
                                    name: service.name,
                                    price: service.price,
                                    dental_chart_id: entry.id,
                                    quantity: 1,
                                    tooth_id: entry.tooth_id,
                                    note: entry.note
                                });
                            }
                        }
                    });
                    setAvailableServices(patientServices);
                } else {
                    setAvailableServices([]);
                }
            } catch (err) {
                setAvailableServices([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPatientDentalChart();
    }, [newPayment.patient_id]);

    useEffect(() => {
        const total = selectedServices.reduce((sum, s) => sum + (Number(s.price) * Number(s.quantity)), 0);
        setTotalAmount(total);
        // إذا تقسيط، احسب المتبقي
        if (newPayment.payment_method === 'installment') {
            setRemainingAmount(total - Number(newPayment.paid_amount || 0));
        } else {
            setRemainingAmount(0);
        }
    }, [selectedServices, newPayment.payment_method, newPayment.paid_amount]);

    useEffect(() => {
        // جلب الخدمات العامة عند فتح المودال
        if (showAddModal) {
            servicesAPI.getAll().then(res => {
                if (res.data.success) {
                    // اعتبر أن الخدمات العامة هي التي اسمها يحتوي على "تقويم" أو "تبييض" أو أضف شرطاً حسب الحاجة
                    setGeneralServices(res.data.data.filter(s => s.name.includes('تقويم') || s.name.includes('تبييض')));
                }
            });
        }
    }, [showAddModal]);

    const handleServiceToggle = (service) => {
        const exists = selectedServices.find(s => s.service_id === service.service_id && s.dental_chart_id === service.dental_chart_id);
        if (exists) {
            setSelectedServices(selectedServices.filter(s => !(s.service_id === service.service_id && s.dental_chart_id === service.dental_chart_id)));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    const handleQuantityChange = (service, quantity) => {
        setSelectedServices(selectedServices.map(s =>
            (s.service_id === service.service_id && s.dental_chart_id === service.dental_chart_id)
                ? { ...s, quantity: Number(quantity) }
                : s
        ));
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        if (selectedServices.length === 0) {
            setError('يجب اختيار خدمة واحدة على الأقل');
            return;
        }
        try {
            const paymentData = {
                ...newPayment,
                total_amount: totalAmount,
                remaining_amount: remainingAmount,
                payment_status: newPayment.payment_method === 'electronic' ? 'pending' : 'paid',
                services: selectedServices.map(s => ({
                    service_id: s.service_id,
                    service_name: s.name,
                    service_price: s.price,
                    quantity: s.quantity,
                    dental_chart_id: s.dental_chart_id // قد تكون null للخدمات العامة
                }))
            };
            const response = await paymentsAPI.create(paymentData);
            if (response.data.success) {
                setShowAddModal(false);
                setNewPayment({ patient_id: '', payment_method: 'cash', paid_amount: '', notes: '', payment_status: 'paid', transaction_id: '', payment_gateway: '', payment_url: '' });
                setSelectedServices([]);
                setTotalAmount(0);
                setRemainingAmount(0);
                fetchData();
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء إضافة الدفعة');
        }
    };

    const handlePrintReceipt = (payment) => {
        const receiptWindow = window.open('', '_blank');
        
        // تحضير قائمة الخدمات
        const servicesList = payment.services && payment.services.length > 0 
            ? payment.services.map(service => 
                `<tr><td>${service.service_name}</td><td>${service.quantity}</td><td>${service.service_price} ريال</td><td>${service.service_price * service.quantity} ريال</td></tr>`
            ).join('')
            : '<tr><td colspan="4">لا توجد خدمات</td></tr>';

        receiptWindow.document.write(`
            <html>
                <head>
                    <title>إيصال دفع</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            direction: rtl;
                            margin: 0;
                            padding: 20px;
                        }
                        .receipt { 
                            max-width: 500px; 
                            margin: 20px auto; 
                            padding: 20px; 
                            border: 1px solid #ddd;
                            border-radius: 8px;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 20px;
                            border-bottom: 2px solid #2563eb;
                            padding-bottom: 10px;
                        }
                        .details { 
                            margin-bottom: 20px; 
                        }
                        .services-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 15px 0;
                        }
                        .services-table th,
                        .services-table td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: center;
                        }
                        .services-table th {
                            background-color: #f3f4f6;
                            font-weight: bold;
                        }
                        .total-row {
                            font-weight: bold;
                            background-color: #f9fafb;
                        }
                        .footer { 
                            text-align: center; 
                            margin-top: 20px;
                            border-top: 1px solid #ddd;
                            padding-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="header">
                            <h2>إيصال دفع</h2>
                            <p>رقم الإيصال: ${payment.id}</p>
                            <p>التاريخ: ${new Date(payment.payment_date).toLocaleDateString('ar-SA')}</p>
                        </div>
                        <div class="details">
                            <p><strong>المريض:</strong> ${payment.patient_first_name} ${payment.patient_last_name}</p>
                            <p><strong>طريقة الدفع:</strong> ${payment.payment_method === 'cash' ? 'نقدي' : payment.payment_method === 'card' ? 'بطاقة' : payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' : payment.payment_method === 'installment' ? 'تقسيط' : 'إلكتروني'}</p>
                            <p><strong>المبلغ المدفوع:</strong> ${payment.paid_amount} ريال</p>
                            ${payment.remaining_amount > 0 ? `<p><strong>المتبقي:</strong> ${payment.remaining_amount} ريال</p>` : ''}
                            ${payment.notes ? `<p><strong>ملاحظات:</strong> ${payment.notes}</p>` : ''}
                        </div>
                        <div class="services-section">
                            <h3>الخدمات المقدمة:</h3>
                            <table class="services-table">
                                <thead>
                                    <tr>
                                        <th>الخدمة</th>
                                        <th>الكمية</th>
                                        <th>السعر</th>
                                        <th>الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${servicesList}
                                </tbody>
                            </table>
                        </div>
                        <div class="footer">
                            <p>شكراً لتعاملكم معنا</p>
                            <p>تم إنشاء هذا الإيصال تلقائياً</p>
                        </div>
                    </div>
                </body>
            </html>
        `);
        receiptWindow.document.close();
        receiptWindow.print();
    };

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'cash': return faMoneyBillWave;
            case 'card': return faCreditCard;
            case 'bank_transfer': return faUniversity;
            case 'electronic': return faFileInvoiceDollar;
            case 'installment': return faFileInvoiceDollar;
            default: return faFileInvoiceDollar;
        }
    };

    return (
        <div className="payments-container">
            <div className="payments-header">
                <h1>المدفوعات</h1>
                <button className="add-payment-btn" onClick={() => setShowAddModal(true)}>
                    <FontAwesomeIcon icon={faPlus} />
                    <span>إضافة دفعة</span>
                </button>
            </div>

            {loading && <div className="loading-state">جاري تحميل البيانات...</div>}
            {error && <div className="error-state">{error}</div>}

            {!loading && !error && (
                 <div className="payments-table-wrapper">
                    <table className="payments-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>المريض</th>
                                <th>الخدمات</th>
                                <th>المبلغ المدفوع</th>
                                <th>طريقة الدفع</th>
                                <th>التاريخ</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>{payment.id}</td>
                                    <td>{`${payment.patient_first_name} ${payment.patient_last_name}`}</td>
                                    <td>
                                        {payment.services && payment.services.length > 0 ? (
                                            <div className="payment-services">
                                                {payment.services.map((service, index) => (
                                                    <div key={index} className="service-badge">
                                                        {service.service_name} (×{service.quantity})
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="no-services">لا توجد خدمات</span>
                                        )}
                                    </td>
                                    <td>{payment.paid_amount} ريال</td>
                                    <td>
                                        <FontAwesomeIcon icon={getPaymentMethodIcon(payment.payment_method)} className="payment-method-icon" />
                                        {payment.payment_method === 'cash' ? 'نقدي' : payment.payment_method === 'card' ? 'بطاقة' : payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' : payment.payment_method === 'installment' ? 'تقسيط' : 'إلكتروني'}
                                    </td>
                                    <td>{new Date(payment.payment_date).toLocaleDateString('ar-SA')}</td>
                                    <td className="actions-cell">
                                        <button className="action-btn print-btn" onClick={() => handlePrintReceipt(payment)}>
                                            <FontAwesomeIcon icon={faPrint} />
                                            <span>طباعة</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>إضافة دفعة جديدة</h2>
                            <button className="modal-close-button" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleAddPayment} className="payment-form">
                                <div className="form-group">
                                    <label>المريض</label>
                                    <select value={newPayment.patient_id} onChange={(e) => setNewPayment({...newPayment, patient_id: e.target.value})} required>
                                        <option value="">اختر المريض</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>الخدمات المقدمة من خريطة الأسنان</label>
                                    {availableServices.length === 0 && <div className="info-message">لا توجد خدمات مقدمة لهذا المريض في خريطة الأسنان.</div>}
                                    {availableServices.length > 0 && (
                                        <div className="services-list">
                                            {availableServices.map(service => (
                                                <div key={service.service_id + '-' + service.dental_chart_id} className="service-item">
                                                    <div className="service-header">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!selectedServices.find(s => s.service_id === service.service_id && s.dental_chart_id === service.dental_chart_id)}
                                                            onChange={() => handleServiceToggle(service)}
                                                        />
                                                        <span className="service-name">{service.name}</span>
                                                        <span className="service-price">({service.price} ريال)</span>
                                                    </div>
                                                    <div className="service-details">
                                                        <span className="tooth-info">السن: {service.tooth_id}</span>
                                                        {service.note && <span className="note-info">الملاحظة: {service.note}</span>}
                                                    </div>
                                                    {selectedServices.find(s => s.service_id === service.service_id && s.dental_chart_id === service.dental_chart_id) && (
                                                        <div className="quantity-control">
                                                            <label>الكمية:</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={selectedServices.find(s => s.service_id === service.service_id && s.dental_chart_id === service.dental_chart_id)?.quantity || 1}
                                                                onChange={e => handleQuantityChange(service, e.target.value)}
                                                                className="service-quantity-input"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>خدمات عامة (غير مرتبطة بسن معين)</label>
                                    {generalServices.length === 0 && <div className="info-message">لا توجد خدمات عامة متاحة.</div>}
                                    {generalServices.length > 0 && (
                                        <div className="services-list">
                                            {generalServices.map(service => (
                                                <div key={service.id} className="service-item">
                                                    <div className="service-header">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!selectedServices.find(s => s.service_id === service.id && !s.dental_chart_id)}
                                                            onChange={() => handleServiceToggle({
                                                                service_id: service.id,
                                                                name: service.name,
                                                                price: service.price,
                                                                quantity: 1,
                                                                dental_chart_id: null // خدمة عامة
                                                            })}
                                                        />
                                                        <span className="service-name">{service.name}</span>
                                                        <span className="service-price">({service.price} ريال)</span>
                                                    </div>
                                                    {selectedServices.find(s => s.service_id === service.id && !s.dental_chart_id) && (
                                                        <div className="quantity-control">
                                                            <label>الكمية:</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={selectedServices.find(s => s.service_id === service.id && !s.dental_chart_id)?.quantity || 1}
                                                                onChange={e => handleQuantityChange({
                                                                    service_id: service.id,
                                                                    name: service.name,
                                                                    price: service.price,
                                                                    dental_chart_id: null
                                                                }, e.target.value)}
                                                                className="service-quantity-input"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>الإجمالي</label>
                                    <input type="number" value={totalAmount} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>طريقة الدفع</label>
                                    <select value={newPayment.payment_method} onChange={e => setNewPayment({...newPayment, payment_method: e.target.value})}>
                                        <option value="cash">نقدي</option>
                                        <option value="installment">تقسيط</option>
                                        <option value="electronic">إلكتروني</option>
                                        <option value="card">بطاقة</option>
                                        <option value="bank_transfer">تحويل بنكي</option>
                                    </select>
                                </div>
                                {newPayment.payment_method === 'installment' && (
                                    <div className="form-group">
                                        <label>الدفعة الأولى</label>
                                        <input type="number" value={newPayment.paid_amount} onChange={e => setNewPayment({...newPayment, paid_amount: e.target.value})} required />
                                        <div className="info-message">المتبقي: {remainingAmount} ريال</div>
                                    </div>
                                )}
                                {newPayment.payment_method !== 'installment' && (
                                    <div className="form-group">
                                        <label>المبلغ المدفوع</label>
                                        <input type="number" value={newPayment.paid_amount} onChange={e => setNewPayment({...newPayment, paid_amount: e.target.value})} required />
                                    </div>
                                )}
                                {newPayment.payment_method === 'electronic' && (
                                    <div className="form-group">
                                        <label>حالة الدفع الإلكتروني</label>
                                        <select value={newPayment.payment_status} onChange={e => setNewPayment({...newPayment, payment_status: e.target.value})}>
                                            <option value="pending">بانتظار الدفع</option>
                                            <option value="paid">تم الدفع</option>
                                            <option value="failed">فشل الدفع</option>
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>ملاحظات</label>
                                    <textarea rows="3" value={newPayment.notes} onChange={e => setNewPayment({...newPayment, notes: e.target.value})}></textarea>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                                    <button type="submit" className="btn-primary">حفظ</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments; 
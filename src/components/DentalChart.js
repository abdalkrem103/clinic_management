import React, {useState, useEffect} from 'react';
import '../styles/DentalChart.css';
import {dentalChartAPI, servicesAPI} from '../api/api';

const upperTeethNumbers = [18,
  17,
  16,
  15,
  14,
  13,
  12,
  11,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28];
const lowerTeethNumbers = [48,
  47,
  46,
  45,
  44,
  43,
  42,
  41,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38];

// أسماء الأسنان العالمية (FDI) بالعربية
const toothNames = {
  18: 'ضرس العقل العلوي الأيمن',
  17: 'الضرس الثاني العلوي الأيمن',
  16: 'الضرس الأول العلوي الأيمن',
  15: 'الضاحك الثاني العلوي الأيمن',
  14: 'الضاحك الأول العلوي الأيمن',
  13: 'الناب العلوي الأيمن',
  12: 'القاطع الجانبي العلوي الأيمن',
  11: 'القاطع المركزي العلوي الأيمن',
  21: 'القاطع المركزي العلوي الأيسر',
  22: 'القاطع الجانبي العلوي الأيسر',
  23: 'الناب العلوي الأيسر',
  24: 'الضاحك الأول العلوي الأيسر',
  25: 'الضاحك الثاني العلوي الأيسر',
  26: 'الضرس الأول العلوي الأيسر',
  27: 'الضرس الثاني العلوي الأيسر',
  28: 'ضرس العقل العلوي الأيسر',
  48: 'ضرس العقل السفلي الأيمن',
  47: 'الضرس الثاني السفلي الأيمن',
  46: 'الضرس الأول السفلي الأيمن',
  45: 'الضاحك الثاني السفلي الأيمن',
  44: 'الضاحك الأول السفلي الأيمن',
  43: 'الناب السفلي الأيمن',
  42: 'القاطع الجانبي السفلي الأيمن',
  41: 'القاطع المركزي السفلي الأيمن',
  31: 'القاطع المركزي السفلي الأيسر',
  32: 'القاطع الجانبي السفلي الأيسر',
  33: 'الناب السفلي الأيسر',
  34: 'الضاحك الأول السفلي الأيسر',
  35: 'الضاحك الثاني السفلي الأيسر',
  36: 'الضرس الأول السفلي الأيسر',
  37: 'الضرس الثاني السفلي الأيسر',
  38: 'ضرس العقل السفلي الأيسر'
};

// أنواع الحالات الممكنة
const statusOptions = [
  {value: '',
    label: 'بدون حالة',
    color: '',
    icon: ''},
  {value: 'filling',
    label: 'حشوة',
    color: '#00b894',
    icon: '●'},
  {value: 'extraction',
    label: 'خلع',
    color: '#e17055',
    icon: '✖'},
  {value: 'crown',
    label: 'تاج',
    color: '#6c5ce7',
    icon: '⬒'},
  {value: 'root_canal',
    label: 'علاج عصب',
    color: '#0984e3',
    icon: '▮'},
  {value: 'implant',
    label: 'زرعة',
    color: '#fdcb6e',
    icon: '▲'},
  {value: 'missing',
    label: 'مفقود',
    color: '#b2bec3',
    icon: '∅'}
];

const DentalChart = ({patientId, onToothSelect, initialData = null}) => {
  const [selectedTeeth,
    setSelectedTeeth] = useState(initialData || {});
  const [currentNote,
    setCurrentNote] = useState('');
  const [selectedTooth,
    setSelectedTooth] = useState(null);
  const [currentStatus,
    setCurrentStatus] = useState('');
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');

  // جلب الملاحظات من قاعدة البيانات عند تحميل المكون
  useEffect(() => {
    if (!patientId) return;
    dentalChartAPI.getByPatient(patientId)
      .then(res => {
        const result = res.data;
        if (result.success && Array.isArray(result.data)) {
          const notes = {};
          result.data.forEach(item => {
            notes[item.tooth_id] = {
              note: item.note,
              date: item.created_at,
              status: item.status || ''
            };
          });
          setSelectedTeeth(notes);
        }
      });
  }, [patientId]);

  useEffect(() => {
    servicesAPI.getAll().then(res => {
      if (res.data.success) setServices(res.data.data);
    });
  }, []);

  const handleToothClick = (toothId) => {
    setSelectedTooth(toothId);
    if (onToothSelect) {
      onToothSelect(toothId);
    }
    setCurrentNote(selectedTeeth[toothId]?.note || '');
    setCurrentStatus(selectedTeeth[toothId]?.status || '');
    setSelectedService(selectedTeeth[toothId]?.service_id || '');
  };

  // حفظ الملاحظة والحالة في قاعدة البيانات
  const handleNoteSubmit = () => {
    if (selectedTooth && (currentNote || currentStatus || selectedService)) {
      dentalChartAPI.addOrUpdate({
        patient_id: patientId,
        tooth_id: selectedTooth,
        note: currentNote,
        status: currentStatus,
        service_id: selectedService
      }).then(() => {
        setSelectedTeeth(prev => ({
          ...prev,
          [selectedTooth]: {
            note: currentNote,
            date: new Date().toISOString(),
            status: currentStatus,
            service_id: selectedService
          }
        }));
        setCurrentNote('');
        setCurrentStatus('');
        setSelectedService('');
      });
    }
  };

  // رسم سن مفرد
  const renderTooth = (toothId, row) => {
    const toothData = selectedTeeth[toothId] || {};
    const isSelected = selectedTooth === toothId;
    const statusObj = statusOptions.find(opt => opt.value === toothData.status) || statusOptions[0];
    return (
      <div
        className={`tooth-grid ${isSelected ? 'selected' : ''} ${toothData.note ? 'has-note' : ''}`}
        key={toothId}
        onClick={() => handleToothClick(toothId)}
        style={statusObj.color ? {borderColor: statusObj.color,
          background: `${statusObj.color}22`} : {}}
        title={toothNames[toothId]}
      >
        <span className="tooth-number">{toothId}</span>
        {statusObj.icon && <span className="tooth-status-icon" style={{color: statusObj.color}}>{statusObj.icon}</span>}
        {toothData.note && <span className="note-indicator">📝</span>}
      </div>
    );
  };

  return (
    <div className="dental-chart-grid">
      {/* الأسنان العلوية */}
      <div className="teeth-row upper-row">
        {upperTeethNumbers.map(num => renderTooth(num, 'upper'))}
      </div>
      {/* الأسنان السفلية */}
      <div className="teeth-row lower-row">
        {lowerTeethNumbers.map(num => renderTooth(num, 'lower'))}
      </div>

      {/* منطقة الملاحظات والحالة */}
      {selectedTooth && (
        <div className="tooth-details-grid">
          <h3>السن رقم {selectedTooth} <span className="tooth-fdi-label">({toothNames[selectedTooth]})</span></h3>
          <div className="note-section">
            <label htmlFor="status">نوع الحالة:</label>
            <select
              id="status"
              onChange={e => setCurrentStatus(e.target.value)}
              value={currentStatus}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label htmlFor="service">الخدمة:</label>
            <select
              id="service"
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
            >
              <option value="">اختر الخدمة</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <textarea
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="أضف ملاحظة عن حالة السن..."
              value={currentNote}
            />
            <button onClick={handleNoteSubmit}>حفظ</button>
          </div>
          {(selectedTeeth[selectedTooth]?.note || selectedTeeth[selectedTooth]?.status || selectedTeeth[selectedTooth]?.service_id) && (
            <div className="existing-note">
              <h4>الحالة الحالية:</h4>
              {selectedTeeth[selectedTooth]?.status && (
                <div>
                  <b>النوع:</b> {statusOptions.find(opt => opt.value === selectedTeeth[selectedTooth].status)?.label || 'بدون'}
                </div>
              )}
              {selectedTeeth[selectedTooth]?.service_id && (
                <div>
                  <b>الخدمة:</b> {services.find(s => s.id === Number(selectedTeeth[selectedTooth].service_id))?.name || 'غير محددة'}
                </div>
              )}
              {selectedTeeth[selectedTooth]?.note && <p>{selectedTeeth[selectedTooth].note}</p>}
              <small>{selectedTeeth[selectedTooth]?.date ? new Date(selectedTeeth[selectedTooth].date).toLocaleDateString('ar-SA') : ''}</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DentalChart;

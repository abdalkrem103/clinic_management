import React, { useState, useEffect } from 'react';
// تم إزالة useParams و useLocation
// import { useParams, useLocation } from 'react-router-dom';
import { xraysAPI } from '../api/api';
import '../styles/XRayAnalysis.css';

// المكون الآن يستقبل patientId كخاصية (prop)
const XRayAnalysis = ({ patientId }) => {
  // تم إزالة الحصول على معرف المريض من useParams أو useLocation
  // const { patientId } = useParams();
  // const location = useLocation();
  const [xrays, setXrays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedXray, setSelectedXray] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // تم إزالة دالة getPatientId
  // const getPatientId = () => { ... };

  useEffect(() => {
    // استخدام patientId الذي تم تمريره كخاصية
    if (!patientId) {
      setError('معرف المريض غير متوفر');
      setLoading(false);
      return;
    }
    // تمرير patientId مباشرة إلى fetchXrays
    fetchXrays(patientId);
  }, [patientId]); // الاعتماد فقط على patientId الخاصية

  const fetchXrays = async (id) => {
    try {
      setLoading(true);
      setError('');
      const response = await xraysAPI.getAll({ patient_id: id });
      if (response.data.success) {
        setXrays(response.data.data || []);
        // Removed initialization of analysisData state
        // const initialAnalysisData = {};
        // (response.data.data || []).forEach(xray => {
        //   initialAnalysisData[xray.id] = {
        //     analysis_result: xray.analysis_result || '',
        //     description: xray.description || '',
        //     isEditing: false // Add editing state for each xray
        //   };
        // });
        // setAnalysisData(initialAnalysisData);
      } else {
        setError(response.data.message || 'حدث خطأ في تحميل الأشعة');
      }
    } catch (error) {
      console.error('Error fetching xrays:', error);
      setError(error.response?.data?.message || 'حدث خطأ في تحميل الأشعة');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // التحقق من نوع الملف
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('نوع الملف غير مدعوم. يرجى اختيار صورة أو ملف PDF');
        return;
      }
      
      // التحقق من حجم الملف (10MB كحد أقصى)
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم الملف كبير جداً. الحد الأقصى هو 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    const id = patientId;
    if (!id) {
      alert('معرف المريض غير متوفر');
      return;
    }

    if (!selectedFile) {
      alert('الرجاء اختيار ملف');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('xray_file', selectedFile);
      formData.append('patient_id', id);

      console.log('Uploading file:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      });
      console.log('Patient ID:', id);

      const response = await xraysAPI.upload(formData);
      console.log('Upload response:', response);

      if (response.data.success) {
        await fetchXrays(id);
        setSelectedFile(null);
        alert('تم رفع الأشعة بنجاح');
      } else {
        alert(response.data.message || 'فشل في رفع الأشعة');
      }
    } catch (error) {
      console.error('Error uploading xray:', error);
      console.error('Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      alert(error.response?.data?.message || 'حدث خطأ أثناء رفع الأشعة');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (xrayId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الأشعة؟')) return;

    try {
      const response = await xraysAPI.delete(xrayId);
      if (response.data.success) {
        // تمرير patientId مباشرة إلى fetchXrays
        await fetchXrays(patientId);
        alert('تم حذف الأشعة بنجاح');
      } else {
        alert(response.data.message || 'فشل في حذف الأشعة');
      }
    } catch (error) {
      console.error('Error deleting xray:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء حذف الأشعة');
    }
  };

  const getImageUrl = (xray) => {
  return `http://localhost/clinic_management/api/get_xray.php?id=${xray.id}`;
};

  const handleAnalyzeXray = async (xray) => {
    if (analyzing) return;

    try {
      setAnalyzing(true);
      setSelectedXray(xray);
      setAnalysisResult(null);
      
      const response = await xraysAPI.analyze(xray.id);
      if (response.data.success) {
        setAnalysisResult(response.data.analysis_result.analysis_result);
        await fetchXrays(patientId);
      } else {
        alert(response.data.message || 'فشل في تحليل الأشعة');
      }
    } catch (error) {
      console.error('Error analyzing xray:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء تحليل الأشعة');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderXrayImage = (xray) => {
    if (xray.image_data.endsWith('.pdf')) {
      return (
        <iframe
          src={getImageUrl(xray)}
          title={`X-Ray ${xray.id}`}
          width="100%"
          height="300"
        />
      );
    }
    return (
      <img
        src={getImageUrl(xray)}
        alt={`X-Ray ${xray.id}`}
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/placeholder-xray.png';
        }}
      />
    );
  };

  const severityColors = {
    'منخفض': 'green',
    'متوسط': 'yellow',
    'مرتفع': 'orange',
    'مرتفع جداً': 'red'
  };

  const renderAnalysisResults = (analysis) => {
    if (!analysis) return null;
    const findings = analysis.primary_findings || {};
    const severity = findings.severity_assessment || analysis.severity_assessment || '';
    
    // Determine if specific recommendations should be shown
    const showSpecificRecommendations = findings.status !== 'طبيعي' || findings.confidence < 100;

    return (
      <div className="analysis-results-card">
        <div className="analysis-header">
          <h4>نتائج التحليل</h4>
          <span className="severity-badge" style={{backgroundColor: severityColors[severity] || '#888'}}>
            {severity}
          </span>
        </div>
          <div className="primary-findings">
          <p><strong>التشخيص:</strong> {findings.status}</p>
          <p><strong>نسبة الثقة:</strong> {findings.confidence}%</p>
          </div>
            {showSpecificRecommendations ? (
            <div className="recommendations">
              <h5>التوصيات</h5>
            {analysis.recommendations?.immediate_actions?.length > 0 && (
                <div className="recommendation-section">
                  <h6>إجراءات فورية</h6>
                  <ul>
                  {analysis.recommendations.immediate_actions.map((action, i) => <li key={i}>{action}</li>)}
                  </ul>
                </div>
              )}
            {analysis.recommendations?.follow_up?.length > 0 && (
                <div className="recommendation-section">
                  <h6>المتابعة</h6>
                  <ul>
                  {analysis.recommendations.follow_up.map((action, i) => <li key={i}>{action}</li>)}
                  </ul>
                </div>
              )}
            {analysis.recommendations?.prevention?.length > 0 && (
                <div className="recommendation-section">
                  <h6>الوقاية</h6>
                  <ul>
                  {analysis.recommendations.prevention.map((action, i) => <li key={i}>{action}</li>)}
                  </ul>
                </div>
              )}
            </div>
            ) : (
              <div className="recommendations">
                <h5>التوصيات</h5>
                <p>لا توجد توصيات محددة بناءً على هذا التحليل.</p>
            </div>
          )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="xray-analysis-container">
      <h2>تحليل الأشعة</h2>
      
      <div className="upload-section">
        <div className="file-input-container">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="file-input"
            id="xray-upload"
          />
          <label htmlFor="xray-upload" className="file-input-label">
            {selectedFile ? selectedFile.name : 'اختر ملف الأشعة'}
          </label>
        </div>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className={`upload-btn ${uploading ? 'uploading' : ''}`}
        >
          {uploading ? 'جاري الرفع...' : 'رفع الأشعة'}
        </button>
      </div>

      <div className="xrays-grid">
        {xrays.length > 0 ? (
          xrays.map((xray) => (
            <div key={xray.id} className="xray-card">
              <div className="xray-image">
                {renderXrayImage(xray)}
              </div>
              <div className="xray-info">
                <p className="xray-date">
                  {new Date(xray.created_at).toLocaleDateString('ar-SA')}
                </p>
                {xray.notes && <p className="xray-notes">{xray.notes}</p>}

                {selectedXray?.id === xray.id && analysisResult ? (
                  analyzing ? (
                    <div className="analyzing-spinner">جاري التحليل...</div>
                  ) : (
                  renderAnalysisResults(analysisResult)
                  )
                ) : (
                  !xray.analysis_result && (
                    <button 
                      onClick={() => handleAnalyzeXray(xray)} 
                      className={`analyze-btn ${analyzing && selectedXray?.id === xray.id ? 'analyzing' : ''}`}
                      disabled={analyzing && selectedXray?.id === xray.id}
                    >
                      {analyzing && selectedXray?.id === xray.id ? 'جاري التحليل...' : (xray.analysis_result ? 'إعادة التحليل' : 'تحليل الأشعة')}
                    </button>
                  )
                  )}

                <div className="xray-actions">
                  <button
                    onClick={() => handleDelete(xray.id)}
                    className="delete-btn"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-xrays">
            <p>لا توجد أشعة مسجلة</p>
            <p>قم برفع أشعة جديدة للبدء</p>
          </div>
        )}
      </div>

      {analysisResult && (
        <div className="analysis-result">
            <h3>نتائج التحليل</h3>
            <div className="result-details">
                {analysisResult.primary_findings.yolo_detections && analysisResult.primary_findings.yolo_detections.length > 0 ? (
                    <div className="detections-list">
                        {analysisResult.primary_findings.yolo_detections.map((detection, index) => (
                            <div key={index} className="detection-item">
                                <span className="condition">{detection.class_name}</span>
                                <span className="confidence">{detection.confidence}%</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-findings">لا توجد نتائج تحليل متاحة</p>
                )}
            </div>
            <div className="severity">
                <span className={`severity-badge ${analysisResult.primary_findings.severity_assessment.toLowerCase()}`}>
                    {analysisResult.primary_findings.severity_assessment}
                </span>
            </div>
        </div>
      )}
    </div>
  );
};

export default XRayAnalysis; 
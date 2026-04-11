import { useTranslation } from 'react-i18next';
import { recommendationApi } from '../api';

const Today = () => {
  const { t } = useTranslation();
  const [loadingRec, setLoadingRec] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const getRecommendation = async () => {
    setLoadingRec(true);
    setErrorMsg("");
    setRecommendation(null);
    try {
      const res = await recommendationApi.generate();
      setRecommendation(res.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setErrorMsg(t('rec.errorSpotify'));
      } else {
        setErrorMsg(err.response?.data?.error || t('common.error'));
      }
      console.error(err);
    } finally {
      setLoadingRec(false);
    }
  };

  return (
    <div className="view-container">
      <h2 className="section-title">{t('detail.todayRec')}</h2>
      
      <div className="recommendation-hero">
        <p className="hero-text">{t('detail.todayDesc')}</p>
        <button 
          onClick={getRecommendation} 
          className="rec-button"
          disabled={loadingRec}
        >
          {loadingRec ? t('profile.syncing') : t('detail.discoverMovie')}
        </button>
      </div>

      {errorMsg && <p className="error-text">{errorMsg}</p>}

      {recommendation && (
        <div className="recommendation-result">
          <div className="result-header">
             <span className="vibra-badge">{t('rec.vibe')}: {recommendation.vibra}</span>
          </div>
          <div className="result-content">
            {recommendation.poster_url && (
              <img src={recommendation.poster_url} alt={recommendation.pelicula} className="result-poster" />
            )}
            <div className="result-info">
              <h3 className="result-title">{recommendation.pelicula}</h3>
              <p className="result-synopsis">{recommendation.sinopsis}</p>
              <div className="result-reason">
                <h4>{t('rec.whyDesc')}</h4>
                <p>{recommendation.motivo}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Today;

import './ImagePanel.scss';

export const ImagePanel = () => {
  // Placeholder image - replace with actual POI image
  const poiImageUrl = '/images/placeholder-poi.jpg';

  return (
    <div className="imagePanel">
      <div className="panelHeader">
        <h3>Location View</h3>
      </div>

      <div className="imageContainer">
        <div className="poiImage">
          <img src={poiImageUrl} alt="Point of Interest" />
          {/* Градиент теперь не нужен так сильно, если текст вынесен, но можно оставить для стиля */}
          <div className="vignette" />
        </div>

        {/* POI Info теперь выглядит как часть интерфейса панели */}
        <div className="poiInfo">
          <span className="locationLabel">Current Location</span>
          <h4 className="locationName">Abandoned Outpost</h4>
          <p className="locationDescription">A mysterious and intriguing place</p>
        </div>
      </div>
    </div>
  );
};

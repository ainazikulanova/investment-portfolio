import { useState } from "react";
import PortfolioForm from "./portfolio-form";
import PortfolioTable from "./portfolio-table";
import PortfolioSummary from "./portfolio-summary";

function Portfolio() {
  const [assets, setAssets] = useState([]);

  const handleAddAsset = (newAsset) => {
    setAssets([...assets, newAsset]);
  };

  const handleDeleteAsset = (id) => {
    setAssets(assets.filter((asset) => asset.id !== id));
  };

  const calculatePortfolioReturn = () => {
    if (assets.length === 0) return 0;
    const totalReturn = assets.reduce((sum, asset) => {
      const assetReturn =
        ((asset.currentPrice - asset.buyPrice) / asset.buyPrice) * 100;
      return sum + assetReturn;
    }, 0);
    return (totalReturn / assets.length).toFixed(2);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Управление портфелем
      </h1>
      <PortfolioForm onAddAsset={handleAddAsset} />
      {assets.length > 0 && (
        <>
          <div className="mb-4 text-center">
            <p className="text-lg">
              Общая доходность портфеля:{" "}
              <span className="font-bold">{calculatePortfolioReturn()}%</span>
            </p>
          </div>
          <PortfolioSummary assets={assets} />
          <PortfolioTable assets={assets} onDeleteAsset={handleDeleteAsset} />
        </>
      )}
    </div>
  );
}

export default Portfolio;

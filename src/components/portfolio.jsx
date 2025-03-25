import { useState } from "react";
import PortfolioForm from "./portfolio-form";
import PortfolioTable from "./portfolio-table";

function Portfolio() {
  const [assets, setAssets] = useState([]);

  const handleAddAsset = (newAsset) => {
    setAssets([...assets, newAsset]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Мой инвестиционный портфель
      </h1>
      <PortfolioForm onAddAsset={handleAddAsset} />
      {assets.length > 0 && <PortfolioTable assets={assets} />}
    </div>
  );
}

export default Portfolio;

import { usePortfolio } from "../context/portfolio-context";
import PortfolioForm from "./portfolio-form";
import PortfolioTable from "./portfolio-table";
import PortfolioSummary from "./portfolio-summary";

function Portfolio() {
  const { assets, deleteAsset, optimizationResult } = usePortfolio();

  const calculatePortfolioReturn = () => {
    if (assets.length === 0) return 0;
    const totalReturn = assets.reduce((sum, asset) => {
      const assetReturn =
        ((asset.current_price - asset.buy_price) / asset.buy_price) * 100;
      return sum + assetReturn;
    }, 0);
    return (totalReturn / assets.length).toFixed(2);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Управление портфелем
      </h1>
      <PortfolioForm />
      {assets.length > 0 ? (
        <>
          <div className="mb-4 text-center">
            <p className="text-lg">
              Общая доходность портфеля:{" "}
              <span className="font-bold">{calculatePortfolioReturn()}%</span>
            </p>
          </div>
          <PortfolioSummary
            assets={assets}
            optimizationResult={optimizationResult}
          />
          <PortfolioTable assets={assets} onDeleteAsset={deleteAsset} />
        </>
      ) : (
        <p className="text-center text-gray-500">Нет активов</p>
      )}
    </div>
  );
}

export default Portfolio;

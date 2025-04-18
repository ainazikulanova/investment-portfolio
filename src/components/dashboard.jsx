import { usePortfolio } from "../context/portfolio-context";
import { Link } from "react-router-dom";

function Dashboard() {
  const { assets, optimizationResult } = usePortfolio();

  const portfolioValue = assets.reduce(
    (sum, asset) => sum + asset.current_price * asset.quantity,
    0
  );

  const portfolioReturn =
    assets.length > 0
      ? assets.reduce((sum, asset) => {
          const assetReturn =
            ((asset.current_price - asset.buy_price) / asset.buy_price) * 100;
          return sum + assetReturn;
        }, 0) / assets.length
      : 0;

  const portfolioRisk = optimizationResult ? optimizationResult.risk : 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Обзор портфеля</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Стоимость</h2>
          <p className="text-2xl">₽{portfolioValue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Доходность</h2>
          <p className="text-2xl">{portfolioReturn.toFixed(2)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Риск</h2>
          <p className="text-2xl">{portfolioRisk.toFixed(2)}%</p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">
          График изменения стоимости
        </h2>
        <p className="text-center text-gray-500">
          [График будет добавлен позже]
        </p>
      </div>
      <div className="flex justify-center space-x-4">
        <Link to="/portfolio">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Добавить актив
          </button>
        </Link>
        <Link to="/analysis">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Анализ
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function PortfolioAnalysis() {
  // Пример данных
  const assets = [
    { name: "SBER", currentPrice: 300, quantity: 10 },
    { name: "GAZP", currentPrice: 150, quantity: 20 },
  ];

  const totalValue = assets.reduce(
    (sum, asset) => sum + asset.currentPrice * asset.quantity,
    0
  );
  const pieData = {
    labels: assets.map((asset) => asset.name),
    datasets: [
      {
        data: assets.map(
          (asset) => ((asset.currentPrice * asset.quantity) / totalValue) * 100
        ),
        backgroundColor: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Анализ портфеля</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Распределение активов</h2>
          <div className="max-w-xs mx-auto">
            <Pie data={pieData} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Метрики</h2>
          <p>Доходность: [Будет рассчитано]</p>
          <p>Коэффициент Шарпа: [Будет рассчитано]</p>
          <p>Риск: [Будет рассчитано]</p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <h2 className="text-lg font-semibold mb-4">Эффективная граница</h2>
        <p className="text-center text-gray-500">[График будет добавлен]</p>
      </div>
    </div>
  );
}

export default PortfolioAnalysis;

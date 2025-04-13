import React from "react";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  Title,
} from "chart.js";
import { usePortfolio } from "../context/portfolio-context";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  Title
);

function PortfolioAnalysis() {
  const { assets, optimizationResult } = usePortfolio();

  const totalValue = assets.reduce(
    (sum, asset) => sum + asset.current_price * asset.quantity,
    0
  );
  const pieData = {
    labels: assets.map((asset) => asset.name),
    datasets: [
      {
        data: assets.map(
          (asset) => ((asset.current_price * asset.quantity) / totalValue) * 100
        ),
        backgroundColor: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"],
        borderWidth: 1,
      },
    ],
  };

  const frontierData = optimizationResult
    ? {
        datasets: [
          {
            label: "Эффективная граница",
            data: optimizationResult.frontier.map((f) => ({
              x: f.risk,
              y: f.return,
            })),
            borderColor: "#36A2EB",
            fill: false,
          },
          {
            label: "Ваш портфель",
            data: [
              { x: optimizationResult.risk, y: optimizationResult.return },
            ],
            backgroundColor: "#FF6384",
            pointRadius: 8,
          },
        ],
      }
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Анализ портфеля</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Распределение активов</h2>
          {totalValue > 0 ? (
            <div className="max-w-xs mx-auto">
              <Pie data={pieData} />
            </div>
          ) : (
            <p className="text-center text-gray-500">
              Нет данных для отображения
            </p>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Метрики</h2>
          {optimizationResult ? (
            <>
              <p>Доходность: {optimizationResult.return.toFixed(2)}%</p>
              <p>
                Коэффициент Шарпа:{" "}
                {optimizationResult.sharpe
                  ? optimizationResult.sharpe.toFixed(2)
                  : "Н/Д"}
              </p>
              <p>Риск: {optimizationResult.risk.toFixed(2)}%</p>
            </>
          ) : (
            <p className="text-gray-500">
              Выполните оптимизацию в разделе "Управление"
            </p>
          )}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <h2 className="text-lg font-semibold mb-4">Эффективная граница</h2>
        {frontierData ? (
          <Line
            data={frontierData}
            options={{
              scales: {
                x: { title: { display: true, text: "Риск (%)" } },
                y: { title: { display: true, text: "Доходность (%)" } },
              },
            }}
          />
        ) : (
          <p className="text-center text-gray-500">
            Выполните оптимизацию для отображения
          </p>
        )}
      </div>
      {optimizationResult && optimizationResult.recommendations?.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mt-6">
          <h2 className="text-lg font-semibold mb-4">Рекомендации</h2>
          <ul className="space-y-2">
            {optimizationResult.recommendations.map((rec, index) => (
              <li key={index} className="p-2 bg-gray-50 rounded-lg">
                {rec.action} {rec.quantity} акций {rec.ticker} (на сумму ₽
                {rec.value.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PortfolioAnalysis;

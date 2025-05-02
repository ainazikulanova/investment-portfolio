import React from "react";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

function PortfolioSummary({ assets, optimizationResult }) {
  const totalValue = assets.reduce(
    (sum, asset) => sum + asset.current_price * asset.quantity,
    0
  );

  const currentPieData = {
    labels: assets.map((asset) => asset.name),
    datasets: [
      {
        data: assets.map(
          (asset) => ((asset.current_price * asset.quantity) / totalValue) * 100
        ),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
      },
    ],
  };

  let optimizedPieData = null;
  let frontierData = null;
  let performance = null;
  let recommendations = [];
  let explanation = "";

  if (optimizationResult) {
    const {
      tickers,
      weights,
      expected_return,
      actual_return,
      risk,
      sharpe,
      frontier,
      recommendations: recs,
      explanation: serverExplanation,
    } = optimizationResult;

    optimizedPieData = {
      labels: tickers,
      datasets: [
        {
          data: weights,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    };

    frontierData = {
      datasets: [
        {
          label: "Эффективная граница",
          data: frontier.map((point) => ({ x: point.risk, y: point.return })),
          borderColor: "#36A2EB",
          fill: false,
        },
        {
          label: "Ваш портфель",
          data: [{ x: risk, y: expected_return }],
          backgroundColor: "#FF6384",
          pointRadius: 8,
        },
      ],
    };

    performance = {
      expected_return,
      actual_return,
      risk,
      sharpe,
    };

    recommendations = recs;
    explanation = serverExplanation;
  }

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 text-center">
        Текущий портфель
      </h2>
      <ul className="space-y-2">
        {assets.map((asset) => {
          const assetValue = asset.current_price * asset.quantity;
          const percentage =
            totalValue > 0 ? ((assetValue / totalValue) * 100).toFixed(2) : 0;
          return (
            <li
              key={asset.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
            >
              <span className="font-medium">{asset.name}</span>
              <span className="text-gray-600">
                {percentage}% (₽{assetValue.toFixed(2)})
              </span>
            </li>
          );
        })}
      </ul>

      {totalValue > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-semibold">Распределение активов</h3>
          <div className="max-w-xs mx-auto">
            <Pie data={currentPieData} />
          </div>
        </div>
      )}

      {optimizationResult && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4 text-center">
            Оптимизированный портфель
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-md font-semibold">
                Оптимальные веса активов
              </h3>
              <div className="max-w-xs mx-auto">
                <Pie data={optimizedPieData} />
              </div>
            </div>
            {frontierData.datasets[0].data.length > 0 && (
              <div>
                <h3 className="text-md font-semibold">Эффективная граница</h3>
                <Line
                  data={frontierData}
                  options={{
                    scales: {
                      x: { title: { display: true, text: "Риск (%)" } },
                      y: { title: { display: true, text: "Доходность (%)" } },
                    },
                  }}
                />
              </div>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-md font-semibold">Характеристики портфеля</h3>
            <p>
              Ожидаемая доходность:{" "}
              {performance.expected_return?.toFixed(2) || 0}% в год
            </p>
            <p>
              Реальная доходность: {performance.actual_return?.toFixed(2) || 0}%
            </p>
            <p>Риск: {performance.risk?.toFixed(2) || 0}% в год</p>
            {performance.sharpe && (
              <p>Коэффициент Шарпа: {performance.sharpe.toFixed(2)}</p>
            )}
            <p className="mt-2">{explanation}</p>
          </div>
          {recommendations.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-semibold">Рекомендации</h3>
              <ul className="space-y-2">
                {recommendations.map((rec) => (
                  <li
                    key={`${rec.ticker}-${rec.action}-${rec.quantity}`}
                    className="p-2 bg-gray-50 rounded-lg"
                  >
                    {rec.action} {rec.quantity} активов {rec.ticker} (на сумму ₽
                    {rec.value.toFixed(2)})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PortfolioSummary;

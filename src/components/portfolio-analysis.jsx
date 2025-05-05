import React from "react";
import { Pie, Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  BarElement,
  CategoryScale,
} from "chart.js";
import { usePortfolio } from "../context/portfolio-context";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  BarElement,
  CategoryScale
);

function PortfolioAnalysis() {
  const { assets, optimizedPortfolio } = usePortfolio();

  // Общая стоимость портфеля
  const totalValue = assets.reduce(
    (sum, asset) => sum + asset.current_price * asset.quantity,
    0
  );

  // Данные для круговой диаграммы текущего распределения активов
  const pieDataCurrent = {
    labels: assets.map((asset) => asset.name),
    datasets: [
      {
        data: assets.map(
          (asset) => ((asset.current_price * asset.quantity) / totalValue) * 100
        ),
        backgroundColor: [
          "#3B82F6",
          "#EF4444",
          "#10B981",
          "#F59E0B",
          "#8B5CF6",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Данные для круговой диаграммы распределения после оптимизации
  const pieDataOptimized = optimizedPortfolio
    ? {
        labels: optimizedPortfolio.tickers,
        datasets: [
          {
            data: optimizedPortfolio.weights.map((weight) => weight * 100),
            backgroundColor: [
              "#3B82F6",
              "#EF4444",
              "#10B981",
              "#F59E0B",
              "#8B5CF6",
            ],
            borderWidth: 1,
          },
        ],
      }
    : null;

  // Данные для графика эффективной границы
  const frontierData = optimizedPortfolio
    ? {
        datasets: [
          {
            label: "Эффективная граница",
            data: optimizedPortfolio.frontier.map((f) => ({
              x: f.risk,
              y: f.return,
            })),
            borderColor: "#36A2EB",
            fill: false,
            tension: 0.1,
          },
          {
            label: "Ваш портфель",
            data: [
              {
                x: optimizedPortfolio.risk,
                y: optimizedPortfolio.expected_return,
              },
            ],
            backgroundColor: "#FF6384",
            pointRadius: 6, // Уменьшен размер точки
            pointStyle: "star",
          },
        ],
      }
    : null;

  // Данные для графика весов после оптимизации
  const weightsData = optimizedPortfolio
    ? {
        labels: optimizedPortfolio.tickers,
        datasets: [
          {
            label: "Веса активов после оптимизации (%)",
            data: optimizedPortfolio.weights.map((weight) => weight * 100),
            backgroundColor: "#10B981",
            borderColor: "#059669",
            borderWidth: 1,
          },
        ],
      }
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Анализ портфеля
      </h1>
      {assets.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Текущий состав портфеля
          </h2>
          <table className="w-full border-collapse bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Актив</th>
                <th className="p-3 text-left">Цена покупки</th>
                <th className="p-3 text-left">Текущая цена</th>
                <th className="p-3 text-left">Количество</th>
                <th className="p-3 text-left">Доходность (%)</th>
                <th className="p-3 text-left">Стоимость (руб.)</th>
                <th className="p-3 text-left">Вес в портфеле (%)</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{asset.name}</td>
                  <td className="p-3">{asset.buy_price.toFixed(2)}</td>
                  <td className="p-3">{asset.current_price.toFixed(2)}</td>
                  <td className="p-3">{asset.quantity}</td>
                  <td className="p-3">
                    {(
                      ((asset.current_price - asset.buy_price) /
                        asset.buy_price) *
                      100
                    ).toFixed(2)}
                    %
                  </td>
                  <td className="p-3">
                    {(asset.current_price * asset.quantity).toFixed(2)}
                  </td>
                  <td className="p-3">
                    {(
                      ((asset.current_price * asset.quantity) / totalValue) *
                      100
                    ).toFixed(2)}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-gray-700">
            <strong>Общая стоимость портфеля:</strong> {totalValue.toFixed(2)}{" "}
            руб.
          </p>
        </div>
      )}

      {/* Графики */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Распределение текущих активов */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Распределение активов (текущий портфель)
          </h2>
          {totalValue > 0 ? (
            <div className="max-w-xs mx-auto">
              <Pie
                data={pieDataCurrent}
                options={{ maintainAspectRatio: false }}
                height={200}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">
              Нет данных для отображения
            </p>
          )}
        </div>

        {/* Распределение после оптимизации */}
        {pieDataOptimized && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Распределение портфеля после оптимизации
            </h2>
            <div className="max-w-xs mx-auto">
              <Pie
                data={pieDataOptimized}
                options={{ maintainAspectRatio: false }}
                height={200}
              />
            </div>
          </div>
        )}

        {/* Метрики */}
        <div className="bg-white p-6 rounded-lg shadow-lg col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Метрики</h2>
          {optimizedPortfolio ? (
            <div className="grid grid-cols-1 gap-2">
              <p className="text-gray-600">
                <strong>Ожидаемая доходность:</strong>{" "}
                {optimizedPortfolio.expected_return?.toFixed(2) || 0}%
              </p>
              <p className="text-gray-600">
                <strong>Реальная доходность:</strong>{" "}
                {optimizedPortfolio.actual_return?.toFixed(2) || 0}%
              </p>
              <p className="text-gray-600">
                <strong>Коэффициент Шарпа:</strong>{" "}
                {optimizedPortfolio.sharpe?.toFixed(2) || 0}
              </p>
              <p className="text-gray-600">
                <strong>Коэффициент Сортино:</strong>{" "}
                {optimizedPortfolio.sortino?.toFixed(2) || 0}
              </p>
              <p className="text-gray-600">
                <strong>Коэффициент Рачева:</strong>{" "}
                {optimizedPortfolio.rachev?.toFixed(2) || 0}
              </p>
              <p className="text-gray-600">
                <strong>Максимальная просадка:</strong>{" "}
                {optimizedPortfolio.max_drawdown?.toFixed(2) || 0}%
              </p>
              <p className="text-gray-600">
                <strong>Коэффициент Калмара:</strong>{" "}
                {optimizedPortfolio.calmar?.toFixed(2) || 0}
              </p>
              <p className="text-gray-600">
                <strong>Коэффициент Стерлинга:</strong>{" "}
                {optimizedPortfolio.sterling?.toFixed(2) || 0}
              </p>
              <p className="text-gray-600">
                <strong>Риск:</strong>{" "}
                {optimizedPortfolio.risk?.toFixed(2) || 0}%
              </p>
            </div>
          ) : (
            <p className="text-gray-500">
              Выполните оптимизацию в разделе "Управление"
            </p>
          )}
        </div>
      </div>

      {/* Эффективная граница */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Эффективная граница
        </h2>
        {frontierData ? (
          <Line
            data={frontierData}
            options={{
              scales: {
                x: { title: { display: true, text: "Риск (%)" } },
                y: { title: { display: true, text: "Доходность (%)" } },
              },
              plugins: {
                legend: { position: "top" },
                tooltip: {
                  callbacks: {
                    label: (context) =>
                      `${
                        context.dataset.label
                      }: Доходность ${context.parsed.y.toFixed(
                        2
                      )}%, Риск ${context.parsed.x.toFixed(2)}%`,
                  },
                },
              },
            }}
            height={200}
            width={400}
          />
        ) : (
          <p className="text-center text-gray-500">
            Выполните оптимизацию для отображения
          </p>
        )}
      </div>

      {/* График весов после оптимизации */}
      {weightsData && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Веса активов после оптимизации
          </h2>
          <Bar
            data={weightsData}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: "Вес (%)" },
                },
                x: {
                  title: { display: true, text: "Тикеры" },
                },
              },
              plugins: {
                legend: { position: "top" },
                tooltip: {
                  callbacks: {
                    label: (context) =>
                      `${context.dataset.label}: ${context.parsed.y.toFixed(
                        2
                      )}%`,
                  },
                },
              },
            }}
            height={200}
            width={400}
          />
        </div>
      )}

      {/* Рекомендации */}
      {optimizedPortfolio && optimizedPortfolio.recommendations?.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Рекомендации
          </h2>
          <table className="w-full border-collapse bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Тикер</th>
                <th className="p-3 text-left">Действие</th>
                <th className="p-3 text-left">Количество</th>
                <th className="p-3 text-left">Сумма (руб.)</th>
              </tr>
            </thead>
            <tbody>
              {optimizedPortfolio.recommendations.map((rec, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3">{rec.ticker}</td>
                  <td className="p-3">{rec.action}</td>
                  <td className="p-3">{rec.quantity}</td>
                  <td className="p-3">{rec.value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PortfolioAnalysis;

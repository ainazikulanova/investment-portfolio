import { useState } from "react";
import axios from "axios";
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
import { Pie, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  Title
);

function PortfolioBuilder() {
  const [model, setModel] = useState("markowitz");
  const [targetReturn, setTargetReturn] = useState(0);
  const [riskLevel, setRiskLevel] = useState(0.5);
  const [result, setResult] = useState(null);

  const optimizePortfolio = async () => {
    try {
      const response = await axios.get(
        "https://investment-portfolio-z2zm.onrender.com/api/optimize/",
        {
          params: { model, target_return: targetReturn, risk_level: riskLevel },
          headers: { "Content-Type": "application/json" },
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error("Error optimizing portfolio:", error);
    }
  };

  const pieData = result
    ? {
        labels: Object.keys(result.weights),
        datasets: [
          {
            data: Object.values(result.weights).map((w) => w * 100),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
            ],
          },
        ],
      }
    : null;

  const frontierData = result
    ? {
        labels: result.frontier.map((f) => f.return.toFixed(2)),
        datasets: [
          {
            label: "Эффективная граница",
            data: result.frontier.map((f) => ({ x: f.risk, y: f.return })),
            borderColor: "#36A2EB",
            fill: false,
          },
        ],
      }
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Построение портфеля
      </h1>

      <div className="mb-6">
        <label className="block mb-2">Модель:</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        >
          <option value="markowitz">Марковиц</option>
          <option value="sharpe">Шарп</option>
        </select>

        <label className="block mb-2">Ожидаемая доходность (%):</label>
        <input
          type="number"
          value={targetReturn}
          onChange={(e) => setTargetReturn(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />

        <label className="block mb-2">Уровень риска (0-1):</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />

        <button
          onClick={optimizePortfolio}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition cursor-pointer"
        >
          Оптимизировать
        </button>
      </div>

      {result && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Результат:</h2>
          <p className="mb-4">{result.explanation}</p>

          <h3 className="text-lg font-semibold mb-2">Веса активов:</h3>
          {pieData && (
            <div className="w-1/2 mx-auto mb-6">
              <Pie data={pieData} />
            </div>
          )}

          <h3 className="text-lg font-semibold mb-2">Эффективная граница:</h3>
          {frontierData && (
            <div className="w-full mb-6">
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
      )}
    </div>
  );
}

export default PortfolioBuilder;

import React, { useState } from "react";
import axios from "axios";
import { usePortfolio } from "../context/portfolio-context";
import PortfolioTable from "./portfolio-table";
import PortfolioAnalysis from "./portfolio-analysis";

function PortfolioForm() {
  const {
    assets,
    addAsset,
    optimizedPortfolio,
    optimizePortfolio,
    removeAsset,
  } = usePortfolio();
  const [formData, setFormData] = useState({
    name: "",
    buy_price: "",
    current_price: "",
    quantity: "",
    instrument_type: "shares",
  });
  const [tickers, setTickers] = useState("");
  const [model, setModel] = useState("markowitz");
  const [targetReturn, setTargetReturn] = useState(0.05);
  const [riskLevel, setRiskLevel] = useState(0.02);
  const [sortinoL, setSortinoL] = useState(0.0);
  const [error, setError] = useState("");
  const [showManualPriceInput, setShowManualPriceInput] = useState(false);
  const BASE_URL = "https://investment-portfolio-z2zm.onrender.com";

  const TICKER_MAPPING = {
    sberbank: "SBER",
    gazprom: "GAZP",
    lukoil: "LKOH",
    yandex: "YDEX",
    rosneft: "ROSN",
    nornickel: "GMKN",
    tatneft: "TATN",
    novatek: "NVTK",
    ofz26207: "SU26207RMFS9",
    sberbond: "RU000A0JX0J2",
    finamrussia: "FXRL",
    sberetf: "SBSP",
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setError("");
    setShowManualPriceInput(false);

    const tickerLower = formData.name.toLowerCase();
    const normalizedTicker =
      TICKER_MAPPING[tickerLower] || tickerLower.toUpperCase();

    const buyPrice = parseFloat(formData.buy_price);
    const quantity = parseInt(formData.quantity);
    if (isNaN(buyPrice) || buyPrice <= 0) {
      setError("Цена покупки должна быть больше 0");
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      setError("Количество должно быть больше 0");
      return;
    }

    let currentPrice;
    try {
      const priceResponse = await axios.get(
        `${BASE_URL}/api/price/?ticker=${normalizedTicker}&instrument_type=${formData.instrument_type}`
      );
      currentPrice = priceResponse.data.price;

      if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) {
        setError(
          `Не удалось получить текущую цену для ${normalizedTicker}: цена недоступна. Введите цену вручную.`
        );
        setShowManualPriceInput(true);
        return;
      }
    } catch (error) {
      console.error("Error fetching price:", error);
      const errorMessage = error.response?.data?.error || "Неизвестная ошибка";
      setError(
        `Не удалось загрузить цену для ${normalizedTicker}: ${errorMessage}. Введите цену вручную.`
      );
      setShowManualPriceInput(true);
      return;
    }

    try {
      const newAsset = {
        name: normalizedTicker,
        buy_price: buyPrice,
        current_price: currentPrice,
        quantity: quantity,
        ticker: normalizedTicker,
        instrument_type: formData.instrument_type,
      };
      await addAsset(newAsset);
      setFormData({
        name: "",
        buy_price: "",
        current_price: "",
        quantity: "",
        instrument_type: "shares",
      });
    } catch (error) {
      console.error("Error adding asset:", error);
      setError(
        `Не удалось добавить актив ${normalizedTicker}: ${error.message}`
      );
    }
  };

  const handleManualPriceSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const tickerLower = formData.name.toLowerCase();
    const normalizedTicker =
      TICKER_MAPPING[tickerLower] || tickerLower.toUpperCase();

    const currentPrice = parseFloat(formData.current_price);
    const buyPrice = parseFloat(formData.buy_price);
    const quantity = parseInt(formData.quantity);

    if (isNaN(currentPrice) || currentPrice <= 0) {
      setError("Текущая цена должна быть больше 0");
      return;
    }
    if (isNaN(buyPrice) || buyPrice <= 0) {
      setError("Цена покупки должна быть больше 0");
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      setError("Количество должно быть больше 0");
      return;
    }

    try {
      const newAsset = {
        name: normalizedTicker,
        buy_price: buyPrice,
        current_price: currentPrice,
        quantity: quantity,
        ticker: normalizedTicker,
        instrument_type: formData.instrument_type,
      };
      await addAsset(newAsset);
      setFormData({
        name: "",
        buy_price: "",
        current_price: "",
        quantity: "",
        instrument_type: "shares",
      });
      setShowManualPriceInput(false);
    } catch (error) {
      console.error("Error adding asset with manual price:", error);
      setError(
        `Не удалось добавить актив ${normalizedTicker}: ${error.message}`
      );
    }
  };

  const handleDeleteAsset = async (id) => {
    setError("");
    try {
      const assetToDelete = assets.find((asset) => asset.id === id);
      if (!assetToDelete) {
        setError("Актив не найден");
        return;
      }
      await removeAsset(id);
    } catch (error) {
      console.error("Error deleting asset:", error);
      setError(`Не удалось удалить актив: ${error.message}`);
    }
  };

  const handleOptimize = async (e) => {
    e.preventDefault();
    setError("");

    const tickerList = tickers
      .split(",")
      .map((ticker) => ticker.trim())
      .filter((ticker) => ticker !== "");
    if (tickerList.length < 2) {
      setError("Введите как минимум 2 тикера для оптимизации.");
      return;
    }

    const currentPortfolio = assets.map((asset) => ({
      ticker: asset.ticker,
      quantity: asset.quantity,
      instrument_type: asset.instrument_type,
    }));

    console.log("Sending optimization request:", {
      tickers: tickerList,
      model,
      targetReturn,
      riskLevel,
      sortinoL,
      currentPortfolio,
    });

    try {
      await optimizePortfolio(
        tickerList,
        model,
        targetReturn,
        riskLevel,
        currentPortfolio,
        model === "sortino" ? sortinoL : undefined
      );
      setError("");
    } catch (error) {
      console.error("Optimization failed:", error.response?.data);
      setError(error.response?.data?.error || "Ошибка оптимизации портфеля.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Добавить активы и оптимизировать портфель
      </h2>

      <form
        className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8"
        onSubmit={
          showManualPriceInput ? handleManualPriceSubmit : handleAddAsset
        }
      >
        <input
          type="text"
          name="name"
          placeholder="Название актива"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        />
        <select
          name="instrument_type"
          value={formData.instrument_type}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        >
          <option value="shares">Акции</option>
          <option value="bonds">Облигации</option>
          <option value="etf">ETF</option>
        </select>
        <input
          type="number"
          name="buy_price"
          placeholder="Цена покупки"
          value={formData.buy_price}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        />
        <input
          type="number"
          name="quantity"
          placeholder="Количество"
          value={formData.quantity}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        />
        {showManualPriceInput && (
          <input
            type="number"
            name="current_price"
            placeholder="Текущая цена (вручную)"
            value={formData.current_price}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />
        )}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 cursor-pointer"
        >
          Добавить актив
        </button>
      </form>

      <form
        className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8"
        onSubmit={handleOptimize}
      >
        <input
          type="text"
          placeholder="Тикеры (через запятую)"
          value={tickers}
          onChange={(e) => setTickers(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
        />
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
        >
          <option value="markowitz">Марковиц</option>
          <option value="sharpe">Шарп</option>
          <option value="sortino">Сортино</option>
          <option value="rachev">Рачева</option>
          <option value="max_drawdown">Максимальная просадка</option>
        </select>
        {model === "markowitz" && (
          <input
            type="number"
            placeholder="Целевая доходность (%)"
            value={targetReturn * 100}
            onChange={(e) => setTargetReturn(e.target.value / 100)}
            step="0.1"
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
          />
        )}
        <input
          type="number"
          placeholder="Безрисковая ставка (%)"
          value={riskLevel * 100}
          onChange={(e) => setRiskLevel(e.target.value / 100)}
          step="0.1"
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
        />
        {model === "sortino" && (
          <input
            type="number"
            placeholder="Мин. доходность L (%)"
            value={sortinoL * 100}
            onChange={(e) => setSortinoL(e.target.value / 100)}
            step="0.1"
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
          />
        )}
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200 cursor-pointer"
        >
          Оптимизировать
        </button>
      </form>

      {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}

      {assets.length > 0 && (
        <PortfolioTable assets={assets} onDeleteAsset={handleDeleteAsset} />
      )}

      {optimizedPortfolio && (
        <div className="mt-6 p-6 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-green-800">
            Результаты оптимизации
          </h3>
          <p className="text-gray-700">
            <strong>Ожидаемая доходность:</strong>{" "}
            {(optimizedPortfolio.expected_return || 0).toFixed(2)}%
          </p>
          <p className="text-gray-700">
            <strong>Реальная доходность портфеля:</strong>{" "}
            {(optimizedPortfolio.actual_return || 0).toFixed(2)}%
          </p>
          <p className="text-gray-700">
            <strong>Риск:</strong> {(optimizedPortfolio.risk || 0).toFixed(2)}%
          </p>
          <p className="text-gray-700">
            <strong>Коэффициент Шарпа:</strong>{" "}
            {(optimizedPortfolio.sharpe || 0).toFixed(2)}
          </p>
          <p className="text-gray-700">
            <strong>Веса активов:</strong>{" "}
            {optimizedPortfolio.tickers.map((ticker, index) => (
              <span key={ticker}>
                {ticker}: {(optimizedPortfolio.weights[index] * 100).toFixed(2)}
                %{index < optimizedPortfolio.tickers.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
          <p className="text-gray-700 mt-2">
            <strong>Описание:</strong> {optimizedPortfolio.explanation}
          </p>
          <div className="mt-6"></div>
        </div>
      )}
    </div>
  );
}

export default PortfolioForm;

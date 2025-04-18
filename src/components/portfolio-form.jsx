import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePortfolio } from "../context/portfolio-context";

function PortfolioForm() {
  const { assets, addAsset, optimizePortfolio, optimizationResult } =
    usePortfolio();
  const [formData, setFormData] = useState({
    name: "",
    buy_price: "",
    current_price: "",
    quantity: "",
  });
  const [tickers, setTickers] = useState("");
  const [model, setModel] = useState("markowitz");
  const [targetReturn, setTargetReturn] = useState(0.1);
  const [error, setError] = useState("");
  const [currentPrice, setCurrentPrice] = useState(null);
  const BASE_URL = "https://investment-portfolio-z2zm.onrender.com";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchCurrentPrice = async () => {
      const tickerLower = formData.name.toLowerCase();
      const normalizedTicker =
        TICKER_MAPPING[tickerLower] || tickerLower.toUpperCase();

      if (!normalizedTicker) {
        setCurrentPrice(null);
        return;
      }

      try {
        const priceResponse = await axios.get(
          `${BASE_URL}/api/price/?ticker=${normalizedTicker}`
        );
        const price = priceResponse.data.price;
        setCurrentPrice(price);
        setFormData((prev) => ({ ...prev, current_price: price }));
      } catch (error) {
        console.error("Error fetching price:", error);
        setCurrentPrice(null);
        setFormData((prev) => ({ ...prev, current_price: "" }));
      }
    };

    fetchCurrentPrice();
  }, [formData.name]);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setError("");

    const tickerLower = formData.name.toLowerCase();
    const normalizedTicker =
      TICKER_MAPPING[tickerLower] || tickerLower.toUpperCase();

    try {
      const priceResponse = await axios.get(
        `${BASE_URL}/api/price/?ticker=${normalizedTicker}`
      );
      const currentPrice = priceResponse.data.price;

      const newAsset = {
        name: normalizedTicker,
        buy_price: parseFloat(formData.buy_price) || 0,
        current_price: currentPrice,
        quantity: parseInt(formData.quantity) || 0,
        ticker: normalizedTicker,
      };
      await addAsset(newAsset);
      setFormData({ name: "", buy_price: "", current_price: "", quantity: "" });
      setCurrentPrice(null);
    } catch (error) {
      console.error("Error fetching price or adding asset:", error);
      setError(
        "Не удалось загрузить цену или добавить актив. Введите цену вручную."
      );
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
      setError("Введите как минимум 2 непустых тикера для оптимизации.");
      return;
    }

    const currentPortfolio = assets.map((asset) => ({
      ticker: asset.ticker,
      quantity: asset.quantity,
    }));

    console.log("Sending optimization request:", {
      tickers: tickerList,
      model,
      targetReturn,
      riskLevel: 0.02,
      currentPortfolio,
    });

    try {
      await optimizePortfolio(
        tickerList,
        model,
        targetReturn,
        0.02,
        currentPortfolio
      );
      setError("");
    } catch (error) {
      console.error("Optimization failed:", error.response?.data);
      setError(error.response?.data?.error || "Ошибка оптимизации портфеля.");
    }
  };

  const TICKER_MAPPING = {
    sberbank: "SBER",
    gazprom: "GAZP",
    lukoil: "LKOH",
    yandex: "YNDX",
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Добавить активы и оптимизировать портфель
      </h2>
      <form
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        onSubmit={handleAddAsset}
      >
        <div className="flex flex-col">
          <input
            type="text"
            name="name"
            placeholder="Тикер актива"
            value={formData.name}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-lg p-2"
          />
          {currentPrice !== null && (
            <p className="text-sm text-gray-600 mt-1">
              Текущая цена: {currentPrice}
            </p>
          )}
        </div>
        <input
          type="number"
          name="buy_price"
          placeholder="Цена покупки"
          value={formData.buy_price}
          onChange={handleChange}
          required
          className="border border-gray-300 rounded-lg p-2"
        />
        <input
          type="number"
          name="quantity"
          placeholder="Количество"
          value={formData.quantity}
          onChange={handleChange}
          required
          className="border border-gray-300 rounded-lg p-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 cursor-pointer"
        >
          Добавить актив
        </button>
      </form>

      <form
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        onSubmit={handleOptimize}
      >
        <input
          type="text"
          placeholder="Тикеры"
          value={tickers}
          onChange={(e) => setTickers(e.target.value)}
          required
          className="border border-gray-300 rounded-lg p-2"
        />
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="border border-gray-300 rounded-lg p-2"
        >
          <option value="markowitz">Марковиц</option>
          <option value="sharpe">Шарп</option>
        </select>
        {model === "markowitz" && (
          <input
            type="number"
            placeholder="Целевая доходность (%)"
            value={targetReturn * 100}
            onChange={(e) => setTargetReturn(e.target.value / 100)}
            step="0.1"
            className="border border-gray-300 rounded-lg p-2"
          />
        )}
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 cursor-pointer"
        >
          Оптимизировать
        </button>
      </form>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {optimizationResult && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Результаты оптимизации</h3>
          <p>
            <strong>Ожидаемая доходность:</strong>{" "}
            {optimizationResult.return.toFixed(2)}%
          </p>
          <p>
            <strong>Риск:</strong> {optimizationResult.risk.toFixed(2)}%
          </p>
          {optimizationResult.sharpe && (
            <p>
              <strong>Коэффициент Шарпа:</strong>{" "}
              {optimizationResult.sharpe.toFixed(2)}
            </p>
          )}
          <p>
            <strong>Бета портфеля:</strong> {optimizationResult.beta.toFixed(2)}
          </p>
          <p>
            <strong>Альфа портфеля:</strong>{" "}
            {optimizationResult.alpha.toFixed(2)}
          </p>
          <h4 className="font-semibold mt-4">Веса активов:</h4>
          <ul>
            {optimizationResult.tickers.map((ticker, index) => (
              <li key={ticker}>
                {ticker}: {(optimizationResult.weights[index] * 100).toFixed(2)}
                %
              </li>
            ))}
          </ul>
          {optimizationResult.recommendations.length > 0 && (
            <>
              <h4 className="font-semibold mt-4">Рекомендации:</h4>
              <ul>
                {optimizationResult.recommendations.map((rec, index) => (
                  <li key={index}>
                    {rec.action} {rec.quantity} {rec.ticker} (Стоимость:{" "}
                    {rec.value.toFixed(2)})
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PortfolioForm;

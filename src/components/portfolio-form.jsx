/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePortfolio } from "../context/portfolio-context";

function PortfolioForm() {
  const { assets, optimizePortfolio } = usePortfolio();
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
  const BASE_URL = "https://investment-portfolio-z2zm.onrender.com";

  useEffect(() => {
    if (formData.name) {
      axios
        .get(`${BASE_URL}/api/price/?ticker=${formData.name}`)
        .then((response) => {
          setFormData((prev) => ({
            ...prev,
            current_price: response.data.price,
          }));
        })
        .catch((error) => {
          console.error("Error fetching price:", error);
          setError("Не удалось загрузить текущую цену. Введите вручную.");
        });
    }
  }, [formData.name]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAsset = (e) => {
    e.preventDefault();
    setError("");
    const newAsset = {
      name: formData.name,
      buy_price: parseFloat(formData.buy_price),
      current_price: parseFloat(formData.current_price),
      quantity: parseInt(formData.quantity),
      ticker: formData.name,
    };
    const { addAsset } = usePortfolio();
    addAsset(newAsset);
    setFormData({ name: "", buy_price: "", current_price: "", quantity: "" });
  };

  const handleOptimize = async (e) => {
    e.preventDefault();
    setError("");
    const tickerList = tickers.split(",").map((ticker) => ticker.trim());
    if (tickerList.length < 2) {
      setError("Введите как минимум 2 тикера для оптимизации.");
      return;
    }

    // Формируем текущий портфель
    const currentPortfolio = assets.map((asset) => ({
      ticker: asset.ticker,
      quantity: asset.quantity,
    }));

    try {
      await optimizePortfolio(
        tickerList,
        model,
        targetReturn,
        0.02,
        currentPortfolio
      );
    } catch (error) {
      setError(error.response?.data?.error || "Ошибка оптимизации портфеля.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Добавить активы и оптимизировать портфель
      </h2>
      <form
        className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
        onSubmit={handleAddAsset}
      >
        <input
          type="text"
          name="name"
          placeholder="Тикер актива (например, AAPL)"
          value={formData.name}
          onChange={handleChange}
          required
          className="border border-gray-300 rounded-lg p-2"
        />
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
          name="current_price"
          placeholder="Текущая цена"
          value={formData.current_price}
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
          placeholder="Тикеры (например, AAPL,TSLA,MSFT)"
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
    </div>
  );
}

export default PortfolioForm;

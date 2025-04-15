import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const PortfolioContext = createContext();

export function PortfolioProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [error, setError] = useState("");
  const API_URL = "https://investment-portfolio-z2zm.onrender.com/api";

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API_URL}/assets/`, {
        headers: { "Content-Type": "application/json" },
      });
      setAssets(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets([]);
      setError("Не удалось загрузить активы");
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const addAsset = async (newAsset) => {
    try {
      const response = await axios.post(`${API_URL}/assets/`, newAsset, {
        headers: { "Content-Type": "application/json" },
      });
      setAssets((prevAssets) => [...prevAssets, response.data]);
      setError("");
    } catch (error) {
      console.error("Error adding asset:", error);
      setError("Не удалось добавить актив");
    }
  };

  const deleteAsset = async (id) => {
    try {
      await axios.delete(`${API_URL}/assets/${id}/`, {
        headers: { "Content-Type": "application/json" },
      });
      setAssets((prevAssets) => prevAssets.filter((asset) => asset.id !== id));
      setError("");
    } catch (error) {
      console.error("Error deleting asset:", error);
      const errorMessage = error.response?.data?.error || "Неизвестная ошибка";
      setError(`Не удалось удалить актив: ${errorMessage}`);
      if (error.response?.status === 404) {
        setAssets((prevAssets) =>
          prevAssets.filter((asset) => asset.id !== id)
        );
      }
    }
  };

  const optimizePortfolio = async (
    tickers,
    model,
    targetReturn,
    riskLevel,
    currentPortfolio
  ) => {
    try {
      const response = await axios.post(`${API_URL}/optimize/`, {
        tickers: tickers.join(","),
        model,
        target_return: targetReturn,
        risk_level: riskLevel,
        current_portfolio: currentPortfolio,
      });
      setOptimizationResult(response.data);
      setError("");
      return response.data;
    } catch (error) {
      console.error("Error optimizing portfolio:", error);
      const errorMessage = error.response?.data?.error || "Неизвестная ошибка";
      setError(`Не удалось оптимизировать портфель: ${errorMessage}`);
      throw error;
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        assets,
        addAsset,
        deleteAsset,
        optimizationResult,
        optimizePortfolio,
        error,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}

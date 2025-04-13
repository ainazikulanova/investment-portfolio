import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const PortfolioContext = createContext();

export function PortfolioProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const API_URL = "https://investment-portfolio-z2zm.onrender.com/api";

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API_URL}/assets/`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Assets fetched:", response.data);
      setAssets(response.data);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets([]);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const addAsset = async (newAsset) => {
    try {
      const response = await axios.post(`${API_URL}/assets/`, newAsset, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Asset added:", response.data);
      setAssets((prevAssets) => [...prevAssets, response.data]);
    } catch (error) {
      console.error("Error adding asset:", error);
    }
  };

  const deleteAsset = async (id) => {
    try {
      await axios.delete(`${API_URL}/assets/${id}/`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Asset deleted:", id);
      setAssets((prevAssets) => prevAssets.filter((asset) => asset.id !== id));
    } catch (error) {
      console.error("Error deleting asset:", error);
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
      return response.data;
    } catch (error) {
      console.error("Error optimizing portfolio:", error);
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
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}

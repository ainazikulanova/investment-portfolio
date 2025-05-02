import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const PortfolioContext = createContext();

const BASE_URL = "https://investment-portfolio-z2zm.onrender.com";

export const PortfolioProvider = ({ children }) => {
  const [assets, setAssets] = useState([]);
  const [optimizedPortfolio, setOptimizedPortfolio] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/assets/`);
        setAssets(response.data);
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      }
    };
    fetchAssets();
  }, []);

  const addAsset = async (asset) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/assets/`, asset);
      setAssets([...assets, response.data]);
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to add asset");
    }
  };

  const optimizePortfolio = async (
    tickers,
    model,
    targetReturn,
    riskLevel,
    currentPortfolio,
    sortinoL
  ) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/optimize/`, {
        tickers: tickers.join(","),
        model,
        target_return: targetReturn,
        risk_level: riskLevel,
        current_portfolio: currentPortfolio,
        ...(sortinoL !== undefined && { sortino_l: sortinoL }),
      });
      setOptimizedPortfolio(response.data);
    } catch (error) {
      throw new Error(error.response?.data?.error || "Optimization failed");
    }
  };

  return (
    <PortfolioContext.Provider
      value={{ assets, addAsset, optimizedPortfolio, optimizePortfolio }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => React.useContext(PortfolioContext);

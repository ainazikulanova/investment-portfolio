import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const PortfolioContext = createContext();

export function PortfolioProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const API_URL = "https://investment-portfolio-z2zm.onrender.com/api"; // Новый URL бэкенда

  useEffect(() => {
    axios
      .get(`${API_URL}/assets/`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        console.log("Assets fetched:", response.data);
        setAssets(response.data);
      })
      .catch((error) => console.error("Error fetching assets:", error));
  }, []);

  const addAsset = (newAsset) => {
    console.log("Adding asset:", newAsset);
    axios
      .post(`${API_URL}/assets/`, newAsset, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        console.log("Asset added:", response.data);
        setAssets([...assets, response.data]);
      })
      .catch((error) => console.error("Error adding asset:", error));
  };

  const deleteAsset = (id) => {
    console.log("Deleting asset:", id);
    axios
      .delete(`${API_URL}/assets/${id}/`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(() => {
        setAssets(assets.filter((asset) => asset.id !== id));
      })
      .catch((error) => console.error("Error deleting asset:", error));
  };

  return (
    <PortfolioContext.Provider value={{ assets, addAsset, deleteAsset }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}

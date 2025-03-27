import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const PortfolioContext = createContext();

export function PortfolioProvider({ children }) {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/assets/", {
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
      .post("http://127.0.0.1:8000/api/assets/", newAsset, {
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
      .delete(`http://127.0.0.1:8000/api/assets/${id}/`, {
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

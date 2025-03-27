import { useState, useEffect } from "react";
import axios from "axios";

function PortfolioForm({ onAddAsset }) {
  const [formData, setFormData] = useState({
    name: "",
    buy_price: "",
    current_price: "",
    quantity: "",
  });

  useEffect(() => {
    if (formData.name) {
      axios
        .get(`http://127.0.0.1:8000/api/price/${formData.name}/`)
        .then((response) => {
          setFormData((prev) => ({
            ...prev,
            current_price: response.data.price,
          }));
        })
        .catch((error) => console.error("Error fetching price:", error));
    }
  }, [formData.name]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddAsset({
      name: formData.name,
      buy_price: parseFloat(formData.buy_price),
      current_price: parseFloat(formData.current_price),
      quantity: parseInt(formData.quantity),
    });
    setFormData({ name: "", buy_price: "", current_price: "", quantity: "" });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
    >
      <input
        type="text"
        name="name"
        placeholder="Название актива (например, SBER)"
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
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
      >
        Добавить актив
      </button>
    </form>
  );
}

export default PortfolioForm;

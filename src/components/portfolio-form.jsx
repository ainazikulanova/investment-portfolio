import { useState } from "react";

function PortfolioForm({ onAddAsset }) {
  const [formData, setFormData] = useState({
    name: "",
    buyPrice: "",
    currentPrice: "",
    quantity: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddAsset({
      id: Date.now(), // Временный ID
      name: formData.name,
      buyPrice: parseFloat(formData.buyPrice),
      currentPrice: parseFloat(formData.currentPrice),
      quantity: parseInt(formData.quantity),
    });
    setFormData({ name: "", buyPrice: "", currentPrice: "", quantity: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
      <input
        type="text"
        name="name"
        placeholder="Название актива (например, SBER)"
        value={formData.name}
        onChange={handleChange}
        required
        className="border border-gray-300 rounded-lg p-2 flex-1"
      />
      <input
        type="number"
        name="buyPrice"
        placeholder="Цена покупки"
        value={formData.buyPrice}
        onChange={handleChange}
        required
        className="border border-gray-300 rounded-lg p-2 flex-1"
      />
      <input
        type="number"
        name="currentPrice"
        placeholder="Текущая цена"
        value={formData.currentPrice}
        onChange={handleChange}
        required
        className="border border-gray-300 rounded-lg p-2 flex-1"
      />
      <input
        type="number"
        name="quantity"
        placeholder="Количество"
        value={formData.quantity}
        onChange={handleChange}
        required
        className="border border-gray-300 rounded-lg p-2 flex-1"
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

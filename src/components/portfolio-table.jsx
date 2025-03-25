function PortfolioTable({ assets }) {
  const calculateReturn = (buyPrice, currentPrice) => {
    return (((currentPrice - buyPrice) / buyPrice) * 100).toFixed(2);
  };

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 p-2">Актив</th>
          <th className="border border-gray-300 p-2">Цена покупки</th>
          <th className="border border-gray-300 p-2">Текущая цена</th>
          <th className="border border-gray-300 p-2">Количество</th>
          <th className="border border-gray-300 p-2">Доходность (%)</th>
        </tr>
      </thead>
      <tbody>
        {assets.map((asset) => (
          <tr key={asset.id} className="text-center">
            <td className="border border-gray-300 p-2">{asset.name}</td>
            <td className="border border-gray-300 p-2">{asset.buyPrice}</td>
            <td className="border border-gray-300 p-2">{asset.currentPrice}</td>
            <td className="border border-gray-300 p-2">{asset.quantity}</td>
            <td className="border border-gray-300 p-2">
              {calculateReturn(asset.buyPrice, asset.currentPrice)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PortfolioTable;

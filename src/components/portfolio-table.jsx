function PortfolioTable({ assets, onDeleteAsset }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white shadow-md rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Актив</th>
            <th className="p-3 text-left">Цена покупки</th>
            <th className="p-3 text-left">Текущая цена</th>
            <th className="p-3 text-left">Количество</th>
            <th className="p-3 text-left">Доходность (%)</th>
            <th className="p-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{asset.name}</td>
              <td className="p-3">{asset.buy_price}</td>
              <td className="p-3">{asset.current_price}</td>
              <td className="p-3">{asset.quantity}</td>
              <td className="p-3">
                {(
                  ((asset.current_price - asset.buy_price) / asset.buy_price) *
                  100
                ).toFixed(2)}
                %
              </td>
              <td className="p-3">
                <button
                  onClick={() => onDeleteAsset(asset.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition cursor-pointer"
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PortfolioTable;

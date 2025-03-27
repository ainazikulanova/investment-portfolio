function PortfolioSummary({ assets }) {
  const totalValue = assets.reduce(
    (sum, asset) => sum + asset.currentPrice * asset.quantity,
    0
  );

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 text-center">
        Распределение активов
      </h2>
      <ul className="space-y-2">
        {assets.map((asset) => {
          const assetValue = asset.currentPrice * asset.quantity;
          const percentage = ((assetValue / totalValue) * 100).toFixed(2);
          return (
            <li
              key={asset.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
            >
              <span className="font-medium">{asset.name}</span>
              <span className="text-gray-600">
                {percentage}% (₽{assetValue.toFixed(2)})
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PortfolioSummary;

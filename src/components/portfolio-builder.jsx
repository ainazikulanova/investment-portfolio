function PortfolioBuilder() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Построение портфеля
      </h1>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Выбор модели</h2>
        <select className="border border-gray-300 rounded-lg p-2 w-full md:w-1/3">
          <option>Марковиц</option>
          <option>Шарп</option>
        </select>
      </div>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Параметры</h2>
        <p className="text-center text-gray-500">
          [Форма для параметров будет добавлена]
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Новое распределение</h2>
        <p className="text-center text-gray-500">[Таблица будет добавлена]</p>
      </div>
    </div>
  );
}

export default PortfolioBuilder;

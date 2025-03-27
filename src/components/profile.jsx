function Profile() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Профиль</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Настройки</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">API ключ</label>
            <input
              type="text"
              placeholder="Введите API ключ"
              className="border border-gray-300 rounded-lg p-2 w-full"
            />
          </div>
          <div>
            <label className="block mb-2">Валюта</label>
            <select className="border border-gray-300 rounded-lg p-2 w-full">
              <option>RUB</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </div>
          <div>
            <label className="block mb-2">Язык</label>
            <select className="border border-gray-300 rounded-lg p-2 w-full">
              <option>Русский</option>
              <option>English</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

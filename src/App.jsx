import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { PortfolioProvider } from "./context/portfolio-contex";
import Portfolio from "./components/portfolio";
import Dashboard from "./components/dashboard";
import PortfolioAnalysis from "./components/portfolio-analysis";
import PortfolioBuilder from "./components/portfolio-builder";
import History from "./components/history";
import Profile from "./components/profile";

function App() {
  return (
    <PortfolioProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <nav className="bg-blue-600 text-white p-4">
            <ul className="flex space-x-6 justify-center">
              <li>
                <Link to="/" className="hover:underline">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:underline">
                  Управление
                </Link>
              </li>
              <li>
                <Link to="/analysis" className="hover:underline">
                  Анализ
                </Link>
              </li>
              <li>
                <Link to="/builder" className="hover:underline">
                  Построение
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:underline">
                  История
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:underline">
                  Профиль
                </Link>
              </li>
            </ul>
          </nav>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/analysis" element={<PortfolioAnalysis />} />
            <Route path="/builder" element={<PortfolioBuilder />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </PortfolioProvider>
  );
}

export default App;

import { useLaunchParams, miniApp, useSignal } from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { HistoryPage } from '@/pages/HistoryPage'; // Именованный импорт
import { IndexPage } from '@/pages/IndexPage/IndexPage'; // Именованный импорт
import { LeaderboardPage } from '@/pages/LeaderboardPage'; // Именованный импорт
import { LanguageProvider } from './LanguageContext';

export function App() {
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);

  return (
    <LanguageProvider>
      <AppRoot
        appearance={isDark ? 'dark' : 'light'}
        platform={['macos', 'ios'].includes(lp.platform) ? 'ios' : 'base'}
      >
        <HashRouter>
          <Routes>
           {/* Маршруты для всех страниц */}
           <Route path="/" element={<IndexPage />} /> {/* Главная страница */}
            <Route path="/history" element={<HistoryPage />} /> {/* Страница истории */}
            <Route path="/leaderboard" element={<LeaderboardPage />} /> {/* Страница истории */}
            <Route path="*" element={<Navigate to="/" />} /> {/* Перенаправление на главную страницу */}
          </Routes>
        </HashRouter>
      </AppRoot>
    </LanguageProvider>
  );
}

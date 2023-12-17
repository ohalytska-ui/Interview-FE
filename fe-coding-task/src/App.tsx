import React, { FC } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Home from 'pages/home';

import './App.css';

const App: FC = () => {
  const router = createBrowserRouter([
    {
      path: '/*',
      element: <Home />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;

import { createHashRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/app/dashboard/DashboardPage';
import { TrainingPage } from '@/app/training/TrainingPage';
import { WorkoutPage } from '@/app/training/WorkoutPage';
import { PainPage } from '@/app/pain/PainPage';
import { TodosPage } from '@/app/todos/TodosPage';
import { SettingsPage } from '@/app/settings/SettingsPage';

/**
 * Hash routing keeps the app deployable to GitHub Pages (or any static host)
 * with no server-side rewrite rules.
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'training', element: <TrainingPage /> },
      { path: 'training/:weekId', element: <WorkoutPage /> },
      { path: 'training/:weekId/:workoutId', element: <WorkoutPage /> },
      { path: 'schmerz', element: <PainPage /> },
      { path: 'todos', element: <TodosPage /> },
      { path: 'einstellungen', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
